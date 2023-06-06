"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchCLI = void 0;
const input_1 = require("./input");
const assert_1 = __importDefault(require("assert"));
const services_1 = require("../../services");
const symbol_sdk_1 = require("symbol-sdk");
const output_1 = require("./output");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const common_1 = require("../common");
var FetchCLI;
(function (FetchCLI) {
    FetchCLI.main = async (argv) => {
        var _a, _b;
        let input;
        try {
            input = await input_1.FetchInput.validateInput(input_1.FetchInput.parseInput(argv));
        }
        catch (e) {
            input_1.FetchInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.FetchInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        let sourceAddress = input.sourceAddress || ((_a = input.signerAccount) === null || _a === void 0 ? void 0 : _a.address);
        let targetAddress = input.targetAddress || ((_b = input.signerAccount) === null || _b === void 0 ? void 0 : _b.address);
        let type = input.type;
        let key = input.key;
        let targetId;
        let payload;
        if (input.metalId) {
            libs_1.Logger.debug(`Fetching metal ${input.metalId}`);
            const result = await common_1.metalService.fetchByMetalId(input.metalId);
            if (!result) {
                throw new Error(`The metal fetch failed.`);
            }
            type = result.type;
            sourceAddress = result.sourceAddress;
            targetAddress = result.targetAddress;
            key = result.key;
            targetId = result.targetId;
            payload = result.payload;
        }
        else {
            (0, assert_1.default)(type !== undefined);
            targetId = [undefined, input.mosaicId, input.namespaceId][type];
            (0, assert_1.default)(key);
            (0, assert_1.default)(sourceAddress);
            (0, assert_1.default)(targetAddress);
            libs_1.Logger.debug(`Fetching metal key:${key.toHex()},source:${sourceAddress.plain()},${type === symbol_sdk_1.MetadataType.Mosaic
                ? `mosaic:${targetId === null || targetId === void 0 ? void 0 : targetId.toHex()}`
                : type === symbol_sdk_1.MetadataType.Namespace
                    ? `namespace:${targetId === null || targetId === void 0 ? void 0 : targetId.toHex()}`
                    : `account:${targetAddress.plain()}`}`);
            payload = await common_1.metalService.fetch(type, sourceAddress, targetAddress, targetId, key);
        }
        if (!input.noSave) {
            (0, stream_1.writeStreamOutput)(payload, input.outputPath);
        }
        const { networkType } = await common_1.symbolService.getNetwork();
        const metalId = input.metalId || services_1.MetalService.calculateMetalId(type, sourceAddress, targetAddress, targetId, key);
        const output = Object.assign(Object.assign(Object.assign({ type,
            networkType,
            payload,
            sourceAddress,
            targetAddress }, (type === symbol_sdk_1.MetadataType.Mosaic ? { mosaicId: targetId } : {})), (type === symbol_sdk_1.MetadataType.Namespace ? { namespaceId: targetId } : {})), { key,
            metalId });
        output_1.FetchOutput.printOutputSummary(output);
        return output;
    };
})(FetchCLI = exports.FetchCLI || (exports.FetchCLI = {}));
//# sourceMappingURL=main.js.map