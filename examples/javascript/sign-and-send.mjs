/**
 * Local signer only. Reads PRIVATE_KEY from the environment.
 * Never sends the key to FastFlip.
 *
 *   cd ../../sdk/js && npm run build
 *   cd ../../examples/javascript && npm install
 *   PRIVATE_KEY=0x... node sign-and-send.mjs
 */
import { JsonRpcProvider, Wallet } from "ethers";
import { FastFlip, CHAIN_ID, CONTRACT } from "../../sdk/js/dist/index.js";

const RPC = process.env.RPC_URL || "https://rpc.testnet.chain.robinhood.com/rpc";
const key = process.env.PRIVATE_KEY;
if (!key) {
  console.error("Set PRIVATE_KEY in the environment. Do not put it in the prepare body.");
  process.exit(1);
}

const ff = new FastFlip();
const list = await ff.markets({ status: "open", limit: 5 });
const market = list.markets.find((m) => m.open);
if (!market) throw new Error("no open market");

await ff.quote({ marketId: market.id, side: "yes", eth: 0.01 });
const prepared = await ff.prepareBuy({ marketId: market.id, side: "yes", eth: 0.01 });
const tx = prepared.tx;

const wallet = new Wallet(key, new JsonRpcProvider(RPC));
console.log("signer", wallet.address);
const sent = await wallet.sendTransaction({
  to: CONTRACT,
  data: tx.data,
  value: BigInt(tx.value),
  chainId: CHAIN_ID,
});
console.log("tx", sent.hash);
console.log("wait…");
const rec = await sent.wait();
console.log("status", rec.status);
