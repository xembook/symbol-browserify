"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptCLI = void 0;
const assert_1 = __importDefault(require("assert"));
const input_1 = require("./input");
const services_1 = require("../../services");
const stream_1 = require("../stream");
var EncryptCLI;
(function (EncryptCLI) {
    EncryptCLI.main = async (argv) => {
        let input;
        try {
            input = await input_1.EncryptInput.validateInput(input_1.EncryptInput.parseInput(argv));
        }
        catch (e) {
            input_1.EncryptInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.EncryptInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        // Read input file contents here.
        const payload = await (0, stream_1.readStreamInput)(input);
        // Encrypt payload here.
        (0, assert_1.default)(input.encryptSenderAccount);
        const encryptRecipientPubAccount = input.encryptRecipientPubAccount || input.encryptSenderAccount.publicAccount;
        const encryptedPayload = services_1.SymbolService.encryptBinary(payload, input.encryptSenderAccount, encryptRecipientPubAccount);
        // Output encrypt file here.
        (0, stream_1.writeStreamOutput)(encryptedPayload, input.outputPath);
        const output = {
            payload: encryptedPayload,
            senderPubAccount: input.encryptSenderAccount.publicAccount,
            recipientPubAccount: encryptRecipientPubAccount,
        };
        return output;
    };
})(EncryptCLI = exports.EncryptCLI || (exports.EncryptCLI = {}));
//# sourceMappingURL=main.js.map