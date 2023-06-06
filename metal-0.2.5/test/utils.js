"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetalTest = exports.initTestEnv = exports.metalService = exports.symbolService = exports.SymbolTest = void 0;
const assert_1 = __importDefault(require("assert"));
const symbol_sdk_1 = require("symbol-sdk");
const services_1 = require("../services");
Object.defineProperty(exports, "SymbolTest", { enumerable: true, get: function () { return services_1.SymbolTest; } });
const libs_1 = require("../libs");
const initTestEnv = () => {
    libs_1.Logger.init({ log_level: libs_1.Logger.LogLevel.DEBUG });
    exports.symbolService = services_1.SymbolTest.init();
    exports.metalService = new services_1.MetalService(exports.symbolService);
};
exports.initTestEnv = initTestEnv;
var MetalTest;
(function (MetalTest) {
    MetalTest.forgeMetal = async (type, sourcePubAccount, targetPubAccount, targetId, payload, signer, cosignerAccounts, additive) => {
        const { key, txs, additive: additiveBytes } = await exports.metalService.createForgeTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additive);
        (0, assert_1.default)(txs.length);
        console.log(`key=${key.toHex()}`);
        console.log(`txs.length=${txs.length}`);
        console.log(`additive=${symbol_sdk_1.Convert.uint8ToUtf8(additiveBytes)}`);
        await services_1.SymbolTest.announceAll(txs, signer, cosignerAccounts);
        const metalId = services_1.MetalService.calculateMetalId(type, sourcePubAccount.address, targetPubAccount.address, targetId, key);
        console.log(`Computed Metal ID is ${metalId}`);
        return {
            metalId,
            key,
            additiveBytes,
        };
    };
    MetalTest.scrapMetal = async (metalId, sourcePubAccount, targetPubAccount, signerAccount, cosignerAccounts) => {
        const metadataEntry = (await exports.metalService.getFirstChunk(metalId)).metadataEntry;
        const txs = await exports.metalService.createScrapTxs(metadataEntry.metadataType, sourcePubAccount, targetPubAccount, metadataEntry.targetId, metadataEntry.scopedMetadataKey);
        (0, assert_1.default)(txs);
        console.log(`txs.length=${txs.length}`);
        await services_1.SymbolTest.announceAll(txs, signerAccount, cosignerAccounts);
    };
})(MetalTest = exports.MetalTest || (exports.MetalTest = {}));
//# sourceMappingURL=utils.js.map