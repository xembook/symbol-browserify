import { IntermediateOutput } from "../intermediate";
export declare namespace ScrapOutput {
    interface CommandlineOutput extends IntermediateOutput {
        status: "scrapped" | "estimated";
    }
    const printOutputSummary: (output: CommandlineOutput) => void;
}
//# sourceMappingURL=output.d.ts.map