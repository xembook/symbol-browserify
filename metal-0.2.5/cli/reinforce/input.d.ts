import { Account } from "symbol-sdk";
import { NodeInput } from "../common";
import { StreamInput } from "../stream";
export declare namespace ReinforceInput {
    interface CommandlineInput extends NodeInput, StreamInput {
        version: string;
        announce: boolean;
        cosignerPrivateKeys?: string[];
        force: boolean;
        intermediatePath?: string;
        maxParallels: number;
        outputPath?: string;
        signerPrivateKey?: string;
        cosignerAccounts?: Account[];
        signerAccount?: Account;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (_input: Readonly<CommandlineInput>) => Promise<CommandlineInput>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map