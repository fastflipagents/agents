#!/usr/bin/env python3
"""SDK demo: quote + unsigned prepare. No keys."""
from fastflip import FastFlip

ff = FastFlip()
listed = ff.markets(status="open", limit=5)
market = next((m for m in listed["markets"] if m.get("open")), None)
if not market:
    print("no open markets")
    raise SystemExit(0)
mid = market["id"]
print("market", mid, market.get("question"))
print("quote", ff.quote(mid, 0.01, side="yes"))
print("unsigned tx", ff.prepare_buy(mid, 0.01, side="yes")["tx"])
