import { FastFlip } from "../../sdk/js/dist/index.js";

const ff = new FastFlip();
const list = await ff.markets({ status: "open", limit: 5 });
const id = list.markets.find((m) => m.open)?.id ?? list.markets[0]?.id;
console.log("open count", list.count, "using market", id);
if (id == null) process.exit(0);
const q = await ff.quote({ marketId: id, side: "yes", eth: 0.01 });
console.log("quote cents", q.avgCents, "shares", q.shares);
const prep = await ff.prepareBuy({ marketId: id, side: "yes", eth: 0.01 });
console.log("unsigned", prep.tx);
