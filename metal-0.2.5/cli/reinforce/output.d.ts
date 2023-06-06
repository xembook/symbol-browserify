import { IntermediateOutput } from "../intermediate";
export declare namespace ReinforceOutput {
    interface CommandlineOutput extends IntermediateOutput {
        status: "reinforced" | "estimated";
        payload: Uint8Array;
    }
    const printOutputSummary: (output: CommandlineOutput) => void;
}
//# sourceMappingURL=output.d.ts.map