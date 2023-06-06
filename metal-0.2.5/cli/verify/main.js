"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyCLI = void 0;
const input_1 = require("./input");
const assert_1 = __importDefault(require("assert"));
const common_1 = require("../common");
const services_1 = require("../../services");
const output_1 = require("./output");
const symbol_sdk_1 = require("symbol-sdk");
const stream_1 = require("../stream");
var VerifyCLI;
(function (VerifyCLI) {
    VerifyCLI.main = async (argv) => {
        var _a, _b;
        let input;
        try {
            input = await input_1.VerifyInput.validateInput(input_1.VerifyInput.parseInput(argv));
        }
        catch (e) {
            input_1.VerifyInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.VerifyInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        // Read input file contents here.
        const payload = await (0, stream_1.readStreamInput)(input);
        let sourceAddress = input.sourceAddress || ((_a = input.signerAccount) === null || _a === void 0 ? void 0 : _a.address);
        let targetAddress = input.targetAddress || ((_b = input.signerAccount) === null || _b === void 0 ? void 0 : _b.address);
        let type = input.type;
        let key = input.key;
        let targetId = [undefined, input.mosaicId, input.namespaceId][type];
        if (input.metalId) {
            // Obtain type, sourceAddress, targetAddress, key and targetId here.
            const metadataEntry = (await common_1.metalService.getFirstChunk(input.metalId)).metadataEntry;
            type = metadataEntry.metadataType;
            sourceAddress = metadataEntry.sourceAddress;
            targetAddress = metadataEntry.targetAddress;
            key = metadataEntry.scopedMetadataKey;
            targetId = metadataEntry.targetId;
        }
        (0, assert_1.default)(type !== undefined);
        (0, assert_1.default)(key);
        (0, assert_1.default)(sourceAddress);
        (0, assert_1.default)(targetAddress);
        await (0, common_1.doVerify)(payload, type, sourceAddress, targetAddress, key, targetId);
        const { networkType } = await common_1.symbolService.getNetwork();
        const metalId = input.metalId || services_1.MetalService.calculateMetalId(type, sourceAddress, targetAddress, targetId, key);
        const output = Object.assign(Object.assign(Object.assign({ type,
            networkType,
            payload,
            sourceAddress,
            targetAddress }, (type === symbol_sdk_1.MetadataType.Mosaic ? { mosaicId: targetId } : {})), (type === symbol_sdk_1.MetadataType.Namespace ? { namespaceId: targetId } : {})), { key,
            metalId });
        output_1.VerifyOutput.printOutputSummary(output);
        return output;
    };
})(VerifyCLI = exports.VerifyCLI || (exports.VerifyCLI = {}));
//# sourceMappingURL=main.js.map