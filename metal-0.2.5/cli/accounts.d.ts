import { Account, Address, PublicAccount } from "symbol-sdk";
export interface AccountsInput {
    cosignerPrivateKeys?: string[];
    signerPrivateKey?: string;
    sourcePublicKey?: string;
    sourcePrivateKey?: string;
    targetPublicKey?: string;
    targetPrivateKey?: string;
    cosignerAccounts?: Account[];
    signerAccount?: Account;
    sourcePubAccount?: PublicAccount;
    sourceSignerAccount?: Account;
    targetPubAccount?: PublicAccount;
    targetSignerAccount?: Account;
}
export declare const validateAccountsInput: <T extends AccountsInput>(_input: Readonly<T>, showPrompt?: boolean) => Promise<T>;
export interface AddressesInput {
    sourceAddress?: Address;
    sourcePublicKey?: string;
    targetAddress?: Address;
    targetPublicKey?: string;
    sourcePubAccount?: PublicAccount;
    targetPubAccount?: PublicAccount;
}
export declare const validateAddressesInput: <T extends AddressesInput>(_input: Readonly<T>) => Promise<T>;
//# sourceMappingURL=accounts.d.ts.map