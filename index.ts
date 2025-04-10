import * as dotenv from "dotenv";
import * as path from "node:path";

const root = process.cwd();
dotenv.config({ path: path.resolve(root, "./.env") });

import "log-timestamp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { keccakAsU8a } from "@polkadot/util-crypto";

// private key for testnet transactions
const secret_key = process.env.SECRET_PHRASE || "";

async function main() {
    // Set up the connection to a local node
    const wsProvider = new WsProvider("wss://nexus.ibp.network");
    const api = await ApiPromise.create({
        provider: wsProvider,
        typesBundle: {
            spec: {
                gargantua: { hasher: keccakAsU8a },
                nexus: { hasher: keccakAsU8a },
            },
        },
    });

    console.log("Api connected");
    // Set up BOB account from keyring
    const keyring = new Keyring({ type: "sr25519" });
    const bob = keyring.addFromUri(secret_key);

    try {
        let tx = api.tx.system.remarkWithEvent("Hello");
        let signed = await tx.signAsync(bob, { mode: 0 });
        const txHash = signed.hash.toString();

        const startTime = new Date().getTime();
        const submitPromise = new Promise((resolve, reject) => {
            api.rpc.author
                .submitAndWatchExtrinsic(signed, (status) => {
                    const spendTime = new Date().getTime() - startTime;
                    console.log(
                        `[TxHash: ${txHash} ,SpendTime: ${spendTime}ms`,
                    );

                    if (status) {
                        if (status.isFinalized) {
                            console.log(
                                `[TxHash: ${txHash} ,Finalized : ${spendTime}ms`,
                            );
                            resolve(status);
                        } else if (status.isInBlock) {
                            console.log(
                                `[TxHash: ${txHash} ,InBlock : ${spendTime}ms`,
                            );
                            resolve(status);
                        }
                    }
                })
                .catch((error) => {
                    console.error(`[doSubmit] failed TxHash: ${txHash}`, error);
                    reject({ message: error.message });
                });
        });

        await submitPromise;
    } catch (error) {
        console.log(error);
    }
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
