/** FastFlip Agent API client. Never send keys. */
const BASE = process.env.FASTFLIP_API || "https://fastflip.xyz";

async function get(path) {
  const res = await fetch(BASE + path);
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || res.status);
  return data;
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || res.status);
  return data;
}

export async function markets(status = "open", limit = 5) {
  return get(`/api/v1/markets?status=${status}&limit=${limit}`);
}

export async function quote(marketId, side = "yes", eth = 0.01) {
  return get(`/api/v1/quote?marketId=${marketId}&side=${side}&eth=${eth}`);
}

export async function prepareBuy(marketId, side, eth) {
  return post("/api/v1/prepare", { action: "buy", marketId, side, eth });
}

export async function prepareSell(marketId, side, shares) {
  return post("/api/v1/prepare", { action: "sell", marketId, side, shares });
}

import { pathToFileURL } from "node:url";

export async function prepareClaim(marketId) {
  return post("/api/v1/prepare", { action: "claim", marketId });
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const list = await markets();
  const id = list.markets.find((m) => m.open)?.id ?? list.markets[0]?.id;
  console.log("open count", list.count, "using market", id);
  if (id == null) process.exit(0);
  const q = await quote(id, "yes", 0.01);
  console.log("quote cents", q.quote?.avgCents, "shares", q.quote?.shares);
  const prep = await prepareBuy(id, "yes", 0.01);
  console.log("unsigned", prep.tx);
}
