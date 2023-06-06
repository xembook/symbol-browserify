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
const cli_1 = require("../cli");
const cli_2 = require("../cli");
const fs_1 = __importDefault(require("fs"));
const services_1 = require("../services");
const intermediate_1 = require("../cli/intermediate");
describe("Reinforce CLI", () => {
    let inputFile;
    let outputFile;
    let targetAccount;
    let mosaicId;
    let namespaceId;
    let metalId;
    beforeAll(async () => {
        (0, utils_1.initTestEnv)();
        (0, assert_1.default)(process.env.TEST_INPUT_FILE);
        inputFile = process.env.TEST_INPUT_FILE;
        (0, assert_1.default)(process.env.TEST_OUTPUT_FILE);
        outputFile = process.env.TEST_OUTPUT_FILE;
        const assets = await utils_1.SymbolTest.generateAssets();
        targetAccount = assets.account;
        mosaicId = assets.mosaicId;
        namespaceId = assets.namespaceId;
    }, 600000);
    afterEach(() => {
        if (fs_1.default.existsSync(outputFile)) {
            fs_1.default.unlinkSync(outputFile);
        }
    });
    const compareBatches = (batches1, batches2) => {
        batches1 === null || batches1 === void 0 ? void 0 : batches1.forEach((batch, index) => {
            expect(batch.signedTx.payload).toStrictEqual(batches2 === null || batches2 === void 0 ? void 0 : batches2[index].signedTx.payload);
            expect(batch.maxFee.toDTO()).toStrictEqual(batches2 === null || batches2 === void 0 ? void 0 : batches2[index].maxFee.toDTO());
            expect(batch.cosignatures.map(({ signature, signerPublicKey, parentHash }) => ({ signature, signerPublicKey, parentHash }))).toStrictEqual(batches2 === null || batches2 === void 0 ? void 0 : batches2[index].cosignatures.map(({ signature, signerPublicKey, parentHash }) => ({ signature, signerPublicKey, parentHash })));
        });
    };
    it("Forge Account Metal", async () => {
        var _a, _b, _c, _d, _e;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const forgeOutput = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-c",
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "-o", outputFile,
            inputFile,
        ]);
        expect(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId).toBeDefined();
        expect(fs_1.default.existsSync(outputFile)).toBeTruthy();
        (0, assert_1.default)(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        metalId = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId;
        // Overwrite outputFile
        const estimateOutput = await cli_2.ReinforceCLI.main([
            "-f",
            "--out", outputFile,
            outputFile,
            inputFile,
        ]);
        compareBatches(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.batches, forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.batches);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.command).toBe("forge");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.payload.buffer).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.payload.buffer);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.totalFee.toDTO()).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.totalFee.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.type);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.sourcePubAccount);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.targetPubAccount);
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual((_b = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.key) === null || _b === void 0 ? void 0 : _b.toDTO());
        expect((_c = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _c === void 0 ? void 0 : _c.toHex()).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.mosaicId);
        expect((_d = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _d === void 0 ? void 0 : _d.toHex()).toBe((_e = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.namespaceId) === null || _e === void 0 ? void 0 : _e.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.additive).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.additive);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.signerPubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.signerPubAccount);
        const reinforceOutput = await cli_2.ReinforceCLI.main([
            "-a",
            "-f",
            "--cosigner", targetAccount.privateKey,
            outputFile,
            inputFile,
        ]);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.metalId).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.command).toBe("forge");
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.status).toBe("reinforced");
    }, 600000);
    it("Scrap Account Metal", async () => {
        var _a, _b, _c, _d, _e;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-o", outputFile,
            metalId,
        ]);
        expect(fs_1.default.existsSync(outputFile)).toBeTruthy();
        // Overwrite outputFile
        const estimateOutput = await cli_2.ReinforceCLI.main([
            "-f",
            "--out", outputFile,
            outputFile,
            inputFile,
        ]);
        compareBatches(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.batches, scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.batches);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.command).toBe("scrap");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.totalFee.toDTO()).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.totalFee.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.type);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.sourcePubAccount);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.targetPubAccount);
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual((_b = scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.key) === null || _b === void 0 ? void 0 : _b.toDTO());
        expect((_c = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _c === void 0 ? void 0 : _c.toHex()).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.mosaicId);
        expect((_d = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _d === void 0 ? void 0 : _d.toHex()).toBe((_e = scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.namespaceId) === null || _e === void 0 ? void 0 : _e.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.additive).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.additive);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.signerPubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.signerPubAccount);
        const reinforceOutput = await cli_2.ReinforceCLI.main([
            "-a",
            "-f",
            "--priv-key", targetAccount.privateKey,
            outputFile,
            inputFile,
        ]);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.metalId).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.command).toBe("scrap");
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.status).toBe("reinforced");
    }, 600000);
    it("Reject manipulated intermediate TXs", async () => {
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const forgeOutput1 = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-c",
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "-o", outputFile,
            inputFile,
        ]);
        const forgeOutput2 = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-c",
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "-o", outputFile,
            inputFile,
        ]);
        // Mix each outputs
        (0, assert_1.default)(forgeOutput1 === null || forgeOutput1 === void 0 ? void 0 : forgeOutput1.batches);
        (0, assert_1.default)(forgeOutput2 === null || forgeOutput2 === void 0 ? void 0 : forgeOutput2.batches);
        (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput1), { batches: [...forgeOutput1.batches, ...forgeOutput2.batches] }), outputFile);
        await expect(async () => {
            await cli_2.ReinforceCLI.main([
                "-f",
                outputFile,
                inputFile,
            ]);
        }).rejects.toThrowError("Input file is wrong or broken.");
        // Manipulated sourceAccount
        (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput1), { sourcePubAccount: targetAccount.publicAccount }), outputFile);
        await expect(async () => {
            await cli_2.ReinforceCLI.main([
                "-f",
                outputFile,
                inputFile,
            ]);
        }).rejects.toThrowError("Transaction's hash was mismatched.");
        // Manipulated targetAccount
        (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput1), { targetPubAccount: signerAccount.publicAccount }), outputFile);
        await expect(async () => {
            await cli_2.ReinforceCLI.main([
                "-f",
                outputFile,
                inputFile,
            ]);
        }).rejects.toThrowError("Transaction's hash was mismatched.");
        // Manipulated mosaicId
        const forgeOutput3 = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            "-m", mosaicId.toHex(),
            "-c",
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "-o", outputFile,
            inputFile,
        ]);
        (0, assert_1.default)(forgeOutput3);
        (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput3), { mosaicId: new symbol_sdk_1.MosaicId("123456789ABCDEF0") }), outputFile);
        await expect(async () => {
            await cli_2.ReinforceCLI.main([
                "-f",
                outputFile,
                inputFile,
            ]);
        }).rejects.toThrowError("Transaction's hash was mismatched.");
        // Manipulated namespaceId
        const forgeOutput4 = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-s", targetAccount.publicKey,
            "-n", namespaceId.toHex(),
            "-c",
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "-o", outputFile,
            inputFile,
        ]);
        (0, assert_1.default)(forgeOutput4);
        (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput4), { namespaceId: new symbol_sdk_1.NamespaceId("manipulated-namespace") }), outputFile);
        await expect(async () => {
            await cli_2.ReinforceCLI.main([
                "-f",
                outputFile,
                inputFile,
            ]);
        }).rejects.toThrowError("Transaction's hash was mismatched.");
        // Contamination
        const { epochAdjustment, networkCurrencyMosaicId, networkType } = await utils_1.symbolService.getNetwork();
        const txs = [
            symbol_sdk_1.TransferTransaction.create(symbol_sdk_1.Deadline.create(epochAdjustment), signerAccount.address, [new symbol_sdk_1.Mosaic(networkCurrencyMosaicId, symbol_sdk_1.UInt64.fromNumericString("10000000000"))], symbol_sdk_1.PlainMessage.create("I stole your money"), networkType).toAggregate(targetAccount.publicAccount)
        ];
        const batches = await utils_1.symbolService.buildSignedAggregateCompleteTxBatches(txs, signerAccount);
        await expect(async () => {
            (0, assert_1.default)(forgeOutput1 === null || forgeOutput1 === void 0 ? void 0 : forgeOutput1.batches);
            (0, intermediate_1.writeIntermediateFile)(Object.assign(Object.assign({}, forgeOutput1), { batches: [...forgeOutput1.batches, ...batches] }), outputFile);
        }).rejects.toThrowError("The transaction type must be account/mosaic/namespace metadata.");
    }, 600000);
    const compareUndeadBatches = (batches1, batches2) => {
        batches1 === null || batches1 === void 0 ? void 0 : batches1.forEach((batch1, index) => {
            const batch2 = batches2 === null || batches2 === void 0 ? void 0 : batches2[index];
            expect(batch1.nonce.toDTO()).toStrictEqual(batch2 === null || batch2 === void 0 ? void 0 : batch2.nonce.toDTO());
            expect(batch1.signatures).toStrictEqual(batch2 === null || batch2 === void 0 ? void 0 : batch2.signatures);
            expect(batch1.publicKey).toBe(batch2 === null || batch2 === void 0 ? void 0 : batch2.publicKey);
            expect(batch1.aggregateTx.type).toBe(batch2 === null || batch2 === void 0 ? void 0 : batch2.aggregateTx.type);
            expect(batch1.aggregateTx.maxFee.toDTO()).toStrictEqual(batch2 === null || batch2 === void 0 ? void 0 : batch2.aggregateTx.maxFee.toDTO());
            batch1.aggregateTx.innerTransactions.forEach((innerTx1, innerIndex) => {
                var _a, _b;
                const metadataTx1 = innerTx1;
                const metadataTx2 = batch2 === null || batch2 === void 0 ? void 0 : batch2.aggregateTx.innerTransactions[innerIndex];
                expect(metadataTx1.type).toBe(metadataTx2 === null || metadataTx2 === void 0 ? void 0 : metadataTx2.type);
                expect((_a = metadataTx1.signer) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual((_b = metadataTx2 === null || metadataTx2 === void 0 ? void 0 : metadataTx2.signer) === null || _b === void 0 ? void 0 : _b.toDTO());
                expect(metadataTx1.targetAddress.toDTO()).toStrictEqual(metadataTx2 === null || metadataTx2 === void 0 ? void 0 : metadataTx2.targetAddress.toDTO());
                expect(metadataTx1.value).toStrictEqual(metadataTx2 === null || metadataTx2 === void 0 ? void 0 : metadataTx2.value);
                if (metadataTx1.type === symbol_sdk_1.MetadataType.Mosaic) {
                    expect(metadataTx1.targetMosaicId.toHex())
                        .toBe(metadataTx2.targetMosaicId.toHex());
                }
                else if (metadataTx1.type === symbol_sdk_1.MetadataType.Namespace) {
                    expect(metadataTx1.targetNamespaceId.toHex())
                        .toBe(metadataTx2.targetNamespaceId.toHex());
                }
            });
        });
    };
    it("Forge Account Metal with long life intermediate TX", async () => {
        var _a, _b, _c, _d, _e;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const forgeOutput = await cli_1.ForgeCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "-c",
            "--deadline", `${24 * 5}`,
            "--additive", symbol_sdk_1.Convert.uint8ToUtf8(services_1.MetalService.generateRandomAdditive()),
            "--num-cosigs", "1",
            "-o", outputFile,
            inputFile,
        ]);
        expect(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId).toBeDefined();
        expect(fs_1.default.existsSync(outputFile)).toBeTruthy();
        (0, assert_1.default)(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        metalId = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId;
        // Overwrite outputFile
        const estimateOutput = await cli_2.ReinforceCLI.main([
            "-f",
            "--out", outputFile,
            outputFile,
            inputFile,
        ]);
        compareUndeadBatches(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.undeadBatches, forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.undeadBatches);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.command).toBe("forge");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.payload.buffer).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.payload.buffer);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.totalFee.toDTO()).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.totalFee.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.type);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.sourcePubAccount);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.targetPubAccount);
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual((_b = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.key) === null || _b === void 0 ? void 0 : _b.toDTO());
        expect((_c = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _c === void 0 ? void 0 : _c.toHex()).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.mosaicId);
        expect((_d = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _d === void 0 ? void 0 : _d.toHex()).toBe((_e = forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.namespaceId) === null || _e === void 0 ? void 0 : _e.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.additive).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.additive);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.signerPubAccount).toStrictEqual(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.signerPubAccount);
        const reinforceOutput = await cli_2.ReinforceCLI.main([
            "-a",
            "-f",
            "--cosigner", targetAccount.privateKey,
            outputFile,
            inputFile,
        ]);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.metalId).toBe(forgeOutput === null || forgeOutput === void 0 ? void 0 : forgeOutput.metalId);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.command).toBe("forge");
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.status).toBe("reinforced");
    }, 600000);
    it("Scrap Account Metal with long life intermediate TX", async () => {
        var _a, _b, _c, _d, _e;
        const { signerAccount } = await utils_1.SymbolTest.getNamedAccounts();
        const scrapOutput = await cli_1.ScrapCLI.main([
            "-f",
            "--priv-key", signerAccount.privateKey,
            "-t", targetAccount.publicKey,
            "--deadline", `${24 * 5}`,
            "--num-cosigs", "1",
            "-o", outputFile,
            metalId,
        ]);
        expect(fs_1.default.existsSync(outputFile)).toBeTruthy();
        // Overwrite outputFile
        const estimateOutput = await cli_2.ReinforceCLI.main([
            "-f",
            "--out", outputFile,
            outputFile,
            inputFile,
        ]);
        compareUndeadBatches(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.undeadBatches, scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.undeadBatches);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.metalId).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.command).toBe("scrap");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.status).toBe("estimated");
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.totalFee.toDTO()).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.totalFee.toDTO());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.type).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.type);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.sourcePubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.sourcePubAccount);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.targetPubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.targetPubAccount);
        expect((_a = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.key) === null || _a === void 0 ? void 0 : _a.toDTO()).toStrictEqual((_b = scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.key) === null || _b === void 0 ? void 0 : _b.toDTO());
        expect((_c = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.mosaicId) === null || _c === void 0 ? void 0 : _c.toHex()).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.mosaicId);
        expect((_d = estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.namespaceId) === null || _d === void 0 ? void 0 : _d.toHex()).toBe((_e = scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.namespaceId) === null || _e === void 0 ? void 0 : _e.toHex());
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.additive).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.additive);
        expect(estimateOutput === null || estimateOutput === void 0 ? void 0 : estimateOutput.signerPubAccount).toStrictEqual(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.signerPubAccount);
        const reinforceOutput = await cli_2.ReinforceCLI.main([
            "-a",
            "-f",
            "--priv-key", targetAccount.privateKey,
            outputFile,
            inputFile,
        ]);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.metalId).toBe(scrapOutput === null || scrapOutput === void 0 ? void 0 : scrapOutput.metalId);
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.command).toBe("scrap");
        expect(reinforceOutput === null || reinforceOutput === void 0 ? void 0 : reinforceOutput.status).toBe("reinforced");
    }, 600000);
});
//# sourceMappingURL=reinforce.test.js.map