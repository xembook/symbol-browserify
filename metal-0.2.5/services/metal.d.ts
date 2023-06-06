import { Account, Address, InnerTransaction, Metadata, MetadataEntry, MetadataType, MosaicId, NamespaceId, PublicAccount, UInt64 } from "symbol-sdk";
import { SymbolService } from "./symbol";
declare enum Magic {
    CHUNK = "C",
    END_CHUNK = "E"
}
export declare class MetalService {
    readonly symbolService: SymbolService;
    static DEFAULT_ADDITIVE: Uint8Array;
    static generateMetadataKey(input: string): UInt64;
    static generateChecksum(input: Uint8Array): UInt64;
    static generateRandomAdditive(): Uint8Array;
    static calculateMetalId(type: MetadataType, sourceAddress: Address, targetAddress: Address, targetId: undefined | MosaicId | NamespaceId, key: UInt64): string;
    static restoreMetadataHash(metalId: string): string;
    private static createMetadataLookupTable;
    private static packChunkBytes;
    static calculateMetadataKey(payload: Uint8Array, additive?: Uint8Array): UInt64;
    static verifyMetadataKey: (key: UInt64, payload: Uint8Array, additive?: Uint8Array) => boolean;
    static extractChunk(chunk: MetadataEntry): {
        magic: Magic;
        version: string;
        checksum: UInt64;
        nextKey: string;
        chunkPayload: string;
        additive: Uint8Array;
    } | undefined;
    static decode(key: UInt64, metadataPool: Metadata[]): string;
    constructor(symbolService: SymbolService);
    createForgeTxs(type: MetadataType, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, targetId: undefined | MosaicId | NamespaceId, payload: Uint8Array, additive?: Uint8Array, metadataPool?: Metadata[]): Promise<{
        key: UInt64;
        txs: InnerTransaction[];
        additive: Uint8Array;
    }>;
    createScrapTxs(type: MetadataType, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, targetId: undefined | MosaicId | NamespaceId, key: UInt64, metadataPool?: Metadata[]): Promise<InnerTransaction[] | undefined>;
    createDestroyTxs(type: MetadataType, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, targetId: undefined | MosaicId | NamespaceId, payload: Uint8Array, additive?: Uint8Array, metadataPool?: Metadata[]): Promise<InnerTransaction[]>;
    checkCollision(txs: InnerTransaction[], type: MetadataType, source: Account | PublicAccount | Address, target: Account | PublicAccount | Address, targetId?: MosaicId | NamespaceId, metadataPool?: Metadata[]): Promise<UInt64[]>;
    verify(payload: Uint8Array, type: MetadataType, sourceAddress: Address, targetAddress: Address, key: UInt64, targetId?: MosaicId | NamespaceId, metadataPool?: Metadata[]): Promise<{
        maxLength: number;
        mismatches: number;
    }>;
    getFirstChunk(metalId: string): Promise<Metadata>;
    fetch(type: MetadataType, source: Address | Account | PublicAccount, target: Address | Account | PublicAccount, targetId: undefined | MosaicId | NamespaceId, key: UInt64): Promise<Uint8Array>;
    fetchByMetalId(metalId: string): Promise<{
        payload: Uint8Array;
        type: MetadataType;
        sourceAddress: Address;
        targetAddress: Address;
        targetId: NamespaceId | MosaicId | undefined;
        key: UInt64;
    }>;
}
export {};
//# sourceMappingURL=metal.d.ts.map