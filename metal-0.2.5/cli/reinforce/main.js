"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReinforceCLI = void 0;
const input_1 = require("./input");
const assert_1 = __importDefault(require("assert"));
const intermediate_1 = require("../intermediate");
const output_1 = require("./output");
const services_1 = require("../../services");
const symbol_sdk_1 = require("symbol-sdk");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const common_1 = require("../common");
var ReinforceCLI;
(function (ReinforceCLI) {
    const buildReferenceTxPool = async (command, type, sourcePubAccount, targetPubAccount, targetId, payload, additive) => {
        const additiveBytes = additive ? symbol_sdk_1.Convert.utf8ToUint8(additive) : undefined;
        const txs = command === "forge"
            ? (await common_1.metalService.createForgeTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additiveBytes)).txs
            : await common_1.metalService.createDestroyTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additiveBytes);
        return txs.reduce((acc, curr) => acc.set(curr.scopedMetadataKey.toHex(), curr), new Map());
    };
    const retrieveBatches = async (intermediateTxs, referenceTxPool) => {
        const { networkType, networkGenerationHash } = await common_1.symbolService.getNetwork();
        const networkGenerationHashBytes = Array.from(symbol_sdk_1.Convert.hexToUint8(networkGenerationHash));
        const signerPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(intermediateTxs.signerPublicKey, networkType);
        (0, assert_1.default)(intermediateTxs.txs);
        return intermediateTxs.txs.map((tx) => {
            // Collect inner transactions
            const innerTxs = tx.keys.map((key) => {
                const referenceTx = referenceTxPool.get(key);
                if (!referenceTx) {
                    throw new Error("Input file is wrong or broken.");
                }
                return referenceTx;
            });
            // Rebuild aggregate transaction with signature
            const aggregateTx = symbol_sdk_1.AggregateTransaction.createComplete(symbol_sdk_1.Deadline.createFromAdjustedValue(tx.deadline), innerTxs, networkType, [], new symbol_sdk_1.UInt64(tx.maxFee), tx.signature, signerPubAccount);
            const recalculatedHash = symbol_sdk_1.AggregateTransaction.createTransactionHash(aggregateTx.serialize(), networkGenerationHashBytes);
            if (recalculatedHash !== tx.hash) {
                throw new Error("Transaction's hash was mismatched.");
            }
            // Cast signed transaction
            const signedTx = new symbol_sdk_1.SignedTransaction(
            // Inner transaction's deadline will be removed.
            aggregateTx.serialize(), tx.hash, signerPubAccount.publicKey, aggregateTx.type, aggregateTx.networkType);
            const cosignatures = [
                ...tx.cosignatures.map((cosignature) => new symbol_sdk_1.CosignatureSignedTransaction(cosignature.parentHash, cosignature.signature, cosignature.signerPublicKey))
            ];
            return {
                signedTx,
                cosignatures,
                maxFee: new symbol_sdk_1.UInt64(tx.maxFee),
            };
        });
    };
    const retrieveUndeadBatches = async (intermediateTxs, referenceTxPool) => {
        const { networkType } = await common_1.symbolService.getNetwork();
        const signerPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(intermediateTxs.signerPublicKey, networkType);
        (0, assert_1.default)(intermediateTxs.undeadTxs);
        return Promise.all(intermediateTxs.undeadTxs.map(async (tx) => {
            // Collect inner transactions
            const innerTxs = tx.keys.map((key) => {
                const referenceTx = referenceTxPool.get(key);
                if (!referenceTx) {
                    throw new Error("Input file is wrong or broken.");
                }
                return referenceTx;
            });
            return common_1.necromancyService.retrieveTx(innerTxs, signerPubAccount, tx.signatures, new symbol_sdk_1.UInt64(tx.maxFee), new symbol_sdk_1.UInt64(tx.nonce));
        }));
    };
    const buildAndExecuteBatches = async (intermediateTxs, referenceTxPool, signerPubAccount, cosignerAccounts, maxParallels, canAnnounce, showPrompt) => {
        // Retrieve signed txs that can cosign and announce
        const batches = await retrieveBatches(intermediateTxs, referenceTxPool);
        // Add cosignatures of new cosigners
        batches.forEach((batch) => {
            batch.cosignatures.push(...cosignerAccounts.map((cosigner) => symbol_sdk_1.CosignatureTransaction.signTransactionHash(cosigner, batch.signedTx.hash)));
        });
        if (canAnnounce) {
            libs_1.Logger.info(`Announcing ${batches.length} aggregate TXs. ` +
                `TX fee ${services_1.SymbolService.toXYM(new symbol_sdk_1.UInt64(intermediateTxs.totalFee))} XYM ` +
                `will be paid by ${intermediateTxs.command} originator.`);
            await (0, common_1.announceBatches)(batches, signerPubAccount, maxParallels, showPrompt);
        }
        return {
            batches,
        };
    };
    const buildAndExecuteUndeadBatches = async (intermediateTxs, referenceTxPool, signerPubAccount, cosignerAccounts, maxParallels, canAnnounce, showPrompt) => {
        // Retrieve signed txs that can cosign and announce
        let undeadBatches = await retrieveUndeadBatches(intermediateTxs, referenceTxPool);
        // Add cosignatures of new cosigners
        undeadBatches = undeadBatches.map((undeadBatch) => common_1.necromancyService.cosignTx(undeadBatch, cosignerAccounts));
        if (canAnnounce) {
            libs_1.Logger.info(`Announcing ${undeadBatches.length} aggregate TXs. ` +
                `TX fee ${services_1.SymbolService.toXYM(new symbol_sdk_1.UInt64(intermediateTxs.totalFee))} XYM ` +
                `will be paid by ${intermediateTxs.command} originator.`);
            await (0, common_1.announceBatches)(await common_1.necromancyService.pickAndCastTxBatches(undeadBatches), signerPubAccount, maxParallels, showPrompt);
        }
        return {
            undeadBatches,
        };
    };
    const reinforceMetal = async (input, intermediateTxs, payload) => {
        const { networkType } = await common_1.symbolService.getNetwork();
        if (networkType !== intermediateTxs.networkType) {
            throw new Error(`Wrong network type ${intermediateTxs.networkType}`);
        }
        const cosignerAccounts = [
            ...(input.signerAccount ? [input.signerAccount] : []),
            ...(input.cosignerAccounts || []),
        ];
        const signerPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(intermediateTxs.signerPublicKey, networkType);
        const type = intermediateTxs.type;
        const sourcePubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(intermediateTxs.sourcePublicKey, networkType);
        const targetPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(intermediateTxs.targetPublicKey, networkType);
        const targetId = type === symbol_sdk_1.MetadataType.Mosaic && intermediateTxs.mosaicId
            ? new symbol_sdk_1.MosaicId(intermediateTxs.mosaicId)
            : type === symbol_sdk_1.MetadataType.Namespace && intermediateTxs.namespaceId
                ? services_1.SymbolService.createNamespaceId(intermediateTxs.namespaceId)
                : undefined;
        // Construct reference txs
        const referenceTxPool = await buildReferenceTxPool(intermediateTxs.command, type, sourcePubAccount, targetPubAccount, targetId, payload, intermediateTxs.additive);
        const { batches, undeadBatches } = intermediateTxs.undeadTxs
            ? await buildAndExecuteUndeadBatches(intermediateTxs, referenceTxPool, signerPubAccount, cosignerAccounts, input.maxParallels, input.announce, !input.force && !input.stdin)
            : await buildAndExecuteBatches(intermediateTxs, referenceTxPool, signerPubAccount, cosignerAccounts, input.maxParallels, input.announce, !input.force && !input.stdin);
        return Object.assign(Object.assign(Object.assign({ networkType,
            batches,
            undeadBatches, key: intermediateTxs.key !== undefined ? symbol_sdk_1.UInt64.fromHex(intermediateTxs.key) : undefined, totalFee: new symbol_sdk_1.UInt64(intermediateTxs.totalFee), additive: intermediateTxs.additive, sourcePubAccount,
            targetPubAccount }, (intermediateTxs.mosaicId ? { mosaicId: new symbol_sdk_1.MosaicId(intermediateTxs.mosaicId) } : {})), (intermediateTxs.namespaceId ? { namespaceId: new symbol_sdk_1.NamespaceId(intermediateTxs.namespaceId) } : {})), { status: input.announce ? "reinforced" : "estimated", metalId: intermediateTxs.metalId, signerPubAccount, command: intermediateTxs.command, type, createdAt: new Date(intermediateTxs.createdAt), payload });
    };
    ReinforceCLI.main = async (argv) => {
        let input;
        try {
            input = await input_1.ReinforceInput.validateInput(input_1.ReinforceInput.parseInput(argv));
        }
        catch (e) {
            input_1.ReinforceInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.ReinforceInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        // Read intermediate JSON contents here.
        (0, assert_1.default)(input.intermediatePath);
        const intermediateTxs = (0, intermediate_1.readIntermediateFile)(input.intermediatePath);
        // Read input file here.
        const payload = await (0, stream_1.readStreamInput)(input);
        const output = await reinforceMetal(input, intermediateTxs, payload);
        if (input.outputPath) {
            (0, intermediate_1.writeIntermediateFile)(output, input.outputPath);
        }
        output_1.ReinforceOutput.printOutputSummary(output);
        return output;
    };
})(ReinforceCLI = exports.ReinforceCLI || (exports.ReinforceCLI = {}));
//# sourceMappingURL=main.js.map