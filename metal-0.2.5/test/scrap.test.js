"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env.test' });
const symbol_sdk_1 = require("symbol-sdk");
const utils_1 = require("./utils");
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const cli_1 = require("../cli");
const services_1 = require("../services");
describe("Scrap CLI", () => {
    let inputFile;
    let targetAccount;
    let mosaicId;
    let namespaceId;
    let testData;
    beforeAll(async () => {
        (0, utils_1.initTestEnv)();
        (0, assert_1.default)(process.env.TEST_INPUT_FILE);
        inputFile = process.env.TEST_INPUT_FILE;
        testData = fs_1.default.readFileSync(process.env.TEST_INPUT_FILE);
        const assets = await utils_1.SymbolTest.generateAssets();
        targetAccount = assets.account;
        mosaicId = assets.mosaicId;
        namespaceId = assets.namespaceId;
    }, 600000);
    it("Account Metal via metal ID", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Account, signerAccount.publicAccount, targetAccount.publicAccount, undefined, testData, signerAccount, [targetAccount]);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            metalId,
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--tgt-priv-key", targetAccount.privateKey,
            metalId,
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Mosaic Metal via metal ID", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, signerAccount.publicAccount, mosaicId, testData, signerAccount, [targetAccount]);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            metalId,
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(mosaicId.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--src-priv-key", targetAccount.privateKey,
            metalId,
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Namespace Metal via metal ID", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, signerAccount.publicAccount, namespaceId, testData, signerAccount, [targetAccount]);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            metalId,
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId).toBeUndefined();
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(namespaceId.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--src-priv-key", targetAccount.privateKey,
            metalId,
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Account Metal via metadata key", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { key, metalId } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Account, signerAccount.publicAccount, targetAccount.publicAccount, undefined, testData, signerAccount, [targetAccount]);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-k", key.toHex(),
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--tgt-priv-key", targetAccount.privateKey,
            "-k", key.toHex(),
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Mosaic Metal via metadata key", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, signerAccount.publicAccount, mosaicId, testData, signerAccount, [targetAccount]);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "--src-pub-key", targetAccount.publicKey,
            "-m", mosaicId.toHex(),
            "-k", key.toHex(),
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(mosaicId.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--src-priv-key", targetAccount.privateKey,
            "--mosaic", mosaicId.toHex(),
            "-k", key.toHex(),
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Namespace Metal via metadata key", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, signerAccount.publicAccount, namespaceId, testData, signerAccount, [targetAccount]);
        (0, assert_1.default)(namespaceId.fullName);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            "-n", namespaceId.fullName,
            "-k", key.toHex(),
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId).toBeUndefined();
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(namespaceId.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "--src-priv-key", targetAccount.privateKey,
            "--namespace", namespaceId.fullName,
            "--key", key.toHex(),
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
    it("Account Metal via input file with Alt additive", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const generatedAdditiveBytes = services_1.MetalService.generateRandomAdditive();
        const { metalId, additiveBytes } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Account, signerAccount.publicAccount, targetAccount.publicAccount, undefined, testData, signerAccount, [targetAccount], generatedAdditiveBytes);
        const estimateOutput = await cli_1.ScrapCLI.main([
            "-e",
            "--priv-key", signerAccount.privateKey,
            "--tgt-pub-key", targetAccount.publicKey,
            "-i", inputFile,
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(additiveBytes),
        ]);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBeDefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount.toDTO()).toStrictEqual(signerAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount.toDTO()).toStrictEqual(targetAccount.publicAccount.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId).toBeUndefined();
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId).toBeUndefined();
        expect(additiveBytes).toStrictEqual(generatedAdditiveBytes);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        const scrapOutput = await cli_1.ScrapCLI.main([
            "--force",
            "--priv-key", signerAccount.privateKey,
            "--tgt-priv-key", targetAccount.privateKey,
            "--in", inputFile,
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(additiveBytes),
            "--parallels", "1",
            "--fee-ratio", "0.35",
        ]);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBeDefined();
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId).toBe(metalId);
        expect(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.status).toBe("scrapped");
    }, 6000000);
});
//# sourceMappingURL=scrap.test.js.map