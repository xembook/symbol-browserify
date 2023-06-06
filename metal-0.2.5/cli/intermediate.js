"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readIntermediateFile = exports.writeIntermediateFile = exports.SUPPORTED_VERSION = exports.VERSION = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const libs_1 = require("../libs");
const fs_1 = __importDefault(require("fs"));
exports.VERSION = "2.1";
exports.SUPPORTED_VERSION = /^2\.[0-1]$/;
const extractMetadataKey = (tx) => {
    const metadataTypes = [
        symbol_sdk_1.TransactionType.ACCOUNT_METADATA,
        symbol_sdk_1.TransactionType.MOSAIC_METADATA,
        symbol_sdk_1.TransactionType.NAMESPACE_METADATA
    ];
    return tx.innerTransactions.map((innerTx) => {
        if (!metadataTypes.includes(innerTx.type)) {
            throw new Error("The transaction type must be account/mosaic/namespace metadata.");
        }
        return innerTx.scopedMetadataKey.toHex();
    });
};
const batchToIntermediateTx = (batch) => {
    const tx = symbol_sdk_1.AggregateTransaction.createFromPayload(batch.signedTx.payload);
    return {
        hash: batch.signedTx.hash,
        maxFee: batch.maxFee.toDTO(),
        cosignatures: batch.cosignatures.map((cosignature) => ({
            parentHash: cosignature.parentHash,
            signature: cosignature.signature,
            signerPublicKey: cosignature.signerPublicKey,
        })),
        deadline: tx.deadline.adjustedValue,
        keys: extractMetadataKey(tx),
        signature: tx.signature || "",
    };
};
const batchToIntermediateUndeadTx = (batch) => {
    const nonceHex = batch.nonce.toHex();
    return {
        // Exclude lock metadata transaction.
        keys: extractMetadataKey(batch.aggregateTx).filter((key) => key !== nonceHex),
        maxFee: batch.aggregateTx.maxFee.toDTO(),
        nonce: batch.nonce.toDTO(),
        signatures: batch.signatures,
    };
};
const writeIntermediateFile = (output, filePath) => {
    var _a, _b, _c;
    const intermediateTxs = Object.assign(Object.assign(Object.assign({ version: exports.VERSION, command: output.command, metalId: output.metalId, networkType: output.networkType, type: output.type, sourcePublicKey: output.sourcePubAccount.publicKey, targetPublicKey: output.targetPubAccount.publicKey, key: (_a = output.key) === null || _a === void 0 ? void 0 : _a.toHex() }, (output.mosaicId && { mosaicId: output.mosaicId.toHex() })), (output.namespaceId && { namespaceId: output.namespaceId.toHex() })), { totalFee: output.totalFee.toDTO(), additive: output.additive, signerPublicKey: output.signerPubAccount.publicKey, txs: (_b = output.batches) === null || _b === void 0 ? void 0 : _b.map((batch) => batchToIntermediateTx(batch)), undeadTxs: (_c = output.undeadBatches) === null || _c === void 0 ? void 0 : _c.map((batch) => batchToIntermediateUndeadTx(batch)), createdAt: output.createdAt.toISOString(), updatedAt: new Date().toISOString() });
    fs_1.default.writeFileSync(filePath, JSON.stringify(intermediateTxs), "utf-8");
    libs_1.Logger.debug(`${filePath}: JSON data saved.`);
};
exports.writeIntermediateFile = writeIntermediateFile;
const readIntermediateFile = (filePath) => {
    libs_1.Logger.debug(`${filePath}: Reading...`);
    const intermediateJson = fs_1.default.readFileSync(filePath, "utf-8");
    if (!intermediateJson.length) {
        throw new Error(`${filePath}: The file is empty.`);
    }
    const intermediateTxs = JSON.parse(intermediateJson);
    if (!intermediateTxs.version.match(exports.SUPPORTED_VERSION)) {
        throw new Error(`${filePath}: Unsupported version ${intermediateTxs.version}`);
    }
    return intermediateTxs;
};
exports.readIntermediateFile = readIntermediateFile;
//# sourceMappingURL=intermediate.js.map