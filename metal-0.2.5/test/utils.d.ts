import { Account, MetadataType, MosaicId, NamespaceId, PublicAccount } from "symbol-sdk";
import { MetalService, SymbolService, SymbolTest } from "../services";
export { SymbolTest };
export declare let symbolService: SymbolService;
export declare let metalService: MetalService;
export declare const initTestEnv: () => void;
export declare namespace MetalTest {
    const forgeMetal: (type: MetadataType, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, targetId: undefined | MosaicId | NamespaceId, payload: Uint8Array, signer: Account, cosignerAccounts: Account[], additive?: Uint8Array) => Promise<{
        metalId: string;
        key: import("symbol-sdk").UInt64;
        additiveBytes: Uint8Array;
    }>;
    const scrapMetal: (metalId: string, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, signerAccount: Account, cosignerAccounts: Account[]) => Promise<void>;
}
//# sourceMappingURL=utils.d.ts.map