"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("node:path"));
const root = process.cwd();
dotenv.config({ path: path.resolve(root, "./.env") });
require("log-timestamp");
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const util_crypto_1 = require("@polkadot/util-crypto");
// private key for testnet transactions
const secret_key = process.env.SECRET_PHRASE || "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Set up the connection to a local node
        const wsProvider = new api_1.WsProvider("wss://nexus.ibp.network");
        const api = yield api_1.ApiPromise.create({
            provider: wsProvider,
            typesBundle: {
                spec: {
                    gargantua: { hasher: util_crypto_1.keccakAsU8a },
                    nexus: { hasher: util_crypto_1.keccakAsU8a },
                },
            },
        });
        console.log("Api connected");
        // Set up BOB account from keyring
        const keyring = new keyring_1.Keyring({ type: "sr25519" });
        const bob = keyring.addFromUri(secret_key);
        // Implement the Signer interface
        // const signer: Signer = createKeyringPairSigner(bob)
        try {
            let tx = api.tx.system.remarkWithEvent("Hello");
            let signed = yield tx.signAsync(bob, { mode: 0 });
            const txHash = signed.hash.toString();
            const startTime = new Date().getTime();
            const submitPromise = new Promise((resolve, reject) => {
                api.rpc.author
                    .submitAndWatchExtrinsic(signed, (status) => {
                    const spendTime = new Date().getTime() - startTime;
                    console.log(`[TxHash: ${txHash} ,SpendTime: ${spendTime}ms`);
                    if (status) {
                        if (status.isFinalized) {
                            console.log(`[TxHash: ${txHash} ,Finalized : ${spendTime}ms`);
                            resolve(status);
                        }
                        else if (status.isInBlock) {
                            console.log(`[TxHash: ${txHash} ,InBlock : ${spendTime}ms`);
                            resolve(status);
                        }
                    }
                })
                    .catch((error) => {
                    console.error(`[doSubmit] failed TxHash: ${txHash}`, error);
                    reject({ message: error.message });
                });
            });
            yield submitPromise;
        }
        catch (error) {
            console.log(error);
        }
    });
}
let finished = false;
main().then(() => {
    finished = true;
});
let timeout = setInterval(() => {
    if (finished) {
        clearInterval(timeout);
    }
}, 5000);
