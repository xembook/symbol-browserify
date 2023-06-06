"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const symbol_sdk_1 = require("symbol-sdk");
const bs58_1 = __importDefault(require("bs58"));
for (let i = 0; i < 65536; i++) {
    const header = `0000${i.toString(16).toUpperCase()}`.slice(-4);
    const account = symbol_sdk_1.Account.generateNewAccount(152);
    const hashBytes = symbol_sdk_1.Convert.hexToUint8(header + account.publicKey);
    const encoded = bs58_1.default.encode(hashBytes);
    if (encoded.startsWith("Fe")) {
        console.log(`${header}: ${bs58_1.default.encode(hashBytes)}`);
    }
}
//# sourceMappingURL=base58.js.map