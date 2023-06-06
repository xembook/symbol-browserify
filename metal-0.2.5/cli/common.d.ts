import { MetalService, SymbolService } from "../services";
import { Account, Address, InnerTransaction, MetadataType, MosaicId, NamespaceId, PublicAccount, UInt64 } from "symbol-sdk";
import { AggregateUndeadTransaction, NecromancyService, SignedAggregateTx } from "@opensphere-inc/symbol-service";
export declare const isValueOption: (token?: string) => boolean;
export declare let symbolService: SymbolService;
export declare let metalService: MetalService;
export declare let necromancyService: NecromancyService;
export declare const deadlineMinHours = 5;
export declare const deadlineMarginHours = 1;
export interface NodeInput {
    nodeUrl?: string;
}
export declare const initCliEnv: <T extends NodeInput>(input: Readonly<T>, feeRatio: number) => Promise<void>;
export declare const designateCosigners: (signerPubAccount: PublicAccount, sourcePubAccount: PublicAccount, targetPubAccount: PublicAccount, sourceSignerAccount?: Account, targetSignerAccount?: Account, cosignerAccounts?: Account[]) => {
    hasEnoughCosigners: boolean;
    designatedCosignerAccounts: Account[];
};
export declare const announceBatches: (batches: SignedAggregateTx[], signerAccount: Account | PublicAccount, maxParallels: number, showPrompt: boolean) => Promise<void>;
interface ExecuteBatchesResult {
    totalFee: UInt64;
    batches?: SignedAggregateTx[];
    undeadBatches?: AggregateUndeadTransaction[];
}
export declare const buildAndExecuteBatches: (txs: InnerTransaction[], signerAccount: Account, cosignerAccounts: Account[], feeRatio: number, requiredCosignatures: number, maxParallels: number, canAnnounce: boolean, showPrompt: boolean) => Promise<ExecuteBatchesResult>;
export declare const buildAndExecuteUndeadBatches: (txs: InnerTransaction[], signerAccount: Account, cosignerAccounts: Account[], feeRatio: number, requiredCosignatures: number, deadlineHours: number, maxParallels: number, canAnnounce: boolean, showPrompt: boolean) => Promise<ExecuteBatchesResult>;
export declare const doVerify: (payload: Uint8Array, type: MetadataType, sourceAddress: Address, targetAddress: Address, key: UInt64, targetId?: MosaicId | NamespaceId) => Promise<void>;
export {};
//# sourceMappingURL=common.d.ts.map