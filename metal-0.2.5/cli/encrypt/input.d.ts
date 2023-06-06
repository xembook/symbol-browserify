import { Account, PublicAccount } from "symbol-sdk";
import { NodeInput } from "../common";
import { StreamInput } from "../stream";
export declare namespace EncryptInput {
    interface CommandlineInput extends NodeInput, StreamInput {
        version: string;
        encryptSenderPrivateKey?: string;
        encryptRecipientPublicKey?: string;
        force: boolean;
        outputPath?: string;
        encryptSenderAccount?: Account;
        encryptRecipientPubAccount?: PublicAccount;
    }
    const parseInput: (argv: string[]) => CommandlineInput;
    const validateInput: (_input: Readonly<CommandlineInput>) => Promise<CommandlineInput>;
    const printUsage: () => void;
    const printVersion: () => void;
}
//# sourceMappingURL=input.d.ts.map