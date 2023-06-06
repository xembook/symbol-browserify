/// <reference types="node" />
export interface StreamInput {
    filePath?: string;
    outputPath?: string;
    stdin?: boolean;
    stdout?: boolean;
}
export declare const validateStreamInput: <T extends StreamInput>(_input: Readonly<T>, showPrompt: boolean) => Promise<T>;
export declare const readStreamInput: <T extends StreamInput>(input: Readonly<T>) => Promise<Uint8Array | Buffer>;
export declare const writeStreamOutput: (payload: Uint8Array, outputPath?: string) => void;
//# sourceMappingURL=stream.d.ts.map