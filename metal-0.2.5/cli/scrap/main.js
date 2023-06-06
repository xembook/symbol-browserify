"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapCLI = void 0;
const input_1 = require("./input");
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const symbol_sdk_1 = require("symbol-sdk");
const output_1 = require("./output");
const services_1 = require("../../services");
const common_1 = require("../common");
const intermediate_1 = require("../intermediate");
const libs_1 = require("../../libs");
var ScrapCLI;
(function (ScrapCLI) {
    const scrapMetal = async (input, payload) => {
        var _a, _b, _c;
        const { networkType } = await common_1.symbolService.getNetwork();
        (0, assert_1.default)(input.signerAccount);
        const signerPubAccount = input.signerAccount.publicAccount;
        let sourcePubAccount = input.sourcePubAccount || ((_a = input.sourceSignerAccount) === null || _a === void 0 ? void 0 : _a.publicAccount) || signerPubAccount;
        let targetPubAccount = input.targetPubAccount || ((_b = input.targetSignerAccount) === null || _b === void 0 ? void 0 : _b.publicAccount) || signerPubAccount;
        let type = input.type;
        let key = input.key;
        let metalId = input.metalId;
        let targetId;
        let additiveBytes = input.additiveBytes;
        if (metalId) {
            const metadataEntry = (await common_1.metalService.getFirstChunk(metalId)).metadataEntry;
            // Obtain type, key and targetId here.
            type = metadataEntry.metadataType;
            key = metadataEntry.scopedMetadataKey;
            targetId = metadataEntry.targetId;
            additiveBytes = (_c = services_1.MetalService.extractChunk(metadataEntry)) === null || _c === void 0 ? void 0 : _c.additive;
            if (!additiveBytes) {
                throw new Error(`The chunk is broken.`);
            }
            // We cannot retrieve publicKey at this time. Only can do address check.
            if (!sourcePubAccount.address.equals(metadataEntry === null || metadataEntry === void 0 ? void 0 : metadataEntry.sourceAddress)) {
                throw new Error(`Source address mismatched.`);
            }
            if (!targetPubAccount.address.equals(metadataEntry === null || metadataEntry === void 0 ? void 0 : metadataEntry.targetAddress)) {
                throw new Error(`Target address mismatched.`);
            }
        }
        else {
            if (!key && payload) {
                // Obtain metadata key here
                key = services_1.MetalService.calculateMetadataKey(payload, input.additiveBytes);
            }
            (0, assert_1.default)(type !== undefined);
            (0, assert_1.default)(key);
            // Obtain targetId and metalId here
            targetId = [undefined, input.mosaicId, input.namespaceId][type];
            metalId = services_1.MetalService.calculateMetalId(type, sourcePubAccount.address, targetPubAccount.address, targetId, key);
        }
        libs_1.Logger.debug(`Scanning on-chain chunks of the metal ${metalId}`);
        const txs = (payload)
            ? await common_1.metalService.createDestroyTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additiveBytes)
            : await common_1.metalService.createScrapTxs(type, sourcePubAccount, targetPubAccount, targetId, key);
        if (!(txs === null || txs === void 0 ? void 0 : txs.length)) {
            throw new Error(`There is nothing to scrap.`);
        }
        const { designatedCosignerAccounts, hasEnoughCosigners } = (0, common_1.designateCosigners)(signerPubAccount, sourcePubAccount, targetPubAccount, input.sourceSignerAccount, input.targetSignerAccount, input.cosignerAccounts);
        const canAnnounce = hasEnoughCosigners && !input.estimate;
        const { batches, undeadBatches, totalFee } = input.deadlineHours > common_1.deadlineMinHours
            ? await (0, common_1.buildAndExecuteUndeadBatches)(txs, input.signerAccount, designatedCosignerAccounts, input.feeRatio, input.requiredCosignatures || designatedCosignerAccounts.length, input.deadlineHours, input.maxParallels, canAnnounce, !input.force)
            : await (0, common_1.buildAndExecuteBatches)(txs, input.signerAccount, designatedCosignerAccounts, input.feeRatio, input.requiredCosignatures || designatedCosignerAccounts.length, input.maxParallels, canAnnounce, !input.force);
        return Object.assign(Object.assign(Object.assign({ command: "scrap", networkType,
            batches,
            undeadBatches,
            key,
            totalFee,
            sourcePubAccount,
            targetPubAccount }, (type === symbol_sdk_1.MetadataType.Mosaic ? { mosaicId: targetId } : {})), (type === symbol_sdk_1.MetadataType.Namespace ? { namespaceId: targetId } : {})), { status: canAnnounce ? "scrapped" : "estimated", metalId,
            signerPubAccount, additive: symbol_sdk_1.Convert.uint8ToUtf8(additiveBytes || services_1.MetalService.DEFAULT_ADDITIVE), type, createdAt: new Date() });
    };
    ScrapCLI.main = async (argv) => {
        let input;
        try {
            input = await input_1.ScrapInput.validateInput(input_1.ScrapInput.parseInput(argv));
        }
        catch (e) {
            input_1.ScrapInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.ScrapInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        let payload;
        if (input.filePath) {
            // Read input file contents here.
            libs_1.Logger.debug(`${input.filePath}: Reading...`);
            payload = fs_1.default.readFileSync(input.filePath);
            if (!payload.length) {
                throw new Error(`${input.filePath}: The file is empty.`);
            }
        }
        const output = await scrapMetal(input, payload);
        if (input.outputPath) {
            (0, intermediate_1.writeIntermediateFile)(output, input.outputPath);
        }
        output_1.ScrapOutput.printOutputSummary(output);
        return output;
    };
})(ScrapCLI = exports.ScrapCLI || (exports.ScrapCLI = {}));
//# sourceMappingURL=main.js.map