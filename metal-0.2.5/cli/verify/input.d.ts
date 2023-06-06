import { Address, MetadataType, MosaicId, UInt64 } from "symbol-sdk";
import { NodeInput } from "../common";
import { MetalIdentifyInput } from "../metal_id";
import { StreamInput } from "../stream";
export declare namespace VerifyInput {
    interface CommandlineInput extends NodeInput, MetalIdentifyInput, StreamInput {
        version: string;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (input: Readonly<CommandlineInput>) => Promise<{
        version: string;
        nodeUrl?: string | undefined;
        type: MetadataType;
        key?: UInt64 | undefined;
        metalId?: string | undefined;
        mosaicId?: MosaicId | undefined;
        namespaceId?: import("symbol-sdk").NamespaceId | undefined;
        signerPrivateKey?: string | undefined;
        signerAccount?: import("symbol-sdk").Account | undefined;
        sourceAddress?: Address | undefined;
        sourcePublicKey?: string | undefined;
        targetAddress?: Address | undefined;
        targetPublicKey?: string | undefined;
        sourcePubAccount?: import("symbol-sdk").PublicAccount | undefined;
        targetPubAccount?: import("symbol-sdk").PublicAccount | undefined;
        filePath?: string | undefined;
        outputPath?: string | undefined;
        stdin?: boolean | undefined;
        stdout?: boolean | undefined;
    }>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map