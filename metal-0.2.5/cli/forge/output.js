"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeOutput = void 0;
const long_1 = __importDefault(require("long"));
const libs_1 = require("../../libs");
const services_1 = require("../../services");
var ForgeOutput;
(function (ForgeOutput) {
    ForgeOutput.printOutputSummary = (output) => {
        var _a, _b, _c;
        libs_1.Logger.info(`\n  --- Summary of Forging ${output.status === "estimated" ? "(Estimate)" : "(Receipt)"} ---\n` +
            `  Metal ID: ${output.metalId}\n` +
            `  Type: ${output.mosaicId ? "Mosaic" : output.namespaceId ? "Namespace" : "Account"}\n` +
            `  Source Account Address: ${output.sourcePubAccount.address.plain()}\n` +
            `  Target Account Address: ${output.targetPubAccount.address.plain()}\n` +
            (output.mosaicId ? `  Mosaic ID: ${output.mosaicId.toHex()}\n` : "") +
            (output.namespaceId ? `  Namespace ID: ${output.namespaceId.toHex()}\n` : "") +
            `  Metadata Key: ${(_a = output.key) === null || _a === void 0 ? void 0 : _a.toHex()}\n` +
            `  Additive: ${output.additive}\n` +
            `  Data size: ${output.payload.length} bytes\n` +
            `  # of Aggregate TXs: ${((_b = output.batches) === null || _b === void 0 ? void 0 : _b.length) || ((_c = output.undeadBatches) === null || _c === void 0 ? void 0 : _c.length)}\n` +
            `  TX Fee: ${services_1.SymbolService.toXYM(long_1.default.fromString(output.totalFee.toString()))} XYM\n` +
            `  Signer Address: ${output.signerPubAccount.address.plain()}\n` +
            `  Network Type: ${output.networkType}\n`);
    };
})(ForgeOutput = exports.ForgeOutput || (exports.ForgeOutput = {}));
//# sourceMappingURL=output.js.map