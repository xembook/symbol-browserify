"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecryptInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const version_1 = require("../forge/version");
const common_1 = require("../common");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const prompts_1 = __importDefault(require("prompts"));
const package_version_1 = require("../../package_version");
var DecryptInput;
(function (DecryptInput) {
    DecryptInput.parseInput = (argv) => {
        const input = {
            version: version_1.VERSION,
            force: false,
            nodeUrl: process.env.NODE_URL,
            encryptRecipientPrivateKey: process.env.SIGNER_PRIVATE_KEY,
        };
        for (let i = 0; i < argv.length; i++) {
            const token = argv[i];
            switch (token) {
                case "--priv-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has private_key as a value.`);
                    }
                    input.encryptRecipientPrivateKey = value;
                    break;
                }
                case "--from": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has public_key as a value.`);
                    }
                    input.encryptSenderPublicKey = value;
                    break;
                }
                case "-f":
                case "--force": {
                    input.force = true;
                    break;
                }
                case "-h":
                case "--help": {
                    throw "help";
                }
                case "--node-url": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has node_url as a value.`);
                    }
                    input.nodeUrl = value;
                    break;
                }
                case "-o":
                case "--out": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has output_path as a value.`);
                    }
                    input.outputPath = value;
                    break;
                }
                case "--verbose": {
                    libs_1.Logger.init({ log_level: libs_1.Logger.LogLevel.DEBUG });
                    break;
                }
                case "--version": {
                    throw "version";
                }
                default: {
                    if (token.startsWith("-")) {
                        throw new Error(`Unknown option ${token}`);
                    }
                    // We'll use only first one.
                    if (!input.filePath) {
                        input.filePath = token;
                    }
                    break;
                }
            }
        }
        return input;
    };
    // Initializing CLI environment
    DecryptInput.validateInput = async (_input) => {
        let input = Object.assign({}, _input);
        await (0, common_1.initCliEnv)(input, 0);
        input = await (0, stream_1.validateStreamInput)(input, !input.force);
        if (!input.encryptRecipientPrivateKey && !input.force && !input.stdin) {
            input.encryptRecipientPrivateKey = (await (0, prompts_1.default)({
                type: "password",
                name: "private_key",
                message: "Recipient's Private Key?",
                stdout: process.stderr,
            })).private_key;
        }
        const { networkType } = await common_1.symbolService.getNetwork();
        if (input.encryptRecipientPrivateKey) {
            input.encryptRecipientAccount = symbol_sdk_1.Account.createFromPrivateKey(input.encryptRecipientPrivateKey, networkType);
        }
        else {
            throw new Error("Recipient's private key wasn't specified. [--priv-key value] or SIGNER_PRIVATE_KEY are required.");
        }
        if (input.encryptSenderPublicKey) {
            input.encryptSenderPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.encryptSenderPublicKey, networkType);
        }
        return input;
    };
    DecryptInput.printUsage = () => {
        libs_1.Logger.info(`Usage: decrypt [options] [input_path]\n` +
            `Options:\n` +
            `  input_path             Specify input_path of plain file (default:stdin)\n` +
            `  -f, --force            Do not show any prompts\n` +
            `  --from public_key      Specify encryption sender's public_key (default:recipient)\n` +
            `  -h, --help             Show command line usage\n` +
            `  --node-url node_url    Specify network node_url\n` +
            `  -o output_path,\n` +
            `  --out value            Specify output_path that will be saved encrypted binary (default:stdout)\n` +
            `  --priv-key value       Specify encryption recipient's private_key\n` +
            `  --verbose              Show verbose logs\n` +
            `  --version              Show command version\n` +
            `Environment Variables:\n` +
            `  NODE_URL               Specify network node_url\n` +
            `  SIGNER_PRIVATE_KEY     Specify recipient's private_key\n`);
    };
    DecryptInput.printVersion = () => {
        libs_1.Logger.info(`Metal Decrypt CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n`);
    };
})(DecryptInput = exports.DecryptInput || (exports.DecryptInput = {}));
//# sourceMappingURL=input.js.map