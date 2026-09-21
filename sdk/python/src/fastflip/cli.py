"""fastflip CLI — unsigned Agent API only. Never sends keys."""

from __future__ import annotations

import argparse
import json
import sys

from .client import FastFlip, FastFlipError


def _dump(data: object) -> None:
    json.dump(data, sys.stdout, indent=2)
    sys.stdout.write("\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="fastflip",
        description="FastFlip Agent API CLI. prepare is unsigned. Never pass a private key.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("info")

    p_markets = sub.add_parser("markets")
    p_markets.add_argument("--status", choices=["open", "resolved"])
    p_markets.add_argument("--limit", type=int, default=10)

    p_market = sub.add_parser("market")
    p_market.add_argument("id", type=int)

    p_quote = sub.add_parser("quote")
    p_quote.add_argument("--market", type=int, required=True)
    p_quote.add_argument("--side", choices=["yes", "no"], default="yes")
    p_quote.add_argument("--eth", type=float, default=0.01)

    p_pos = sub.add_parser("positions")
    p_pos.add_argument("address")

    p_prep = sub.add_parser("prepare")
    p_prep.add_argument("action", choices=["buy", "sell", "claim"])
    p_prep.add_argument("--market", type=int, required=True)
    p_prep.add_argument("--side", choices=["yes", "no"], default="yes")
    p_prep.add_argument("--eth", type=float, default=0.01)
    p_prep.add_argument("--shares", type=float)

    args = parser.parse_args(argv)
    ff = FastFlip()
    try:
        if args.cmd == "info":
            _dump(ff.info())
        elif args.cmd == "markets":
            _dump(ff.markets(status=args.status, limit=args.limit))
        elif args.cmd == "market":
            _dump(ff.market(args.id))
        elif args.cmd == "quote":
            _dump(ff.quote(args.market, args.eth, args.side))
        elif args.cmd == "positions":
            _dump(ff.positions(args.address))
        elif args.cmd == "prepare":
            if args.action == "buy":
                _dump(ff.prepare_buy(args.market, args.eth, args.side))
            elif args.action == "sell":
                if args.shares is None:
                    parser.error("prepare sell requires --shares")
                _dump(ff.prepare_sell(args.market, args.shares, args.side))
            else:
                _dump(ff.prepare_claim(args.market))
    except FastFlipError as exc:
        sys.stderr.write(f"{exc}\n")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
