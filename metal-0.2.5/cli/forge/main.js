"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeCLI = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const assert_1 = __importDefault(require("assert"));
const input_1 = require("./input");
const output_1 = require("./output");
const services_1 = require("../../services");
const common_1 = require("../common");
const intermediate_1 = require("../intermediate");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
var ForgeCLI;
(function (ForgeCLI) {
    const forgeMetal = async (input, payload) => {
        var _a, _b;
        const { networkType } = await common_1.symbolService.getNetwork();
        (0, assert_1.default)(input.signerAccount);
        const targetId = [undefined, input.mosaicId, input.namespaceId][input.type];
        const signerPubAccount = input.signerAccount.publicAccount;
        const sourcePubAccount = input.sourcePubAccount || ((_a = input.sourceSignerAccount) === null || _a === void 0 ? void 0 : _a.publicAccount) || signerPubAccount;
        const targetPubAccount = input.targetPubAccount || ((_b = input.targetSignerAccount) === null || _b === void 0 ? void 0 : _b.publicAccount) || signerPubAccount;
        const metadataPool = input.recover
            ? await common_1.symbolService.searchMetadata(input.type, {
                source: sourcePubAccount,
                target: targetPubAccount,
                targetId
            })
            : undefined;
        const { key, txs, additive: additiveBytes } = await common_1.metalService.createForgeTxs(input.type, sourcePubAccount, targetPubAccount, targetId, payload, input.additiveBytes, metadataPool);
        if (!txs.length) {
            throw new Error("There is nothing to forge.");
        }
        const metalId = services_1.MetalService.calculateMetalId(input.type, sourcePubAccount.address, targetPubAccount.address, targetId, key);
        libs_1.Logger.debug(`Computed Metal ID is ${metalId}`);
        if (input.checkCollision && !input.recover) {
            // Check collision (Don't on recover mode)
            const collisions = await common_1.metalService.checkCollision(txs, input.type, sourcePubAccount, targetPubAccount, targetId);
            if (collisions.length) {
                throw new Error(`${key === null || key === void 0 ? void 0 : key.toHex()}: Already exists on the target ${["account", "mosaic", "namespace"][input.type]}`);
            }
        }
        const { designatedCosignerAccounts, hasEnoughCosigners } = (0, common_1.designateCosigners)(signerPubAccount, sourcePubAccount, targetPubAccount, input.sourceSignerAccount, input.targetSignerAccount, input.cosignerAccounts);
        const canAnnounce = hasEnoughCosigners && !input.estimate;
        const { batches, undeadBatches, totalFee } = input.deadlineHours > common_1.deadlineMinHours
            ? await (0, common_1.buildAndExecuteUndeadBatches)(txs, input.signerAccount, designatedCosignerAccounts, input.feeRatio, input.requiredCosignatures || designatedCosignerAccounts.length, input.deadlineHours, input.maxParallels, canAnnounce, !input.force && !input.stdin)
            : await (0, common_1.buildAndExecuteBatches)(txs, input.signerAccount, designatedCosignerAccounts, input.feeRatio, input.requiredCosignatures || designatedCosignerAccounts.length, input.maxParallels, canAnnounce, !input.force && !input.stdin);
        if (input.verify && key && canAnnounce) {
            await (0, common_1.doVerify)(payload, input.type, sourcePubAccount.address, targetPubAccount.address, key, targetId);
        }
        return Object.assign(Object.assign(Object.assign({ command: "forge", networkType,
            batches,
            undeadBatches,
            key,
            totalFee, additive: symbol_sdk_1.Convert.uint8ToUtf8(additiveBytes), sourcePubAccount,
            targetPubAccount }, (input.type === symbol_sdk_1.MetadataType.Mosaic ? { mosaicId: input.mosaicId } : {})), (input.type === symbol_sdk_1.MetadataType.Namespace ? { namespaceId: input.namespaceId } : {})), { status: canAnnounce ? "forged" : "estimated", metalId,
            signerPubAccount, type: input.type, createdAt: new Date(), payload });
    };
    ForgeCLI.main = async (argv) => {
        let input;
        try {
            input = await input_1.ForgeInput.validateInput(input_1.ForgeInput.parseInput(argv));
        }
        catch (e) {
            input_1.ForgeInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.ForgeInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        // Read input file contents here.
        const payload = await (0, stream_1.readStreamInput)(input);
        const output = await forgeMetal(input, payload);
        if (input.outputPath) {
            (0, intermediate_1.writeIntermediateFile)(output, input.outputPath);
        }
        output_1.ForgeOutput.printOutputSummary(output);
        return output;
    };
})(ForgeCLI = exports.ForgeCLI || (exports.ForgeCLI = {}));
//# sourceMappingURL=main.js.map