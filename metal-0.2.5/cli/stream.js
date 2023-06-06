"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeStreamOutput = exports.readStreamInput = exports.validateStreamInput = void 0;
const assert_1 = __importDefault(require("assert"));
const libs_1 = require("../libs");
const fs_1 = __importDefault(require("fs"));
const prompts_1 = __importDefault(require("prompts"));
const validateStreamInput = async (_input, showPrompt) => {
    let input = Object.assign({}, _input);
    if (input.filePath && !fs_1.default.existsSync(input.filePath)) {
        throw new Error(`${input.filePath}: File not found.`);
    }
    input.stdin = !input.filePath;
    if (input.outputPath && fs_1.default.existsSync(input.outputPath)) {
        const confirmPrompt = async () => (await (0, prompts_1.default)({
            type: "confirm",
            name: "decision",
            message: `${input.outputPath}: Are you sure overwrite this?`,
            initial: false,
            stdout: process.stderr,
        })).decision;
        if (input.stdin) {
            throw new Error(`${input.outputPath}: Already exists.`);
        }
        else if (showPrompt && !await confirmPrompt()) {
            throw new Error(`Canceled by user.`);
        }
    }
    input.stdout = !input.outputPath;
    return input;
};
exports.validateStreamInput = validateStreamInput;
const readStreamInput = async (input) => {
    (0, assert_1.default)(input.filePath || input.stdin);
    if (input.filePath) {
        libs_1.Logger.debug(`${input.filePath}: Reading...`);
        const payload = fs_1.default.readFileSync(input.filePath);
        if (!payload.length) {
            throw new Error(`${input.filePath}: The file is empty.`);
        }
        return payload;
    }
    else {
        libs_1.Logger.debug(`stdin: Reading...`);
        const payload = await new Promise((resolve) => {
            const chunks = new Array();
            process.stdin.resume();
            process.stdin.on("data", (chunk) => chunks.push(chunk));
            process.stdin.on("end", () => {
                const concat = new Uint8Array(chunks.reduce((acc, curr) => acc + curr.length, 0));
                const getChunk = () => chunks.splice(0, 1).shift();
                for (let chunk = getChunk(), pos = 0; chunk; pos += chunk.length, chunk = getChunk()) {
                    concat.set(chunk, pos);
                }
                resolve(concat);
            });
        });
        if (!payload.length) {
            throw new Error(`stdin: The input is empty.`);
        }
        return payload;
    }
};
exports.readStreamInput = readStreamInput;
const writeStreamOutput = (payload, outputPath) => {
    if (outputPath) {
        fs_1.default.writeFileSync(outputPath, payload);
    }
    else {
        process.stdout.write(payload);
    }
};
exports.writeStreamOutput = writeStreamOutput;
//# sourceMappingURL=stream.js.map