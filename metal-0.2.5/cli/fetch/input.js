"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const common_1 = require("../common");
const services_1 = require("../../services");
const version_1 = require("./version");
const metal_id_1 = require("../metal_id");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const package_version_1 = require("../../package_version");
var FetchInput;
(function (FetchInput) {
    FetchInput.parseInput = (argv) => {
        const input = {
            version: version_1.VERSION,
            nodeUrl: process.env.NODE_URL,
            signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
            type: symbol_sdk_1.MetadataType.Account,
            noSave: false,
            force: false,
            stdout: false,
        };
        for (let i = 0; i < argv.length; i++) {
            const token = argv[i];
            switch (token) {
                case "-f":
                case "--force": {
                    input.force = true;
                    break;
                }
                case "-h":
                case "--help": {
                    throw "help";
                }
                case "-k":
                case "--key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has metadata_key (HEX) as a value.`);
                    }
                    input.key = symbol_sdk_1.UInt64.fromHex(value);
                    break;
                }
                case "-m":
                case "--mosaic": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has mosaic_id as a value.`);
                    }
                    if (input.type !== symbol_sdk_1.MetadataType.Account) {
                        throw new Error("You cannot specify --mosaic and --namespace more than once, or both.");
                    }
                    input.type = symbol_sdk_1.MetadataType.Mosaic;
                    input.mosaicId = new symbol_sdk_1.MosaicId(value);
                    break;
                }
                case "-n":
                case "--namespace": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has namespace_name as a value.`);
                    }
                    if (input.type !== symbol_sdk_1.MetadataType.Account) {
                        throw new Error("You cannot specify --mosaic and --namespace more than once, or both.");
                    }
                    input.type = symbol_sdk_1.MetadataType.Namespace;
                    input.namespaceId = services_1.SymbolService.createNamespaceId(value);
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
                case "--node-url": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has node_url as a value.`);
                    }
                    input.nodeUrl = value;
                    break;
                }
                case "--no-save": {
                    input.noSave = true;
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
                case "--stdout": {
                    input.stdout = true;
                    break;
                }
                case "-s":
                case "--src-pub-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has public_key as a value.`);
                    }
                    input.sourcePublicKey = value;
                    break;
                }
                case "--src-addr": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has address as a value.`);
                    }
                    input.sourceAddress = symbol_sdk_1.Address.createFromRawAddress(value);
                    break;
                }
                case "-t":
                case "--tgt-pub-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has public_key as a value.`);
                    }
                    input.targetPublicKey = value;
                    break;
                }
                case "--tgt-addr": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has address as a value.`);
                    }
                    input.targetAddress = symbol_sdk_1.Address.createFromRawAddress(value);
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
                    if (!input.metalId) {
                        input.metalId = token;
                    }
                    break;
                }
            }
        }
        return input;
    };
    // Initializing CLI environment
    FetchInput.validateInput = async (input) => {
        // We'll not announce any TXs this command.
        await (0, common_1.initCliEnv)(input, 0);
        return (0, metal_id_1.validateMetalIdentifyInput)(await (0, stream_1.validateStreamInput)(input, !input.force));
    };
    FetchInput.printUsage = () => {
        libs_1.Logger.info(`Usages:\n` +
            `  With Metal ID          $ fetch [options] metal_id\n` +
            `  Account Metal          $ fetch [options] -k metadata_key\n` +
            `  Mosaic Metal           $ fetch [options] -m mosaic_id -k metadata_key\n` +
            `  Namespace Metal        $ fetch [options] -n namespace_name -k metadata_key\n` +
            `Options:\n` +
            `  -f, --force            Do not show any prompts\n` +
            `  -h, --help             Show command line usage\n` +
            `  -k metadata_key,\n` +
            `  --key value            Specify metadata_key\n` +
            `  -m mosaic_id,\n` +
            `  --mosaic value         Specify mosaic_id and demand Mosaic Metal\n` +
            `  -n namespace_name,\n` +
            `  --namespace value      Specify namespace_name and demand Namespace Metal\n` +
            `  --node-url node_url    Specify network node_url\n` +
            `  --no-save              Don't save any files (Only show summary)\n` +
            `  -o output_path,\n` +
            `  --out value            Specify output_path (default:stdout)\n` +
            `  --priv-key value       Specify signer's private_key\n` +
            `  -s public_key,\n` +
            `  --src-pub-key value    Specify source_account via public_key (default:signer)\n` +
            `  --src-addr value       Specify source_account via address (default:signer)\n` +
            `  -t public_key,\n` +
            `  --tgt-pub-key value    Specify target_account via public_key (default:signer)\n` +
            `  --tgt-addr value       Specify target_account via address (default:signer)\n` +
            `  --verbose              Show verbose logs\n` +
            `  --version              Show command version\n` +
            `Environment Variables:\n` +
            `  NODE_URL               Specify network node_url\n` +
            `  SIGNER_PRIVATE_KEY     Specify signer's private_key\n`);
    };
    FetchInput.printVersion = () => {
        libs_1.Logger.info(`Metal Fetch CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n`);
    };
})(FetchInput = exports.FetchInput || (exports.FetchInput = {}));
//# sourceMappingURL=input.js.map