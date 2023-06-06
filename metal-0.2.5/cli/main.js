#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fetch_1 = require("./fetch");
const forge_1 = require("./forge");
const reinforce_1 = require("./reinforce");
const scrap_1 = require("./scrap");
const verify_1 = require("./verify");
const version_1 = require("./version");
const package_version_1 = require("../package_version");
const libs_1 = require("../libs");
const encrypt_1 = require("./encrypt");
const decrypt_1 = require("./decrypt");
libs_1.Logger.init({ force_stderr: true });
const printUsage = () => {
    libs_1.Logger.info(`Metal CLI version ${version_1.VERSION} (${package_version_1.PACKAGE_VERSION})\n\n` +
        `Usage:        $ metal command [options]\n` +
        `Commands:\n` +
        `  decrypt     Decrypt file with AES-GCM algorithm\n` +
        `  encrypt     Encrypt file with AES-GCM algorithm\n` +
        `  fetch       Fetch on-chain metal and decode into file.\n` +
        `  forge       Upload the metal onto blockchain.\n` +
        `  reinforce   Cosigning forge/scrap intermediate transactions for multisig resolution.\n` +
        `  scrap       Scrap the metal on blockchain.\n` +
        `  verify      Verify off-chain file vs on-chain metal.\n` +
        `Options:\n` +
        `  -h, --help  Show command line usage.\n`);
};
const main = async (argv) => {
    if (!argv.length) {
        printUsage();
        return;
    }
    switch (argv[0]) {
        case "decrypt": {
            return decrypt_1.DecryptCLI.main(argv.slice(1));
        }
        case "encrypt": {
            return encrypt_1.EncryptCLI.main(argv.slice(1));
        }
        case "fetch": {
            return fetch_1.FetchCLI.main(argv.slice(1));
        }
        case "forge": {
            return forge_1.ForgeCLI.main(argv.slice(1));
        }
        case "reinforce": {
            return reinforce_1.ReinforceCLI.main(argv.slice(1));
        }
        case "scrap": {
            return scrap_1.ScrapCLI.main(argv.slice(1));
        }
        case "verify": {
            return verify_1.VerifyCLI.main(argv.slice(1));
        }
        case "-h":
        case "--help": {
            printUsage();
            break;
        }
        default: {
            printUsage();
            libs_1.Logger.error(`Unknown command: ${argv[0]}`);
        }
    }
    return undefined;
};
main(process.argv.slice(2))
    .catch((e) => {
    libs_1.Logger.error(e.toString());
    process.exit(1);
});
//# sourceMappingURL=main.js.map