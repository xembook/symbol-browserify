"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const version_1 = require("../forge/version");
const common_1 = require("../common");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const prompts_1 = __importDefault(require("prompts"));
const package_version_1 = require("../../package_version");
var EncryptInput;
(function (EncryptInput) {
    EncryptInput.parseInput = (argv) => {
        const input = {
            version: version_1.VERSION,
            force: false,
            nodeUrl: process.env.NODE_URL,
            encryptSenderPrivateKey: process.env.SIGNER_PRIVATE_KEY,
        };
        for (let i = 0; i < argv.length; i++) {
            const token = argv[i];
            switch (token) {
                case "--priv-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has private_key as a value.`);
                    }
                    input.encryptSenderPrivateKey = value;
                    break;
                }
                case "--to": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has public_key as a value.`);
                    }
                    input.encryptRecipientPublicKey = value;
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
    EncryptInput.validateInput = async (_input) => {
        let input = Object.assign({}, _input);
        await (0, common_1.initCliEnv)(input, 0);
        input = await (0, stream_1.validateStreamInput)(input, !input.force);
        if (!input.encryptSenderPrivateKey && !input.force && !input.stdin) {
            input.encryptSenderPrivateKey = (await (0, prompts_1.default)({
                type: "password",
                name: "private_key",
                message: "Sender's Private Key?",
                stdout: process.stderr,
            })).private_key;
        }
        const { networkType } = await common_1.symbolService.getNetwork();
        if (input.encryptSenderPrivateKey) {
            input.encryptSenderAccount = symbol_sdk_1.Account.createFromPrivateKey(input.encryptSenderPrivateKey, networkType);
        }
        else {
            throw new Error("Sender's private key wasn't specified. [--priv-key value] or SIGNER_PRIVATE_KEY are required.");
        }
        if (input.encryptRecipientPublicKey) {
            input.encryptRecipientPubAccount = symbol_sdk_1.PublicAccount.createFromPublicKey(input.encryptRecipientPublicKey, networkType);
        }
        return input;
    };
    EncryptInput.printUsage = () => {
        libs_1.Logger.info(`Usage: encrypt [options] [input_path]\n` +
            `Options:\n` +
            `  input_path             Specify input_path of encrypted file (default:stdin)\n` +
            `  -f, --force            Do not show any prompts\n` +
            `  -h, --help             Show command line usage\n` +
            `  --node-url node_url    Specify network node_url\n` +
            `  -o output_path,\n` +
            `  --out value            Specify output_path that will be saved encrypted binary (default:stdout)\n` +
            `  --priv-key value       Specify encryption sender's private_key\n` +
            `  --to public_key        Specify encryption recipient's public_key (default:sender)\n` +
            `  --verbose              Show verbose logs\n` +
            `  --version              Show command version\n` +
            `Environment Variables:\n` +
            `  NODE_URL               Specify network node_url\n` +
            `  SIGNER_PRIVATE_KEY     Specify sender's private_key\n`);
    };
    EncryptInput.printVersion = () => {
        libs_1.Logger.info(`Metal Encrypt CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n`);
    };
})(EncryptInput = exports.EncryptInput || (exports.EncryptInput = {}));
//# sourceMappingURL=input.js.map