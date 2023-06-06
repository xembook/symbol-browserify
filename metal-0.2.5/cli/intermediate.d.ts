import { MetadataType, MosaicId, NamespaceId, NetworkType, PublicAccount, UInt64 } from "symbol-sdk";
import { SignedAggregateTx } from "../services";
import { AggregateUndeadTransaction, UndeadSignature } from "@opensphere-inc/symbol-service";
export declare const VERSION = "2.1";
export declare const SUPPORTED_VERSION: RegExp;
export interface IntermediateTxs {
    version: string;
    command: "forge" | "scrap";
    metalId: string;
    networkType: NetworkType;
    type: MetadataType;
    sourcePublicKey: string;
    targetPublicKey: string;
    key?: string;
    mosaicId?: string;
    namespaceId?: string;
    totalFee: number[];
    additive: string;
    signerPublicKey: string;
    txs?: {
        keys: string[];
        maxFee: number[];
        deadline: number;
        hash: string;
        cosignatures: {
            parentHash: string;
            signature: string;
            signerPublicKey: string;
        }[];
        signature: string;
    }[];
    undeadTxs?: {
        keys: string[];
        maxFee: number[];
        nonce: number[];
        signatures: UndeadSignature[];
    }[];
    createdAt: string;
    updatedAt: string;
}
export interface IntermediateOutput {
    command: "forge" | "scrap";
    type: MetadataType;
    sourcePubAccount: PublicAccount;
    targetPubAccount: PublicAccount;
    key?: UInt64;
    mosaicId?: MosaicId;
    namespaceId?: NamespaceId;
    networkType: NetworkType;
    batches?: SignedAggregateTx[];
    undeadBatches?: AggregateUndeadTransaction[];
    signerPubAccount: PublicAccount;
    totalFee: UInt64;
    additive: string;
    metalId: string;
    createdAt: Date;
}
export declare const writeIntermediateFile: (output: Readonly<IntermediateOutput>, filePath: string) => void;
export declare const readIntermediateFile: (filePath: string) => IntermediateTxs;
//# sourceMappingURL=intermediate.d.ts.map