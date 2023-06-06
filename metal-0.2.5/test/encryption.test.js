"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env.test' });
const utils_1 = require("./utils");
const assert_1 = __importDefault(require("assert"));
const cli_1 = require("../cli");
const symbol_sdk_1 = require("symbol-sdk");
const fs_1 = __importDefault(require("fs"));
describe("Encrypt/Decrypt CLI", () => {
    let inputFile;
    let encryptedFile;
    let decryptedFile;
    let targetAccount;
    beforeAll(async () => {
        (0, utils_1.initTestEnv)();
        targetAccount = symbol_sdk_1.Account.generateNewAccount(symbol_sdk_1.NetworkType.TEST_NET);
        (0, assert_1.default)(process.env.TEST_INPUT_FILE);
        inputFile = process.env.TEST_INPUT_FILE;
        encryptedFile = `test.enc.${targetAccount.address.plain()}.out`;
        decryptedFile = `test.dec.${targetAccount.address.plain()}.out`;
    }, 600000);
    afterAll(() => {
        if (fs_1.default.existsSync(encryptedFile)) {
            fs_1.default.unlinkSync(encryptedFile);
        }
        if (fs_1.default.existsSync(decryptedFile)) {
            fs_1.default.unlinkSync(decryptedFile);
        }
    });
    it("Encrypt file", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.EncryptCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--to", targetAccount.publicKey,
            "--out", encryptedFile,
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.payload).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.senderPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.recipientPubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(fs_1.default.existsSync(encryptedFile)).toBeTruthy();
        const plain = fs_1.default.readFileSync(inputFile);
        const encrypted = fs_1.default.readFileSync(encryptedFile);
        expect(output === null || output === void 0 ? void 0 : output.payload.buffer).toStrictEqual(encrypted.buffer);
        expect(output === null || output === void 0 ? void 0 : output.payload.buffer).not.toStrictEqual(plain.buffer);
        expect(encrypted.buffer).not.toStrictEqual(plain.buffer);
    }, 600000);
    it("Decrypt file", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.DecryptCLI.main([
            "-f",
            "--priv-key", targetAccount.privateKey,
            "--from", signerAccount.publicKey,
            "--out", decryptedFile,
            encryptedFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.payload).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.senderPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.recipientPubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(fs_1.default.existsSync(encryptedFile)).toBeTruthy();
        const plain = fs_1.default.readFileSync(inputFile);
        const decrypted = fs_1.default.readFileSync(decryptedFile);
        expect(output === null || output === void 0 ? void 0 : output.payload.buffer).toStrictEqual(decrypted.buffer);
        expect(output === null || output === void 0 ? void 0 : output.payload.buffer).toStrictEqual(plain.buffer);
        expect(decrypted.buffer).toStrictEqual(plain.buffer);
    }, 600000);
});
//# sourceMappingURL=encryption.test.js.map