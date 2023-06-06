"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMetalIdentifyInput = void 0;
const symbol_sdk_1 = require("symbol-sdk");
const accounts_1 = require("./accounts");
const libs_1 = require("../libs");
const common_1 = require("./common");
const validateMetalIdentifyInput = async (_input) => {
    let input = await (0, accounts_1.validateAddressesInput)(_input);
    const { networkType } = await common_1.symbolService.getNetwork();
    if (input.signerPrivateKey) {
        input.signerAccount = symbol_sdk_1.Account.createFromPrivateKey(input.signerPrivateKey, networkType);
        libs_1.Logger.info(`Singer Address is ${input.signerAccount.address.plain()}`);
    }
    if (!input.metalId && !input.signerAccount && !input.sourceAddress) {
        throw new Error("[source_account] must be specified via [--src-pub-key value], " +
            "[--src-addr value] or [--priv-key value]");
    }
    if (!input.metalId && !input.signerAccount && !input.targetAddress) {
        throw new Error("[target_account] must be specified via [--tgt-pub-key value], " +
            "[--tgt-addr value] or [--priv-key value]");
    }
    if (!input.metalId && !input.key) {
        throw new Error("[metadata_key] must be specified via [--key value]");
    }
    return input;
};
exports.validateMetalIdentifyInput = validateMetalIdentifyInput;
//# sourceMappingURL=metal_id.js.map