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

function requireMarket() {
  const id = Number(arg("market") ?? process.argv[3]);
  if (!Number.isInteger(id) || id < 0) throw new Error("--market <id> required");
  return id;
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
  else if (cmd === "quote") {
    const marketId = requireMarket();
    const eth = num("eth", 0.01);
    if (!Number.isFinite(eth)) throw new Error("--eth must be a number");
    dump(await ff.quote({ marketId, side: arg("side", "yes"), eth }));
  } else if (cmd === "positions") {
    const addr = process.argv[3] || "";
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) throw new Error("positions requires a 0x address");
    dump(await ff.positions(addr));
  } else if (cmd === "prepare") {
    const action = process.argv[3];
    const marketId = Number(arg("market"));
    if (!Number.isInteger(marketId) || marketId < 0) throw new Error("--market <id> required");
    const side = arg("side", "yes");
    if (action === "buy") {
      const eth = num("eth", 0.01);
      if (!Number.isFinite(eth)) throw new Error("--eth must be a number");
      dump(await ff.prepareBuy({ marketId, side, eth }));
    } else if (action === "sell") {
      const shares = Number(arg("shares"));
      if (!Number.isFinite(shares) || shares <= 0) throw new Error("prepare sell requires --shares");
      dump(await ff.prepareSell({ marketId, side, shares }));
    } else if (action === "claim") dump(await ff.prepareClaim(marketId));
    else throw new Error("prepare action must be buy, sell, or claim");
  } else {
    throw new Error(`unknown command: ${cmd}`);
  }
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
