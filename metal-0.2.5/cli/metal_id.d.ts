import { Account, MetadataType, MosaicId, NamespaceId, UInt64 } from "symbol-sdk";
import { AddressesInput } from "./accounts";
export interface MetalIdentifyInput extends AddressesInput {
    type: MetadataType;
    key?: UInt64;
    metalId?: string;
    mosaicId?: MosaicId;
    namespaceId?: NamespaceId;
    signerPrivateKey?: string;
    signerAccount?: Account;
}
export declare const validateMetalIdentifyInput: <T extends MetalIdentifyInput>(_input: Readonly<T>) => Promise<T>;
//# sourceMappingURL=metal_id.d.ts.map