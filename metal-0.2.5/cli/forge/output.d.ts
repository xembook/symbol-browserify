import { IntermediateOutput } from "../intermediate";
export declare namespace ForgeOutput {
    interface CommandlineOutput extends IntermediateOutput {
        status: "forged" | "estimated";
        payload: Uint8Array;
    }
    const printOutputSummary: (output: CommandlineOutput) => void;
}
//# sourceMappingURL=output.d.ts.map