"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecryptCLI = void 0;
const assert_1 = __importDefault(require("assert"));
const input_1 = require("./input");
const services_1 = require("../../services");
const stream_1 = require("../stream");
var DecryptCLI;
(function (DecryptCLI) {
    DecryptCLI.main = async (argv) => {
        let input;
        try {
            input = await input_1.DecryptInput.validateInput(input_1.DecryptInput.parseInput(argv));
        }
        catch (e) {
            input_1.DecryptInput.printVersion();
            if (e === "version") {
                return;
            }
            input_1.DecryptInput.printUsage();
            if (e === "help") {
                return;
            }
            throw e;
        }
        // Read input file contents here.
        const payload = await (0, stream_1.readStreamInput)(input);
        // Encrypt payload here.
        (0, assert_1.default)(input.encryptRecipientAccount);
        const encryptSenderPubAccount = input.encryptSenderPubAccount || input.encryptRecipientAccount.publicAccount;
        const decryptedPayload = services_1.SymbolService.decryptBinary(payload, encryptSenderPubAccount, input.encryptRecipientAccount);
        // Output encrypt file here.
        (0, stream_1.writeStreamOutput)(decryptedPayload, input.outputPath);
        const output = {
            payload: decryptedPayload,
            senderPubAccount: encryptSenderPubAccount,
            recipientPubAccount: input.encryptRecipientAccount.publicAccount,
        };
        return output;
    };
})(DecryptCLI = exports.DecryptCLI || (exports.DecryptCLI = {}));
//# sourceMappingURL=main.js.map