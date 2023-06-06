"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReinforceInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const fs_1 = __importDefault(require("fs"));
const common_1 = require("../common");
const version_1 = require("./version");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const prompts_1 = __importDefault(require("prompts"));
const package_version_1 = require("../../package_version");
var ReinforceInput;
(function (ReinforceInput) {
    ReinforceInput.parseInput = (argv) => {
        const input = {
            version: version_1.VERSION,
            maxParallels: 10,
            force: false,
            nodeUrl: process.env.NODE_URL,
            signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
            announce: false,
        };
        for (let i = 0; i < argv.length; i++) {
            const token = argv[i];
            switch (token) {
                case "-a":
                case "--announce": {
                    input.announce = true;
                    break;
                }
                case "--cosigner": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has cosigner's private_key as a value.`);
                    }
                    input.cosignerPrivateKeys = [...(input.cosignerPrivateKeys || []), value];
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
                case "--parallels": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has number as a value.`);
                    }
                    input.maxParallels = Number(value);
                    break;
                }
                case "--priv-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has signer's private_key as a value.`);
                    }
                    input.signerPrivateKey = value;
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
                    if (!input.intermediatePath) {
                        input.intermediatePath = token;
                    }
                    else if (!input.filePath) {
                        input.filePath = token;
                    }
                    break;
                }
            }
        }
        return input;
    };
    // Initializing CLI environment
    ReinforceInput.validateInput = async (_input) => {
        var _a;
        let input = Object.assign({}, _input);
        await (0, common_1.initCliEnv)(input, 0);
        input = await (0, stream_1.validateStreamInput)(input, !input.force);
        if (!input.intermediatePath) {
            throw new Error("[intermediate_txs.json] wasn't specified.");
        }
        if (!fs_1.default.existsSync(input.intermediatePath)) {
            throw new Error(`${input.intermediatePath}: File not found.`);
        }
        const { networkType } = await common_1.symbolService.getNetwork();
        if (!input.signerPrivateKey && !input.force && !input.stdin) {
            input.signerPrivateKey = (await (0, prompts_1.default)({
                type: "password",
                name: "private_key",
                message: "Cosigner's Private Key [enter:skip]?",
                stdout: process.stderr,
            })).private_key;
        }
        if (input.signerPrivateKey) {
            input.signerAccount = symbol_sdk_1.Account.createFromPrivateKey(input.signerPrivateKey, networkType);
            libs_1.Logger.info(`Signer Address is ${input.signerAccount.address.plain()}`);
        }
        input.cosignerAccounts = (_a = input.cosignerPrivateKeys) === null || _a === void 0 ? void 0 : _a.map((privateKey) => {
            const cosigner = symbol_sdk_1.Account.createFromPrivateKey(privateKey, networkType);
            libs_1.Logger.info(`Additional Cosigner Address is ${cosigner.address.plain()}`);
            return cosigner;
        });
        return input;
    };
    ReinforceInput.printUsage = () => {
        libs_1.Logger.info(`Usage: reinforce [options] intermediate_txs.json input_path\n` +
            `Options:\n` +
            `  -a, --announce         Announce completely signed TXs\n` +
            `  --cosigner private_key Specify multisig cosigner's private_key (You can set multiple)\n` +
            `  -f, --force            Do not show any prompts\n` +
            `  -h, --help             Show command line usage\n` +
            `  --node-url node_url    Specify network node_url\n` +
            `  -o output_path.json,\n` +
            `  --out value            Specify JSON file output_path.json that will contain serialized TXs\n` +
            `  --parallels value      Max TXs for parallel announcing (default:10)\n` +
            `  --priv-key value       Specify cosigner's private_key (Same as single of [--cosigner])\n` +
            `  --verbose              Show verbose logs\n` +
            `  --version              Show command version\n` +
            `Environment Variables:\n` +
            `  NODE_URL               Specify network node_url\n` +
            `  SIGNER_PRIVATE_KEY     Specify signer's private_key\n`);
    };
    ReinforceInput.printVersion = () => {
        libs_1.Logger.info(`Metal Reinforce CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n`);
    };
})(ReinforceInput = exports.ReinforceInput || (exports.ReinforceInput = {}));
//# sourceMappingURL=input.js.map