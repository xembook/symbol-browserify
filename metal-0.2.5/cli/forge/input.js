"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const common_1 = require("../common");
const version_1 = require("./version");
const accounts_1 = require("../accounts");
const services_1 = require("../../services");
const libs_1 = require("../../libs");
const stream_1 = require("../stream");
const package_version_1 = require("../../package_version");
var ForgeInput;
(function (ForgeInput) {
    ForgeInput.parseInput = (argv) => {
        const input = {
            version: version_1.VERSION,
            estimate: false,
            type: symbol_sdk_1.MetadataType.Account,
            verify: false,
            checkCollision: false,
            maxParallels: 10,
            force: false,
            feeRatio: Number(process.env.FEE_RATIO || 0),
            nodeUrl: process.env.NODE_URL,
            signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
            recover: false,
            deadlineHours: common_1.deadlineMinHours,
        };
        for (let i = 0; i < argv.length; i++) {
            const token = argv[i];
            switch (token) {
                case "--additive": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has additive (4 ascii chars) as a value.`);
                    }
                    input.additive = value;
                    break;
                }
                case "-c":
                case "--check-collision": {
                    input.checkCollision = true;
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
                case "--deadline": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has hours (integer) as a value.`);
                    }
                    input.deadlineHours = Math.floor(Number(value));
                    break;
                }
                case "-e":
                case "--estimate": {
                    input.estimate = true;
                    break;
                }
                case "--fee-ratio": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has fee_ratio (decimal) as a value.`);
                    }
                    input.feeRatio = Number(value);
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
                case "--node-url": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has node_url as a value.`);
                    }
                    input.nodeUrl = value;
                    break;
                }
                case "--num-cosigs": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${value} must has number as a value.`);
                    }
                    input.requiredCosignatures = Math.floor(Number(value));
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
                    input.maxParallels = Math.floor(Number(value));
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
                case "-r":
                case "--recover": {
                    input.recover = true;
                    break;
                }
                case "--src-priv-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has source's private_key as a value.`);
                    }
                    input.sourcePrivateKey = value;
                    break;
                }
                case "-s":
                case "--src-pub-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has source's public_key as a value.`);
                    }
                    input.sourcePublicKey = value;
                    break;
                }
                case "--tgt-priv-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has target's private_key as a value.`);
                    }
                    input.targetPrivateKey = value;
                    break;
                }
                case "-t":
                case "--tgt-pub-key": {
                    const value = argv[++i];
                    if (!(0, common_1.isValueOption)(value)) {
                        throw new Error(`${token} must has target's public_key as a value.`);
                    }
                    input.targetPublicKey = value;
                    break;
                }
                case "-v":
                case "--verify": {
                    input.verify = true;
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
    ForgeInput.validateInput = async (_input) => {
        let input = Object.assign({}, _input);
        if (input.feeRatio && (input.feeRatio > 1.0 || input.feeRatio < 0.0)) {
            throw new Error("[--fee-ratio value] must be 0.0 <= x <= 1.0");
        }
        await (0, common_1.initCliEnv)(input, input.feeRatio);
        input = await (0, stream_1.validateStreamInput)(input, !input.force);
        if (input.additive) {
            if (!input.additive.match(/^[\x21-\x7e\s]{4}$/)) {
                throw new Error("[--additive value] must be 4 ascii chars.");
            }
            input.additiveBytes = symbol_sdk_1.Convert.utf8ToUint8(input.additive);
        }
        if (input.deadlineHours < common_1.deadlineMinHours) {
            throw new Error(`[--deadline hours] must be ${common_1.deadlineMinHours} hours or longer.`);
        }
        if (input.requiredCosignatures !== undefined && input.requiredCosignatures === 0) {
            throw new Error("[--num-cosigs value] must not be zero.");
        }
        return (0, accounts_1.validateAccountsInput)(input, !input.force && !input.stdin);
    };
    ForgeInput.printUsage = () => {
        libs_1.Logger.info(`Usage: forge [options] [input_path]\n` +
            `Options:\n` +
            `  input_path             Specify input_path of payload file (default:stdin)\n` +
            `  --additive value       Specify additive with 4 ascii characters (e.g. "A123", default:0000)\n` +
            `  -c, --check-collision  Check key collision before announce (Also estimation mode allowed)\n` +
            `  --cosigner private_key Specify multisig cosigner's private_key (You can set multiple)\n` +
            `  --deadline hours       Specify intermediate TX deadline in hours (default:5, must be 5 hours or longer)\n` +
            `  -e, --estimate         Enable estimation mode (No TXs announce)\n` +
            `  --fee-ratio value      Specify fee_ratio with decimal (0.0 ~ 1.0, default:0.0)\n` +
            `                         Higher ratio may get fast TX but higher cost\n` +
            `  -f, --force            Do not show any prompts\n` +
            `  -h, --help             Show command line usage\n` +
            `  -m mosaic_id,\n` +
            `  --mosaic value         Specify mosaic_id and demand Mosaic Metal\n` +
            `  -n namespace_name,\n` +
            `  --namespace value      Specify namespace_name and demand Namespace Metal\n` +
            `  --node-url node_url    Specify network node_url\n` +
            `  --num-cosigs value     Specify number of required cosignatures for precise fee estimation\n` +
            `  -o output_path.json,\n` +
            `  --out value            Specify JSON file output_path.json that will contain intermediate TX\n` +
            `  --parallels value      Max TXs for parallel announcing (default:10)\n` +
            `  --priv-key value       Specify signer's private_key\n` +
            `  -r, --recover          Announce only lost chunks for recovery\n` +
            `  -s public_key,\n` +
            `  --src-pub-key value    Specify source_account via public_key\n` +
            `  --src-priv-key value   Specify source_account via private_key\n` +
            `  -t public_key,\n` +
            `  --tgt-pub-key value    Specify target_account via public_key\n` +
            `  --tgt-priv-key value   Specify target_account via private_key\n` +
            `  -v, --verify           Invoke verify after announce (Ignore on estimation mode)\n` +
            `  --verbose              Show verbose logs\n` +
            `  --version              Show command version\n` +
            `Environment Variables:\n` +
            `  FEE_RATIO              Specify fee_ratio with decimal (0.0 ~ 1.0)\n` +
            `  NODE_URL               Specify network node_url\n` +
            `  SIGNER_PRIVATE_KEY     Specify signer's private_key\n`);
    };
    ForgeInput.printVersion = () => {
        libs_1.Logger.info(`Metal Forge CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n`);
    };
})(ForgeInput = exports.ForgeInput || (exports.ForgeInput = {}));
//# sourceMappingURL=input.js.map