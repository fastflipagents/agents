#!/usr/bin/env node
import { FastFlip } from "./dist/index.js";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function num(name, fallback) {
  const v = arg(name);
  if (v == null) return fallback;
  return Number(v);
}

function dump(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

const cmd = process.argv[2] || "help";
const ff = new FastFlip({ baseUrl: process.env.FASTFLIP_API });

try {
  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    process.stdout.write(`fastflip — Agent API CLI (unsigned only, never sends keys)

  fastflip info
  fastflip markets [--status open|resolved] [--limit 10]
  fastflip market <id>
  fastflip quote --market <id> [--side yes|no] --eth 0.01
  fastflip positions <0xAddress>
  fastflip prepare buy --market <id> [--side yes|no] --eth 0.01
  fastflip prepare sell --market <id> [--side yes|no] --shares 1
  fastflip prepare claim --market <id>

Env: FASTFLIP_API  (default https://fastflip.xyz)
`);
    process.exit(0);
  }

  if (cmd === "info") dump(await ff.info());
  else if (cmd === "markets") dump(await ff.markets({ status: arg("status"), limit: num("limit", 10) }));
  else if (cmd === "market") dump(await ff.market(Number(process.argv[3])));
  else if (cmd === "quote") dump(await ff.quote({ marketId: Number(arg("market")), side: arg("side", "yes"), eth: Number(arg("eth", "0.01")) }));
  else if (cmd === "positions") dump(await ff.positions(process.argv[3] || ""));
  else if (cmd === "prepare") {
    const action = process.argv[3];
    const marketId = Number(arg("market"));
    const side = arg("side", "yes");
    if (action === "buy") dump(await ff.prepareBuy({ marketId, side, eth: Number(arg("eth", "0.01")) }));
    else if (action === "sell") dump(await ff.prepareSell({ marketId, side, shares: Number(arg("shares")) }));
    else if (action === "claim") dump(await ff.prepareClaim(marketId));
    else throw new Error("prepare action must be buy, sell, or claim");
  } else {
    throw new Error(`unknown command: ${cmd}`);
  }
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
