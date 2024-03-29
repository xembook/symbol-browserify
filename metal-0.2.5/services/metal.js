"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetalService = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const symbol_1 = require("./symbol");
const libs_1 = require("../libs");
const assert_1 = __importDefault(require("assert"));
const js_sha3_1 = require("js-sha3");
const bs58_1 = __importDefault(require("bs58"));
const js_base64_1 = require("js-base64");
const VERSION = "010";
const HEADER_SIZE = 24;
const CHUNK_PAYLOAD_MAX_SIZE = 1000;
const METAL_ID_HEADER_HEX = "0B2A";
var Magic;
(function (Magic) {
    Magic["CHUNK"] = "C";
    Magic["END_CHUNK"] = "E";
})(Magic || (Magic = {}));
const isMagic = (char) => Object.values(Magic).includes(char);
class MetalService {
    // Use sha3_256 of first 64 bits, MSB should be 0
    static generateMetadataKey(input) {
        if (input.length === 0) {
            throw new Error("Input must not be empty");
        }
        const buf = js_sha3_1.sha3_256.arrayBuffer(input);
        const result = new Uint32Array(buf);
        return new symbol_sdk_1.UInt64([result[0], result[1] & 0x7FFFFFFF]);
    }
    // Use sha3_256 of first 64 bits
    static generateChecksum(input) {
        if (input.length === 0) {
            throw new Error("Input must not be empty");
        }
        const buf = js_sha3_1.sha3_256.arrayBuffer(input);
        const result = new Uint32Array(buf);
        return new symbol_sdk_1.UInt64([result[0], result[1]]);
    }
    static generateRandomAdditive() {
        return symbol_sdk_1.Convert.utf8ToUint8(`000${Math.floor(Math.random() * 1679616).toString(36).toUpperCase()}`.slice(-4));
    }
    // Return 46 bytes base58 string
    static calculateMetalId(type, sourceAddress, targetAddress, targetId, key) {
        const compositeHash = symbol_1.SymbolService.calculateMetadataHash(type, sourceAddress, targetAddress, targetId, key);
        const hashBytes = symbol_sdk_1.Convert.hexToUint8(METAL_ID_HEADER_HEX + compositeHash);
        return bs58_1.default.encode(hashBytes);
    }
    // Return 64 bytes hex string
    static restoreMetadataHash(metalId) {
        const hashHex = symbol_sdk_1.Convert.uint8ToHex(bs58_1.default.decode(metalId));
        if (!hashHex.startsWith(METAL_ID_HEADER_HEX)) {
            throw new Error("Invalid metal ID.");
        }
        return hashHex.slice(METAL_ID_HEADER_HEX.length);
    }
    static createMetadataLookupTable(metadataPool) {
        // Map key is hex string
        const lookupTable = new Map();
        metadataPool === null || metadataPool === void 0 ? void 0 : metadataPool.forEach((metadata) => lookupTable.set(metadata.metadataEntry.scopedMetadataKey.toHex(), metadata));
        return lookupTable;
    }
    // Returns:
    //   - value:
    //       [magic "C" or "E" (1 bytes)] +
    //       [version (3 bytes)] +
    //       [additive (4 bytes)] +
    //       [next key (when magic is "C"), file hash (when magic is "E") (16 bytes)] +
    //       [payload (1000 bytes)] = 1024 bytes
    //   - key: Hash of value
    static packChunkBytes(magic, version, additive, nextKey, chunkBytes) {
        (0, assert_1.default)(additive.length >= 4);
        // Append next scoped key into chunk's tail (except end of line)
        const value = new Uint8Array(chunkBytes.length + 8 + (nextKey ? 16 : 0));
        (0, assert_1.default)(value.length <= 1024);
        // Header (24 bytes)
        value.set(symbol_sdk_1.Convert.utf8ToUint8(magic.substring(0, 1)));
        value.set(symbol_sdk_1.Convert.utf8ToUint8(version.substring(0, 3)), 1);
        value.set(additive.subarray(0, 4), 4);
        value.set(symbol_sdk_1.Convert.utf8ToUint8(nextKey.toHex()), 8);
        // Payload (max 1000 bytes)
        value.set(chunkBytes, HEADER_SIZE);
        // key's length will always be 16 bytes
        const key = MetalService.generateMetadataKey(symbol_sdk_1.Convert.uint8ToUtf8(value));
        return { value, key };
    }
    // Calculate metadata key from payload. "additive" must be specified when using non-default one.
    static calculateMetadataKey(payload, additive = MetalService.DEFAULT_ADDITIVE) {
        const payloadBase64Bytes = symbol_sdk_1.Convert.utf8ToUint8(js_base64_1.Base64.fromUint8Array(payload));
        const chunks = Math.ceil(payloadBase64Bytes.length / CHUNK_PAYLOAD_MAX_SIZE);
        let nextKey = MetalService.generateChecksum(payload);
        for (let i = chunks - 1; i >= 0; i--) {
            const magic = i === chunks - 1 ? Magic.END_CHUNK : Magic.CHUNK;
            const chunkBytes = payloadBase64Bytes.subarray(i * CHUNK_PAYLOAD_MAX_SIZE, (i + 1) * CHUNK_PAYLOAD_MAX_SIZE);
            nextKey = MetalService.packChunkBytes(magic, VERSION, additive, nextKey, chunkBytes).key;
        }
        return nextKey;
    }
    static extractChunk(chunk) {
        const magic = chunk.value.substring(0, 1);
        if (!isMagic(magic)) {
            libs_1.Logger.error(`Error: Malformed header magic ${magic}`);
            return undefined;
        }
        const version = chunk.value.substring(1, 4);
        if (version !== VERSION) {
            libs_1.Logger.error(`Error: Malformed header version ${version}`);
            return undefined;
        }
        const metadataValue = chunk.value;
        const checksum = MetalService.generateMetadataKey(metadataValue);
        if (!checksum.equals(chunk.scopedMetadataKey)) {
            libs_1.Logger.error(`Error: The chunk ${chunk.scopedMetadataKey.toHex()} is broken ` +
                `(calculated=${checksum.toHex()})`);
            return undefined;
        }
        const additive = symbol_sdk_1.Convert.utf8ToUint8(metadataValue.substring(4, 8));
        const nextKey = metadataValue.substring(8, HEADER_SIZE);
        const chunkPayload = metadataValue.substring(HEADER_SIZE, HEADER_SIZE + CHUNK_PAYLOAD_MAX_SIZE);
        return {
            magic,
            version,
            checksum,
            nextKey,
            chunkPayload,
            additive,
        };
    }
    // Return: Decoded payload string.
    static decode(key, metadataPool) {
        var _a;
        const lookupTable = MetalService.createMetadataLookupTable(metadataPool);
        let decodedString = "";
        let currentKeyHex = key.toHex();
        let magic = "";
        do {
            const metadata = (_a = lookupTable.get(currentKeyHex)) === null || _a === void 0 ? void 0 : _a.metadataEntry;
            if (!metadata) {
                libs_1.Logger.error(`Error: The chunk ${currentKeyHex} lost`);
                break;
            }
            lookupTable.delete(currentKeyHex); // Prevent loop
            const result = MetalService.extractChunk(metadata);
            if (!result) {
                break;
            }
            magic = result.magic;
            currentKeyHex = result.nextKey;
            decodedString += result.chunkPayload;
        } while (magic !== Magic.END_CHUNK);
        return decodedString;
    }
    constructor(symbolService) {
        this.symbolService = symbolService;
    }
    // Returns:
    //   - key: Metadata key of first chunk (*undefined* when no transactions were created)
    //   - txs: List of metadata transaction (*InnerTransaction* for aggregate tx)
    //   - additive: Actual additive that been used during encoding. You should store this for verifying the metal.
    async createForgeTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additive = MetalService.DEFAULT_ADDITIVE, metadataPool) {
        const lookupTable = MetalService.createMetadataLookupTable(metadataPool);
        const payloadBase64Bytes = symbol_sdk_1.Convert.utf8ToUint8(js_base64_1.Base64.fromUint8Array(payload));
        const txs = new Array();
        const keys = new Array();
        const chunks = Math.ceil(payloadBase64Bytes.length / CHUNK_PAYLOAD_MAX_SIZE);
        let nextKey = MetalService.generateChecksum(payload);
        for (let i = chunks - 1; i >= 0; i--) {
            const magic = i === chunks - 1 ? Magic.END_CHUNK : Magic.CHUNK;
            const chunkBytes = payloadBase64Bytes.subarray(i * CHUNK_PAYLOAD_MAX_SIZE, (i + 1) * CHUNK_PAYLOAD_MAX_SIZE);
            const { value, key } = MetalService.packChunkBytes(magic, VERSION, additive, nextKey, chunkBytes);
            if (keys.includes(key.toHex())) {
                libs_1.Logger.warn(`Warning: Scoped key "${key.toHex()}" has been conflicted. Trying another additive.`);
                // Retry with another additive via recursive call
                return this.createForgeTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, MetalService.generateRandomAdditive(), metadataPool);
            }
            // Only non on-chain data to be announced.
            !lookupTable.has(key.toHex()) && txs.push(await this.symbolService.createMetadataTx(type, sourcePubAccount, targetPubAccount, targetId, key, value));
            keys.push(key.toHex());
            nextKey = key;
        }
        return {
            key: nextKey,
            txs: txs.reverse(),
            additive,
        };
    }
    // Scrap metal via removing metadata
    async createScrapTxs(type, sourcePubAccount, targetPubAccount, targetId, key, metadataPool) {
        var _a;
        const lookupTable = MetalService.createMetadataLookupTable(metadataPool ||
            // Retrieve scoped metadata from on-chain
            await this.symbolService.searchMetadata(type, {
                source: sourcePubAccount,
                target: targetPubAccount,
                targetId,
            }));
        const scrappedValueBytes = symbol_sdk_1.Convert.utf8ToUint8("");
        const txs = new Array();
        let currentKeyHex = key.toHex();
        let magic;
        do {
            const metadata = (_a = lookupTable.get(currentKeyHex)) === null || _a === void 0 ? void 0 : _a.metadataEntry;
            if (!metadata) {
                libs_1.Logger.error(`Error: The chunk ${currentKeyHex} lost.`);
                return undefined;
            }
            lookupTable.delete(currentKeyHex); // Prevent loop
            const chunk = MetalService.extractChunk(metadata);
            if (!chunk) {
                return undefined;
            }
            const valueBytes = symbol_sdk_1.Convert.utf8ToUint8(metadata.value);
            txs.push(await this.symbolService.createMetadataTx(type, sourcePubAccount, targetPubAccount, targetId, metadata.scopedMetadataKey, symbol_sdk_1.Convert.hexToUint8(symbol_sdk_1.Convert.xor(valueBytes, scrappedValueBytes)), scrappedValueBytes.length - valueBytes.length));
            magic = chunk.magic;
            currentKeyHex = chunk.nextKey;
        } while (magic !== Magic.END_CHUNK);
        return txs;
    }
    async createDestroyTxs(type, sourcePubAccount, targetPubAccount, targetId, payload, additive = MetalService.DEFAULT_ADDITIVE, metadataPool) {
        const lookupTable = MetalService.createMetadataLookupTable(metadataPool ||
            // Retrieve scoped metadata from on-chain
            await this.symbolService.searchMetadata(type, { source: sourcePubAccount, target: targetPubAccount, targetId }));
        const scrappedValueBytes = symbol_sdk_1.Convert.utf8ToUint8("");
        const payloadBase64Bytes = symbol_sdk_1.Convert.utf8ToUint8(js_base64_1.Base64.fromUint8Array(payload));
        const chunks = Math.ceil(payloadBase64Bytes.length / CHUNK_PAYLOAD_MAX_SIZE);
        const txs = new Array();
        let nextKey = MetalService.generateChecksum(payload);
        for (let i = chunks - 1; i >= 0; i--) {
            const magic = i === chunks - 1 ? Magic.END_CHUNK : Magic.CHUNK;
            const chunkBytes = payloadBase64Bytes.subarray(i * CHUNK_PAYLOAD_MAX_SIZE, (i + 1) * CHUNK_PAYLOAD_MAX_SIZE);
            const { key } = MetalService.packChunkBytes(magic, VERSION, additive, nextKey, chunkBytes);
            const onChainMetadata = lookupTable.get(key.toHex());
            if (onChainMetadata) {
                // Only on-chain data to be announced.
                const valueBytes = symbol_sdk_1.Convert.utf8ToUint8(onChainMetadata.metadataEntry.value);
                txs.push(await this.symbolService.createMetadataTx(type, sourcePubAccount, targetPubAccount, targetId, key, symbol_sdk_1.Convert.hexToUint8(symbol_sdk_1.Convert.xor(valueBytes, scrappedValueBytes)), scrappedValueBytes.length - valueBytes.length));
            }
            nextKey = key;
        }
        return txs.reverse();
    }
    async checkCollision(txs, type, source, target, targetId, metadataPool) {
        const lookupTable = MetalService.createMetadataLookupTable(metadataPool ||
            // Retrieve scoped metadata from on-chain
            await this.symbolService.searchMetadata(type, { source, target, targetId }));
        const collisions = new Array();
        const metadataTxTypes = [
            symbol_sdk_1.TransactionType.ACCOUNT_METADATA,
            symbol_sdk_1.TransactionType.MOSAIC_METADATA,
            symbol_sdk_1.TransactionType.NAMESPACE_METADATA
        ];
        if (type === symbol_sdk_1.MetadataType.Account) {
            for (const tx of txs) {
                if (!metadataTxTypes.includes(tx.type)) {
                    continue;
                }
                let metadataTx = tx;
                const keyHex = metadataTx.scopedMetadataKey.toHex();
                if (lookupTable.has(keyHex)) {
                    libs_1.Logger.warn(`${keyHex}: Already exists on the chain.`);
                    collisions.push(metadataTx.scopedMetadataKey);
                }
            }
        }
        return collisions;
    }
    async verify(payload, type, sourceAddress, targetAddress, key, targetId, metadataPool) {
        const payloadBase64 = js_base64_1.Base64.fromUint8Array(payload);
        const decodedBase64 = MetalService.decode(key, metadataPool ||
            // Retrieve scoped metadata from on-chain
            await this.symbolService.searchMetadata(type, { source: sourceAddress, target: targetAddress, targetId })) || "";
        let mismatches = 0;
        const maxLength = Math.max(payloadBase64.length, decodedBase64.length);
        for (let i = 0; i < maxLength; i++) {
            if (payloadBase64.charAt(i) !== (decodedBase64 === null || decodedBase64 === void 0 ? void 0 : decodedBase64.charAt(i))) {
                mismatches++;
            }
        }
        return {
            maxLength,
            mismatches,
        };
    }
    async getFirstChunk(metalId) {
        return this.symbolService.getMetadataByHash(MetalService.restoreMetadataHash(metalId));
    }
    async fetch(type, source, target, targetId, key) {
        const metadataPool = await this.symbolService.searchMetadata(type, { source, target, targetId });
        return js_base64_1.Base64.toUint8Array(MetalService.decode(key, metadataPool));
    }
    // Returns:
    //   - payload: Decoded metal contents
    //   - type: Metadata type
    //   - sourceAddress: Metadata source address
    //   - targetAddress: Metadata target address
    //   - targetId: Metadata target ID (NamespaceId, MosaicId or undefined for account)
    //   - key: Metadata key
    async fetchByMetalId(metalId) {
        const metadata = await this.getFirstChunk(metalId);
        const metadataEntry = metadata.metadataEntry;
        const payload = await this.fetch(metadataEntry.metadataType, metadataEntry.sourceAddress, metadataEntry.targetAddress, metadataEntry.targetId, metadataEntry.scopedMetadataKey);
        return {
            payload,
            type: metadataEntry.metadataType,
            sourceAddress: metadataEntry.sourceAddress,
            targetAddress: metadataEntry.targetAddress,
            targetId: metadataEntry.targetId,
            key: metadataEntry.scopedMetadataKey,
        };
    }
}
exports.MetalService = MetalService;
MetalService.DEFAULT_ADDITIVE = symbol_sdk_1.Convert.utf8ToUint8("0000");
// Verify metadata key with calculated one. "additive" must be specified when using non-default one.
MetalService.verifyMetadataKey = (key, payload, additive = MetalService.DEFAULT_ADDITIVE) => MetalService.calculateMetadataKey(payload, additive).equals(key);
//# sourceMappingURL=metal.js.map