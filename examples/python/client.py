#!/usr/bin/env python3
"""FastFlip Agent API — quote + unsigned prepare. No keys."""
from __future__ import annotations

import json
import os
import urllib.request

BASE = os.environ.get("FASTFLIP_API", "https://fastflip.xyz")


def get(path: str) -> dict:
    with urllib.request.urlopen(BASE + path) as res:
        data = json.loads(res.read().decode())
    if not data.get("ok", True):
        raise SystemExit(data.get("error") or "request failed")
    return data


def post(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
    if not data.get("ok", True):
        raise SystemExit(data.get("error") or "request failed")
    return data


def main() -> None:
    listed = get("/api/v1/markets?status=open&limit=5")
    market = next((m for m in listed["markets"] if m.get("open")), None)
    if not market:
        print("no open markets")
        return
    mid = market["id"]
    print("market", mid, market.get("question"))
    q = get(f"/api/v1/quote?marketId={mid}&side=yes&eth=0.01")
    print("quote", q.get("quote"))
    prep = post(
        "/api/v1/prepare",
        {"action": "buy", "marketId": mid, "side": "yes", "eth": 0.01},
    )
    print("unsigned tx", json.dumps(prep.get("tx"), indent=2))


if __name__ == "__main__":
    main()
