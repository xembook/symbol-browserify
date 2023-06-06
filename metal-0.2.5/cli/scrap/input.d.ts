import { MetadataType, MosaicId, NamespaceId, UInt64 } from "symbol-sdk";
import { NodeInput } from "../common";
import { AccountsInput } from "../accounts";
export declare namespace ScrapInput {
    interface CommandlineInput extends NodeInput, AccountsInput {
        version: string;
        additive?: string;
        deadlineHours: number;
        estimate: boolean;
        feeRatio: number;
        filePath?: string;
        force: boolean;
        key?: UInt64;
        maxParallels: number;
        metalId?: string;
        mosaicId?: MosaicId;
        namespaceId?: NamespaceId;
        outputPath?: string;
        requiredCosignatures?: number;
        type?: MetadataType;
        additiveBytes?: Uint8Array;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (_input: Readonly<CommandlineInput>) => Promise<{
        version: string;
        additive?: string | undefined;
        deadlineHours: number;
        estimate: boolean;
        feeRatio: number;
        filePath?: string | undefined;
        force: boolean;
        key?: UInt64 | undefined;
        maxParallels: number;
        metalId?: string | undefined;
        mosaicId?: MosaicId | undefined;
        namespaceId?: NamespaceId | undefined;
        outputPath?: string | undefined;
        requiredCosignatures?: number | undefined;
        type?: MetadataType | undefined;
        additiveBytes?: Uint8Array | undefined;
        nodeUrl?: string | undefined;
        cosignerPrivateKeys?: string[] | undefined;
        signerPrivateKey?: string | undefined;
        sourcePublicKey?: string | undefined;
        sourcePrivateKey?: string | undefined;
        targetPublicKey?: string | undefined;
        targetPrivateKey?: string | undefined;
        cosignerAccounts?: import("symbol-sdk").Account[] | undefined;
        signerAccount?: import("symbol-sdk").Account | undefined;
        sourcePubAccount?: import("symbol-sdk").PublicAccount | undefined;
        sourceSignerAccount?: import("symbol-sdk").Account | undefined;
        targetPubAccount?: import("symbol-sdk").PublicAccount | undefined;
        targetSignerAccount?: import("symbol-sdk").Account | undefined;
    }>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map