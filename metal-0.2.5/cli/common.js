"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doVerify = exports.buildAndExecuteUndeadBatches = exports.buildAndExecuteBatches = exports.announceBatches = exports.designateCosigners = exports.initCliEnv = exports.deadlineMarginHours = exports.deadlineMinHours = exports.necromancyService = exports.metalService = exports.symbolService = exports.isValueOption = void 0;
const services_1 = require("../services");
const symbol_sdk_1 = require("symbol-sdk");
const libs_1 = require("../libs");
const long_1 = __importDefault(require("long"));
const moment_1 = __importDefault(require("moment"));
const prompts_1 = __importDefault(require("prompts"));
const symbol_service_1 = require("@opensphere-inc/symbol-service");
const isValueOption = (token) => !(token === null || token === void 0 ? void 0 : token.startsWith("-"));
exports.isValueOption = isValueOption;
exports.deadlineMinHours = 5;
exports.deadlineMarginHours = 1;
const initCliEnv = async (input, feeRatio) => {
    if (!input.nodeUrl) {
        throw new Error("Node URL wasn't specified. [--node-url value] or NODE_URL is required.");
    }
    exports.symbolService = new services_1.SymbolService({
        node_url: input.nodeUrl,
        fee_ratio: feeRatio,
        deadline_hours: exports.deadlineMinHours,
    });
    const { networkType } = await exports.symbolService.getNetwork();
    libs_1.Logger.debug(`Using Node URL: ${input.nodeUrl} (network_type:${networkType})`);
    exports.metalService = new services_1.MetalService(exports.symbolService);
    exports.necromancyService = new symbol_service_1.NecromancyService(exports.symbolService, {
        deadlineUnitHours: exports.symbolService.config.deadline_hours,
        deadlineMarginHours: exports.deadlineMarginHours,
    });
};
exports.initCliEnv = initCliEnv;
const designateCosigners = (signerPubAccount, sourcePubAccount, targetPubAccount, sourceSignerAccount, targetSignerAccount, cosignerAccounts) => {
    const designatedCosignerAccounts = new Array(...(cosignerAccounts || []));
    if (!signerPubAccount.equals(sourcePubAccount) && sourceSignerAccount) {
        designatedCosignerAccounts.push(sourceSignerAccount);
    }
    if (!signerPubAccount.equals(targetPubAccount) && targetSignerAccount) {
        designatedCosignerAccounts.push(targetSignerAccount);
    }
    const hasEnoughCosigners = (signerPubAccount.equals(sourcePubAccount) ||
        !!sourceSignerAccount ||
        !!designatedCosignerAccounts.filter((cosigner) => cosigner.publicKey === sourcePubAccount.publicKey).shift()) && (signerPubAccount.equals(targetPubAccount) ||
        !!targetSignerAccount ||
        !!designatedCosignerAccounts.filter((cosigner) => cosigner.publicKey === targetPubAccount.publicKey).shift());
    if (!hasEnoughCosigners) {
        libs_1.Logger.warn("You need more cosigner(s) to announce TXs.");
    }
    return {
        hasEnoughCosigners,
        designatedCosignerAccounts,
    };
};
exports.designateCosigners = designateCosigners;
const announceBatches = async (batches, signerAccount, maxParallels, showPrompt) => {
    if (showPrompt) {
        const decision = (await (0, prompts_1.default)({
            type: "confirm",
            name: "decision",
            message: "Are you sure announce these TXs?",
            initial: true,
            stdout: process.stderr,
        })).decision;
        if (!decision) {
            throw new Error("Canceled by user.");
        }
    }
    const startAt = moment_1.default.now();
    const errors = await exports.symbolService.executeBatches(batches, signerAccount, maxParallels);
    errors === null || errors === void 0 ? void 0 : errors.forEach(({ txHash, error }) => {
        libs_1.Logger.error(`${txHash}: ${error}`);
    });
    if (errors) {
        throw new Error(`Some errors occurred during announcing.`);
    }
    else {
        libs_1.Logger.info(`Completed in ${(0, moment_1.default)().diff(startAt, "seconds", true)} secs.`);
    }
};
exports.announceBatches = announceBatches;
const buildAndExecuteBatches = async (txs, signerAccount, cosignerAccounts, feeRatio, requiredCosignatures, maxParallels, canAnnounce, showPrompt) => {
    var _a;
    const { networkProperties } = await exports.symbolService.getNetwork();
    const batchSize = Number(((_a = networkProperties.plugins.aggregate) === null || _a === void 0 ? void 0 : _a.maxTransactionsPerAggregate) || 100);
    const batches = await exports.symbolService.buildSignedAggregateCompleteTxBatches(txs, signerAccount, cosignerAccounts, feeRatio, batchSize, requiredCosignatures);
    const totalFee = batches.reduce((acc, curr) => acc.add(curr.maxFee), symbol_sdk_1.UInt64.fromUint(0));
    if (canAnnounce) {
        libs_1.Logger.info(`Announcing ${batches.length} aggregate TXs ` +
            `with fee ${services_1.SymbolService.toXYM(long_1.default.fromString(totalFee.toString()))} XYM total.`);
        await (0, exports.announceBatches)(batches, signerAccount, maxParallels, showPrompt);
    }
    return {
        batches,
        totalFee,
    };
};
exports.buildAndExecuteBatches = buildAndExecuteBatches;
const buildAndExecuteUndeadBatches = async (txs, signerAccount, cosignerAccounts, feeRatio, requiredCosignatures, deadlineHours, maxParallels, canAnnounce, showPrompt) => {
    var _a;
    const { networkProperties } = await exports.symbolService.getNetwork();
    const batchSize = Number(((_a = networkProperties.plugins.aggregate) === null || _a === void 0 ? void 0 : _a.maxTransactionsPerAggregate) || 100) - 1;
    const undeadBatches = await exports.necromancyService.buildTxBatches(deadlineHours, txs, signerAccount, cosignerAccounts, feeRatio, batchSize, requiredCosignatures);
    const totalFee = undeadBatches.reduce((acc, curr) => acc.add(curr.aggregateTx.maxFee), symbol_sdk_1.UInt64.fromUint(0));
    if (canAnnounce) {
        libs_1.Logger.info(`Announcing ${undeadBatches.length} aggregate TXs ` +
            `with fee ${services_1.SymbolService.toXYM(long_1.default.fromString(totalFee.toString()))} XYM total.`);
        await (0, exports.announceBatches)(await exports.necromancyService.pickAndCastTxBatches(undeadBatches), signerAccount, maxParallels, showPrompt);
    }
    return {
        undeadBatches,
        totalFee,
    };
};
exports.buildAndExecuteUndeadBatches = buildAndExecuteUndeadBatches;
const doVerify = async (payload, type, sourceAddress, targetAddress, key, targetId) => {
    libs_1.Logger.debug(`Verifying the metal key:${key.toHex()},Source:${sourceAddress.plain()},${[`Account:${targetAddress.plain()}`, `Mosaic:${targetId === null || targetId === void 0 ? void 0 : targetId.toHex()}`, `Namespace:${targetId === null || targetId === void 0 ? void 0 : targetId.toHex()}`][type]}`);
    const { mismatches, maxLength } = await exports.metalService.verify(payload, type, sourceAddress, targetAddress, key, targetId);
    if (mismatches) {
        throw new Error(`Verify error: Mismatch rate is ${mismatches / maxLength * 100}%`);
    }
    else {
        libs_1.Logger.info(`Verify succeeded: No mismatches found.`);
    }
};
exports.doVerify = doVerify;
//# sourceMappingURL=common.js.map