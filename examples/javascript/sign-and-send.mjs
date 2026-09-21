/**
 * Local signer only. Reads PRIVATE_KEY from the environment.
 * Never sends the key to FastFlip.
 *
 *   cd examples/javascript && npm install
 *   PRIVATE_KEY=0x... node sign-and-send.mjs
 */
import { JsonRpcProvider, Wallet } from "ethers";
import { quote, prepareBuy, markets } from "./client.mjs";

const RPC = process.env.RPC_URL || "https://rpc.testnet.chain.robinhood.com/rpc";
const key = process.env.PRIVATE_KEY;
if (!key) {
  console.error("Set PRIVATE_KEY in the environment. Do not put it in the prepare body.");
  process.exit(1);
}

const list = await markets("open", 5);
const market = list.markets.find((m) => m.open);
if (!market) throw new Error("no open market");

await quote(market.id, "yes", 0.01);
const prepared = await prepareBuy(market.id, "yes", 0.01);
const tx = prepared.tx;
if (Number(tx.chainId) !== 46630) throw new Error("unexpected chainId");

const wallet = new Wallet(key, new JsonRpcProvider(RPC));
console.log("signer", wallet.address);
const sent = await wallet.sendTransaction({
  to: tx.to,
  data: tx.data,
  value: BigInt(tx.value),
  chainId: 46630,
});
console.log("tx", sent.hash);
console.log("wait…");
const rec = await sent.wait();
console.log("status", rec.status);
