"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './.env.test' });
const utils_1 = require("./utils");
const services_1 = require("../services");
const fs_1 = __importDefault(require("fs"));
const symbol_sdk_1 = require("symbol-sdk");
const long_1 = __importDefault(require("long"));
const assert_1 = __importDefault(require("assert"));
const moment_1 = __importDefault(require("moment"));
const js_base64_1 = require("js-base64");
describe("MetalService", () => {
    let targetAccount;
    let metadataKey;
    let metalAdditive;
    let testData;
    let dataChunks;
    let metadataPool;
    let mosaicId;
    let namespaceId;
    let metalId;
    beforeAll(async () => {
        (0, utils_1.initTestEnv)();
        (0, assert_1.default)(process.env.TEST_INPUT_FILE);
        testData = fs_1.default.readFileSync(process.env.TEST_INPUT_FILE);
        dataChunks = Math.ceil(js_base64_1.Base64.fromUint8Array(testData).length / 1000);
        const assets = await utils_1.SymbolTest.generateAssets();
        targetAccount = assets.account;
        mosaicId = assets.mosaicId;
        namespaceId = assets.namespaceId;
    }, 600000);
    const doBatches = async (txs, signer, cosigners) => {
        (0, assert_1.default)(process.env.BATCH_SIZE);
        const start = moment_1.default.now();
        const errors = await utils_1.SymbolTest.doAggregateTxBatches(txs, signer, cosigners, (batches, totalFee) => {
            console.log(`totalFee=${services_1.SymbolService.toXYM(long_1.default.fromString(totalFee.toString()))}`);
            console.log(`batches.length=${batches.length}`);
            expect(batches.length).toBe(Math.ceil(dataChunks / utils_1.symbolService.config.batch_size));
        });
        console.log(`announce time=${(0, moment_1.default)().diff(start, "seconds", true)}secs, errors=${(errors === null || errors === void 0 ? void 0 : errors.length) || 0}`);
        return errors;
    };
    it("Compute metal ID and restore metadata hash", async () => {
        const { signerAccount: sourceAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const metadataHash = services_1.SymbolService.calculateMetadataHash(symbol_sdk_1.MetadataType.Mosaic, sourceAccount.address, targetAccount.address, mosaicId, services_1.MetalService.generateMetadataKey("test1keyhohohogehoge"));
        console.log(`metadataHash=${metadataHash}`);
        const metalId = services_1.MetalService.calculateMetalId(symbol_sdk_1.MetadataType.Mosaic, sourceAccount.address, targetAccount.address, mosaicId, services_1.MetalService.generateMetadataKey("test1keyhohohogehoge"));
        console.log(`metalId=${metalId}`);
        const restoredHash = services_1.MetalService.restoreMetadataHash(metalId);
        console.log(`restoredHash=${restoredHash}`);
        expect(restoredHash).toBe(metadataHash);
    });
    it("Forge account metal", async () => {
        const { signerAccount: sourceAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { key, txs, additive } = await utils_1.metalService.createForgeTxs(symbol_sdk_1.MetadataType.Account, sourceAccount.publicAccount, targetAccount.publicAccount, undefined, testData);
        expect(key).toBeDefined();
        (0, assert_1.default)(key);
        metadataKey = key;
        metalAdditive = additive;
        metalId = services_1.MetalService.calculateMetalId(symbol_sdk_1.MetadataType.Account, sourceAccount.address, targetAccount.address, undefined, metadataKey);
        console.log(`key=${key === null || key === void 0 ? void 0 : key.toHex()}`);
        console.log(`additive=${symbol_sdk_1.Convert.uint8ToUtf8(additive)}`);
        console.log(`metalId=${metalId}`);
        console.log(`txs.length=${txs.length}`);
        expect(txs[0].scopedMetadataKey).toBe(key);
        expect(txs.length).toBe(dataChunks);
        const errors = await doBatches(txs, sourceAccount, [targetAccount]);
        expect(errors).toBeUndefined();
    }, 600000);
    it("Fetch and decode account metal", async () => {
        const { signerAccount: sourceAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const result = await utils_1.metalService.fetchByMetalId(metalId);
        expect(result).toBeDefined();
        expect(result === null || result === void 0 ? void 0 : result.payload.buffer).toStrictEqual(testData.buffer);
        expect(result === null || result === void 0 ? void 0 : result.type).toBe(symbol_sdk_1.MetadataType.Account);
        expect(result === null || result === void 0 ? void 0 : result.sourceAddress.toDTO()).toStrictEqual(sourceAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.targetAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.key.toDTO()).toStrictEqual(metadataKey.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.targetId).toBeUndefined();
    }, 600000);
    it("Verify account metal", () => {
        const result = services_1.MetalService.verifyMetadataKey(metadataKey, testData, metalAdditive);
        expect(result).toBeTruthy();
    });
    it("Scrap account metal", async () => {
        const { signerAccount: sourceAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const txs = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Account, sourceAccount.publicAccount, targetAccount.publicAccount, undefined, metadataKey);
        expect(txs).toBeDefined();
        (0, assert_1.default)(txs);
        console.log(`txs.length=${txs === null || txs === void 0 ? void 0 : txs.length}`);
        const errors = await doBatches(txs, sourceAccount, [targetAccount]);
        expect(errors).toBeUndefined();
        metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Account, { target: targetAccount });
        console.log(`metadataPool.length=${metadataPool.length}`);
        expect(metadataPool.length).toBeFalsy();
    }, 600000);
    it("Forge mosaic metal", async () => {
        const { signerAccount: creatorAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { key, txs, additive } = await utils_1.metalService.createForgeTxs(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, creatorAccount.publicAccount, mosaicId, testData);
        expect(key).toBeDefined();
        (0, assert_1.default)(key);
        metadataKey = key;
        metalAdditive = additive;
        metalId = services_1.MetalService.calculateMetalId(symbol_sdk_1.MetadataType.Mosaic, targetAccount.address, creatorAccount.address, mosaicId, metadataKey);
        console.log(`key=${key === null || key === void 0 ? void 0 : key.toHex()}`);
        console.log(`additive=${symbol_sdk_1.Convert.uint8ToUtf8(additive)}`);
        console.log(`metalId=${metalId}`);
        console.log(`txs.length=${txs.length}`);
        expect(txs[0].scopedMetadataKey).toBe(key);
        expect(txs.length).toBe(dataChunks);
        const errors = await doBatches(txs, creatorAccount, [targetAccount]);
        expect(errors).toBeUndefined();
    }, 600000);
    it("Fetch and decode mosaic metal", async () => {
        var _a;
        const { signerAccount: creatorAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const result = await utils_1.metalService.fetchByMetalId(metalId);
        expect(result).toBeDefined();
        expect(result === null || result === void 0 ? void 0 : result.payload.buffer).toStrictEqual(testData.buffer);
        expect(result === null || result === void 0 ? void 0 : result.type).toBe(symbol_sdk_1.MetadataType.Mosaic);
        expect(result === null || result === void 0 ? void 0 : result.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.targetAddress.toDTO()).toStrictEqual(creatorAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.key.toDTO()).toStrictEqual(metadataKey.toDTO());
        expect((_a = result === null || result === void 0 ? void 0 : result.targetId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(mosaicId.toHex());
    }, 600000);
    it("Verify mosaic metal", () => {
        const result = services_1.MetalService.verifyMetadataKey(metadataKey, testData, metalAdditive);
        expect(result).toBeTruthy();
    });
    it("Scrap mosaic metal", async () => {
        const { signerAccount: creatorAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const txs = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, creatorAccount.publicAccount, mosaicId, metadataKey);
        expect(txs).toBeDefined();
        (0, assert_1.default)(txs);
        console.log(`txs.length=${txs === null || txs === void 0 ? void 0 : txs.length}`);
        const errors = await doBatches(txs, creatorAccount, [targetAccount]);
        expect(errors).toBeUndefined();
        metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Mosaic, { targetId: mosaicId });
        console.log(`metadataPool.length=${metadataPool.length}`);
        expect(metadataPool.length).toBeFalsy();
    }, 600000);
    it("Forge namespace metal", async () => {
        const { signerAccount: ownerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { key, txs, additive } = await utils_1.metalService.createForgeTxs(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, ownerAccount.publicAccount, namespaceId, testData);
        expect(key).toBeDefined();
        (0, assert_1.default)(key);
        metadataKey = key;
        metalAdditive = additive;
        metalId = services_1.MetalService.calculateMetalId(symbol_sdk_1.MetadataType.Namespace, targetAccount.address, ownerAccount.address, namespaceId, metadataKey);
        console.log(`key=${key === null || key === void 0 ? void 0 : key.toHex()}`);
        console.log(`additive=${symbol_sdk_1.Convert.uint8ToUtf8(additive)}`);
        console.log(`metalId=${metalId}`);
        console.log(`txs.length=${txs.length}`);
        expect(txs[0].scopedMetadataKey).toBe(key);
        expect(txs.length).toBe(dataChunks);
        const errors = await doBatches(txs, ownerAccount, [targetAccount]);
        expect(errors).toBeUndefined();
    }, 600000);
    it("Fetch and decode namespace metal", async () => {
        var _a;
        const { signerAccount: ownerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const result = await utils_1.metalService.fetchByMetalId(metalId);
        expect(result).toBeDefined();
        expect(result === null || result === void 0 ? void 0 : result.payload.buffer).toStrictEqual(testData.buffer);
        expect(result === null || result === void 0 ? void 0 : result.type).toBe(symbol_sdk_1.MetadataType.Namespace);
        expect(result === null || result === void 0 ? void 0 : result.sourceAddress.toDTO()).toStrictEqual(targetAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.targetAddress.toDTO()).toStrictEqual(ownerAccount.address.toDTO());
        expect(result === null || result === void 0 ? void 0 : result.key.toDTO()).toStrictEqual(metadataKey.toDTO());
        expect((_a = result === null || result === void 0 ? void 0 : result.targetId) === null || _a === void 0 ? void 0 : _a.toHex()).toBe(namespaceId.toHex());
    }, 600000);
    it("Scrap namespace metal", async () => {
        const { signerAccount: ownerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const txs = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Namespace, targetAccount.publicAccount, ownerAccount.publicAccount, namespaceId, metadataKey);
        expect(txs).toBeDefined();
        (0, assert_1.default)(txs);
        console.log(`txs.length=${txs === null || txs === void 0 ? void 0 : txs.length}`);
        const errors = await doBatches(txs, ownerAccount, [targetAccount]);
        expect(errors).toBeUndefined();
        metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Namespace, { targetId: namespaceId });
        console.log(`metadataPool.length=${metadataPool.length}`);
        expect(metadataPool.length).toBeFalsy();
    }, 600000);
    it("Destroy mosaic metal", async () => {
        const { signerAccount: creatorAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { txs: forgeTxs, additive } = await utils_1.metalService.createForgeTxs(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, creatorAccount.publicAccount, mosaicId, testData);
        await doBatches(forgeTxs, creatorAccount, [targetAccount]);
        const destroyTxs = await utils_1.metalService.createDestroyTxs(symbol_sdk_1.MetadataType.Mosaic, targetAccount.publicAccount, creatorAccount.publicAccount, mosaicId, testData, additive);
        const errors = await doBatches(destroyTxs, creatorAccount, [targetAccount]);
        expect(errors).toBeUndefined();
        metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Mosaic, { targetId: mosaicId });
        console.log(`metadataPool.length=${metadataPool.length}`);
        expect(metadataPool.length).toBeFalsy();
    }, 600000);
    it("Failed to create Scrap TXs", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = (await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Mosaic, signerAccount.publicAccount, signerAccount.publicAccount, mosaicId, testData, signerAccount, []));
        const metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Mosaic, {
            source: signerAccount.publicAccount,
            target: signerAccount.publicAccount,
            targetId: mosaicId,
        });
        // Break metadata value
        const brokenMetadataPool = [...metadataPool];
        brokenMetadataPool[5] = new symbol_sdk_1.Metadata(brokenMetadataPool[5].id, new symbol_sdk_1.MetadataEntry(brokenMetadataPool[5].metadataEntry.version, brokenMetadataPool[5].metadataEntry.compositeHash, brokenMetadataPool[5].metadataEntry.sourceAddress, brokenMetadataPool[5].metadataEntry.targetAddress, brokenMetadataPool[5].metadataEntry.scopedMetadataKey, brokenMetadataPool[5].metadataEntry.metadataType, "", brokenMetadataPool[5].metadataEntry.targetId));
        const txs1 = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Mosaic, signerAccount.publicAccount, signerAccount.publicAccount, mosaicId, key, brokenMetadataPool);
        expect(txs1).toBeUndefined();
        // Break metadata chain
        brokenMetadataPool.splice(5, 1);
        const txs2 = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Mosaic, signerAccount.publicAccount, signerAccount.publicAccount, mosaicId, key, brokenMetadataPool);
        expect(txs2).toBeUndefined();
        await utils_1.MetalTest.scrapMetal(metalId, signerAccount.publicAccount, signerAccount.publicAccount, signerAccount, []);
    }, 600000);
    it("Failed to decode metal", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const { metalId, key } = (await utils_1.MetalTest.forgeMetal(symbol_sdk_1.MetadataType.Namespace, signerAccount.publicAccount, signerAccount.publicAccount, namespaceId, testData, signerAccount, []));
        const metadataPool = await utils_1.symbolService.searchMetadata(symbol_sdk_1.MetadataType.Namespace, {
            source: signerAccount.publicAccount,
            target: signerAccount.publicAccount,
            targetId: namespaceId,
        });
        // Break metadata value
        const brokenMetadataPool = [...metadataPool];
        brokenMetadataPool[10] = new symbol_sdk_1.Metadata(brokenMetadataPool[10].id, new symbol_sdk_1.MetadataEntry(brokenMetadataPool[10].metadataEntry.version, brokenMetadataPool[10].metadataEntry.compositeHash, brokenMetadataPool[10].metadataEntry.sourceAddress, brokenMetadataPool[10].metadataEntry.targetAddress, brokenMetadataPool[10].metadataEntry.scopedMetadataKey, brokenMetadataPool[10].metadataEntry.metadataType, "", brokenMetadataPool[10].metadataEntry.targetId));
        const txs1 = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Namespace, signerAccount.publicAccount, signerAccount.publicAccount, namespaceId, key, brokenMetadataPool);
        expect(txs1).toBeUndefined();
        // Break metadata chain
        brokenMetadataPool.splice(10, 1);
        const txs2 = await utils_1.metalService.createScrapTxs(symbol_sdk_1.MetadataType.Namespace, signerAccount.publicAccount, signerAccount.publicAccount, namespaceId, key, brokenMetadataPool);
        expect(txs2).toBeUndefined();
        await utils_1.MetalTest.scrapMetal(metalId, signerAccount.publicAccount, signerAccount.publicAccount, signerAccount, []);
    }, 600000);
});
//# sourceMappingURL=metal.test.js.map