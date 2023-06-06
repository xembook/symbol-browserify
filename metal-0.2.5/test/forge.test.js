"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env.test' });
const cli_1 = require("../cli");
const assert_1 = __importDefault(require("assert"));
const utils_1 = require("./utils");
const symbol_sdk_1 = require("symbol-sdk");
const services_1 = require("../services");
describe("Forge CLI", () => {
    let inputFile;
    let targetAccount;
    let mosaicId;
    let namespaceId;
    beforeAll(async () => {
        (0, utils_1.initTestEnv)();
        (0, assert_1.default)(process.env.TEST_INPUT_FILE);
        inputFile = process.env.TEST_INPUT_FILE;
        const assets = await utils_1.SymbolTest.generateAssets();
        targetAccount = assets.account;
        mosaicId = assets.mosaicId;
        namespaceId = assets.namespaceId;
    }, 600000);
    it("Estimation of Forge Metal", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.ForgeCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-s", signerAccount.publicKey,
            "-t", targetAccount.publicKey,
            "-c",
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.status).toBe("estimated");
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Account);
    }, 600000);
    it("Forge Metal into Account", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-s", signerAccount.publicKey,
            "-t", targetAccount.publicKey,
            "--cosigner", targetAccount.privateKey,
            "-c",
            "-v",
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.status).toBe("forged");
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Account);
        (0, assert_1.default)(output === null || output === void 0 ? void 0 : output.metalId);
        await utils_1.MetalTest.scrapMetal(output === null || output === void 0 ? void 0 : output.metalId, signerAccount.publicAccount, targetAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Forge Metal into Mosaic", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            "-t", signerAccount.publicKey,
            "--mosaic", mosaicId.toHex(),
            "--cosigner", targetAccount.privateKey,
            "-c",
            "-v",
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.status).toBe("forged");
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        (0, assert_1.default)(output === null || output === void 0 ? void 0 : output.metalId);
        await utils_1.MetalTest.scrapMetal(output === null || output === void 0 ? void 0 : output.metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Forge Metal into Namespace", async () => {
        (0, assert_1.default)(namespaceId.fullName);
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const output = await cli_1.ForgeCLI.main([
            "--force",
            "--priv-key", signerAccount.privateKey,
            "--src-pub-key", targetAccount.publicKey,
            "--tgt-pub-key", signerAccount.publicKey,
            "--namespace", namespaceId.fullName,
            "--src-priv-key", targetAccount.privateKey,
            "--check-collision",
            "--verify",
            "--parallels", "1",
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBeDefined();
        expect(output === null || output === void 0 ? void 0 : output.status).toBe("forged");
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        (0, assert_1.default)(output === null || output === void 0 ? void 0 : output.metalId);
        await utils_1.MetalTest.scrapMetal(output.metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Forge Metal into Account with Alt additive", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        // Estimate metal ID without no additive
        const outputNoAdditive = await cli_1.ForgeCLI.main([
            "--estimate",
            "--priv-key", signerAccount.privateKey,
            "-s", signerAccount.publicKey,
            "-t", targetAccount.publicKey,
            "--cosigner", targetAccount.privateKey,
            "-c",
            "--fee-ratio", "0.35",
            inputFile,
        ]);
        expect(outputNoAdditive === null || outputNoAdditive === void 0 ? void 0 : outputNoAdditive.metalId).toBeDefined();
        expect(outputNoAdditive === null || outputNoAdditive === void 0 ? void 0 : outputNoAdditive.additive).toBe("0000");
        // Forge metal with alt additive
        const additive = symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive());
        const outputWithAdditive = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-s", signerAccount.publicKey,
            "-t", targetAccount.publicKey,
            "--tgt-priv-key", targetAccount.privateKey,
            "-c",
            "-v",
            "--additive", additive,
            inputFile,
        ]);
        expect(outputWithAdditive === null || outputWithAdditive === void 0 ? void 0 : outputWithAdditive.metalId).toBeDefined();
        expect(outputWithAdditive === null || outputWithAdditive === void 0 ? void 0 : outputWithAdditive.metalId).not.toBe(outputNoAdditive === null || outputNoAdditive === void 0 ? void 0 : outputNoAdditive.metalId);
        expect(outputWithAdditive === null || outputWithAdditive === void 0 ? void 0 : outputWithAdditive.additive).toBe(additive);
        expect(outputWithAdditive === null || outputWithAdditive === void 0 ? void 0 : outputWithAdditive.type).toBe(symbol_sdk_1.MetadataType.Account);
        (0, assert_1.default)(outputWithAdditive === null || outputWithAdditive === void 0 ? void 0 : outputWithAdditive.metalId);
        await utils_1.MetalTest.scrapMetal(outputWithAdditive.metalId, signerAccount.publicAccount, targetAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
});
//# sourceMappingURL=forge.test.js.map