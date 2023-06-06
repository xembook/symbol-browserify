"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddressesInput = exports.validateAccountsInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const libs_1 = require("../libs");
const prompts_1 = __importDefault(require("prompts"));
const common_1 = require("./common");
const validateAccountsInput = async (_input, showPrompt = true) => {
    var _a, _b, _c;
    let input = Object.assign({}, _input);
    const { networkType } = await common_1.symbolService.getNetwork();
    if (!input.signerPrivateKey && showPrompt) {
        input.signerPrivateKey = (await (0, prompts_1.default)({
            type: "password",
            name: "private_key",
            message: "Signer's Private Key?",
            stdout: process.stderr,
        })).private_key;
    }
    if (!input.signerPrivateKey) {
        throw new Error("Signer's private key wasn't specified. [--priv-key value] or SIGNER_PRIVATE_KEY are required.");
    }
    input.signerAccount = symbol_sdk_1.Account.createFromPrivateKey(input.signerPrivateKey, networkType);
    libs_1.Logger.info(`Signer Address is ${input.signerAccount.address.plain()}`);
    if (input.sourcePublicKey) {
        input.sourcePubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.sourcePublicKey, networkType);
    }
    if (input.sourcePrivateKey) {
        input.sourceSignerAccount = symbol_sdk_1.Account.createFromPrivateKey(input.sourcePrivateKey, networkType);
        if (input.sourcePubAccount && !input.sourceSignerAccount.publicAccount.equals(input.sourcePubAccount)) {
            throw new Error("Mismatched source account between public key and private key " +
                "(You don't need to specify public key)");
        }
    }
    if (input.sourcePubAccount || input.sourceSignerAccount) {
        libs_1.Logger.info(`Source Address is ${(_a = (input.sourcePubAccount || input.sourceSignerAccount)) === null || _a === void 0 ? void 0 : _a.address.plain()}`);
    }
    if (input.targetPublicKey) {
        input.targetPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.targetPublicKey, networkType);
    }
    if (input.targetPrivateKey) {
        input.targetSignerAccount = symbol_sdk_1.Account.createFromPrivateKey(input.targetPrivateKey, networkType);
        if (input.targetPubAccount && !input.targetSignerAccount.publicAccount.equals(input.targetPubAccount)) {
            throw new Error("Mismatched target account between public key and private key " +
                "(You don't need to specify public key)");
        }
    }
    if (input.targetPubAccount || input.targetSignerAccount) {
        libs_1.Logger.info(`Target Address is ${(_b = (input.targetPubAccount || input.targetSignerAccount)) === null || _b === void 0 ? void 0 : _b.address.plain()}`);
    }
    input.cosignerAccounts = (_c = input.cosignerPrivateKeys) === null || _c === void 0 ? void 0 : _c.map((privateKey) => {
        const cosigner = symbol_sdk_1.Account.createFromPrivateKey(privateKey, networkType);
        libs_1.Logger.info(`Additional Cosigner Address is ${cosigner.address.plain()}`);
        return cosigner;
    });
    return input;
};
exports.validateAccountsInput = validateAccountsInput;
const validateAddressesInput = async (_input) => {
    let input = Object.assign({}, _input);
    const { networkType } = await common_1.symbolService.getNetwork();
    if (input.sourcePublicKey) {
        input.sourcePubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.sourcePublicKey, networkType);
        if (input.sourceAddress && !input.sourceAddress.equals(input.sourcePubAccount.address)) {
            throw new Error("Mismatched source account between public key and address " +
                "(You don't need to specify public key)");
        }
        input.sourceAddress = input.sourcePubAccount.address;
    }
    if (input.targetPublicKey) {
        input.targetPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.targetPublicKey, networkType);
        if (input.targetAddress && !input.targetAddress.equals(input.targetPubAccount.address)) {
            throw new Error("Mismatched target account between public key and address " +
                "(You don't need to specify public key)");
        }
        input.targetAddress = input.targetPubAccount.address;
    }
    return input;
};
exports.validateAddressesInput = validateAddressesInput;
//# sourceMappingURL=accounts.js.map