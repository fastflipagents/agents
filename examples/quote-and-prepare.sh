#!/bin/sh
# Unsigned buy flow. Do not put a private key in this script.
set -e
BASE="${BASE:-https://fastflip.xyz}"
MARKET="${MARKET:-4}"
ETH="${ETH:-0.01}"

echo "== markets =="
curl -sS "$BASE/api/v1/markets?status=open&limit=3"
echo
echo "== quote =="
curl -sS "$BASE/api/v1/quote?marketId=$MARKET&side=yes&eth=$ETH"
echo
echo "== prepare (unsigned) =="
curl -sS -X POST "$BASE/api/v1/prepare" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"buy\",\"marketId\":$MARKET,\"side\":\"yes\",\"eth\":$ETH}"
echo
