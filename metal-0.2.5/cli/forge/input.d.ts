import { MetadataType, MosaicId, NamespaceId } from "symbol-sdk";
import { NodeInput } from "../common";
import { AccountsInput } from "../accounts";
import { StreamInput } from "../stream";
export declare namespace ForgeInput {
    interface CommandlineInput extends NodeInput, AccountsInput, StreamInput {
        version: string;
        additive?: string;
        checkCollision: boolean;
        cosignerPrivateKeys?: string[];
        deadlineHours: number;
        estimate: boolean;
        feeRatio: number;
        force: boolean;
        maxParallels: number;
        mosaicId?: MosaicId;
        namespaceId?: NamespaceId;
        outputPath?: string;
        recover: boolean;
        requiredCosignatures?: number;
        type: MetadataType;
        verify: boolean;
        additiveBytes?: Uint8Array;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (_input: Readonly<CommandlineInput>) => Promise<{
        version: string;
        additive?: string | undefined;
        checkCollision: boolean;
        cosignerPrivateKeys?: string[] | undefined;
        deadlineHours: number;
        estimate: boolean;
        feeRatio: number;
        force: boolean;
        maxParallels: number;
        mosaicId?: MosaicId | undefined;
        namespaceId?: NamespaceId | undefined;
        outputPath?: string | undefined;
        recover: boolean;
        requiredCosignatures?: number | undefined;
        type: MetadataType;
        verify: boolean;
        additiveBytes?: Uint8Array | undefined;
        nodeUrl?: string | undefined;
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
        filePath?: string | undefined;
        stdin?: boolean | undefined;
        stdout?: boolean | undefined;
    }>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map