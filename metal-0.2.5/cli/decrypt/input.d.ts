import { Account, PublicAccount } from "symbol-sdk";
import { NodeInput } from "../common";
import { StreamInput } from "../stream";
export declare namespace DecryptInput {
    interface CommandlineInput extends NodeInput, StreamInput {
        version: string;
        encryptSenderPublicKey?: string;
        encryptRecipientPrivateKey?: string;
        force: boolean;
        outputPath?: string;
        encryptRecipientAccount?: Account;
        encryptSenderPubAccount?: PublicAccount;
        stdout?: boolean;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (_input: Readonly<CommandlineInput>) => Promise<CommandlineInput>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map