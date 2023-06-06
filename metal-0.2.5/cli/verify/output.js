"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyOutput = void 0;
const libs_1 = require("../../libs");
var VerifyOutput;
(function (VerifyOutput) {
    VerifyOutput.printOutputSummary = (output) => {
        var _a;
        libs_1.Logger.info(`\n  --- Verify Summary ---\n` +
            `  Metal ID: ${output.metalId}\n` +
            `  Type: ${output.mosaicId ? "Mosaic" : output.namespaceId ? "Namespace" : "Account"}\n` +
            `  Source Account Address: ${output.sourceAddress.plain()}\n` +
            `  Target Account Address: ${output.targetAddress.plain()}\n` +
            (output.mosaicId ? `  Mosaic ID: ${output.mosaicId.toHex()}\n` : "") +
            (output.namespaceId ? `  Namespace ID: ${output.namespaceId.toHex()}\n` : "") +
            `  Metadata Key: ${(_a = output.key) === null || _a === void 0 ? void 0 : _a.toHex()}\n` +
            `  Data size: ${output.payload.length} bytes\n` +
            `  Network Type: ${output.networkType}\n`);
    };
})(VerifyOutput = exports.VerifyOutput || (exports.VerifyOutput = {}));
//# sourceMappingURL=output.js.map