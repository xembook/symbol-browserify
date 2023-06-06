import { Address, MetadataType, MosaicId, NamespaceId, NetworkType, UInt64 } from "symbol-sdk";
export declare namespace FetchOutput {
    interface CommandlineOutput {
        networkType: NetworkType;
        payload: Uint8Array;
        sourceAddress: Address;
        targetAddress: Address;
        key: UInt64 | undefined;
        mosaicId?: MosaicId;
        namespaceId?: NamespaceId;
        metalId: string;
        type: MetadataType;
    }
    const printOutputSummary: (output: CommandlineOutput) => void;
}
//# sourceMappingURL=output.d.ts.map