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
describe("Verify CLI", () => {
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
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Account, signerAccount.publicAccount, targetAccount.publicAccount, undefined, testData, signerAccount, [targetAccount]);
        const output = await cli_1.VerifyCLI.main([
            metalId,
            inputFile,
        ]);
        expect((_a = output === null || output === void 0 ? void 0 : output.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual(key.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.mosaicId).toBeUndefined();
        expect(output === null || output === void 0 ? void 0 : output.namespaceId).toBeUndefined();
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, signerAccount.publicAccount, targetAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Mosaic Metal via metal ID", async () => {
        var _a, _b;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, signerAccount.publicAccount, mosaicId, testData, signerAccount, [targetAccount]);
        const output = await cli_1.VerifyCLI.main([
            metalId,
            inputFile,
        ]);
        expect((_a = output === null || output === void 0 ? void 0 : output.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual(key.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect((_b = output === null || output === void 0 ? void 0 : output.mosaicId) === null || _b === void 0 ? void 0 : _b.toHex()).toBe(mosaicId.toHex());
        expect(output === null || output === void 0 ? void 0 : output.namespaceId).toBeUndefined();
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Namespace Metal via metal ID", async () => {
        var _a, _b;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, signerAccount.publicAccount, namespaceId, testData, signerAccount, [targetAccount]);
        const output = await cli_1.VerifyCLI.main([
            metalId,
            inputFile,
        ]);
        expect((_a = output === null || output === void 0 ? void 0 : output.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual(key.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.mosaicId).toBeUndefined();
        expect((_b = output === null || output === void 0 ? void 0 : output.namespaceId) === null || _b === void 0 ? void 0 : _b.toHex()).toBe(namespaceId.toHex());
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Account Metal via metadata key", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Account, signerAccount.publicAccount, targetAccount.publicAccount, undefined, testData, signerAccount, [targetAccount]);
        const output = await cli_1.VerifyCLI.main([
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-k", key.toHex(),
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBe(metalId);
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.mosaicId).toBeUndefined();
        expect(output === null || output === void 0 ? void 0 : output.namespaceId).toBeUndefined();
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, signerAccount.publicAccount, targetAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Mosaic Metal via metadata key", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, signerAccount.publicAccount, mosaicId, testData, signerAccount, [targetAccount]);
        const output = await cli_1.VerifyCLI.main([
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            "-m", mosaicId.toHex(),
            "-k", key.toHex(),
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBe(metalId);
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect((_a = output === null || output === void 0 ? void 0 : output.mosaicId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(mosaicId.toHex());
        expect(output === null || output === void 0 ? void 0 : output.namespaceId).toBeUndefined();
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
    it("Namespace Metal via metadata key", async () => {
        var _a;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, signerAccount.publicAccount, namespaceId, testData, signerAccount, [targetAccount]);
        (0, assert_1.default)(namespaceId.fullName);
        const output = await cli_1.VerifyCLI.main([
            "--src-addr", targetAccount.address.plain(),
            "--tgt-addr", signerAccount.address.plain(),
            "-n", namespaceId.fullName,
            "--key", key.toHex(),
            inputFile,
        ]);
        expect(output === null || output === void 0 ? void 0 : output.metalId).toBe(metalId);
        expect(output === null || output === void 0 ? void 0 : output.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        expect(output === null || output === void 0 ? void 0 : output.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.targetAddress.toDTO()).toStrictEqual(signerAccount.address.toDTO());
        expect(output === null || output === void 0 ? void 0 : output.mosaicId).toBeUndefined();
        expect((_a = output === null || output === void 0 ? void 0 : output.namespaceId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(namespaceId.toHex());
        (0, assert_1.default)(metalId);
        await utils_1.MetalTest.scrapMetal(metalId, targetAccount.publicAccount, signerAccount.publicAccount, signerAccount, [targetAccount]);
    }, 600000);
});
//# sourceMappingURL=verify.test.js.map