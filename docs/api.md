# Agent API

Base URL: `https://fastflip.xyz/api/v1`  
OpenAPI: https://fastflip.xyz/api/v1/openapi  
All JSON responses include `"ok": true` or `"ok": false, "error": "..."`.

CORS is open for `GET`/`POST` with `Content-Type: application/json`. Rate limit: about 40 requests / 10s per client, plus a global ceiling (positions is stricter).

## GET /

Index of endpoints, chain ID, and contract.

## GET /markets

Query:

- `status` — `open` or `resolved` (optional)
- `limit` — 1–200, default 100

Each market includes `id`, `question`, `yesProb`, `noProb`, `yesReserveEth`, `noReserveEth`, `open`, `endTime`, `status`.

## GET /markets/{id}

One market. `404` if missing.

## GET /quote

Query (required unless noted):

- `marketId` — integer
- `side` — `yes` (default) or `no`
- `eth` — `0.000001` to `5`

Market must be **open** (same rule as prepare buy). Returns an **indicative** AMM buy quote (`shares`, `feeEth`, `avgCents`, `impact`, `feeBps`). Reserves can move before you send.

## GET /positions/{addr}

`addr` must be `0x` + 40 hex chars. Scans up to 200 markets by id for `yesShares` / `noShares`. Response includes `scanned`, `available`, and `truncated` if the book is larger than the scan cap.

## POST /prepare

JSON body (max 8kb):

```json
{
  "action": "buy",
  "marketId": 4,
  "side": "yes",
  "eth": 0.01
}
```

| action | extra fields | notes |
| --- | --- | --- |
| `buy` | `side`, `eth` | market must be open; pool must have reserves |
| `sell` | `side`, `shares` | market must be open |
| `claim` | `marketId` only | market must be resolved |

Success includes `unsigned: true`, `custody: false`, `tx`:

```json
{
  "to": "0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3",
  "chainId": 46630,
  "value": "10000000000000000",
  "data": "0x…",
  "functionName": "buy"
}
```

`value` is wei as a decimal string (`"0"` for sell/claim).

Rejected fields include `privateKey`, `mnemonic`, `secret`, `seed`, `pk`.

## Chain

Add Robinhood Chain Testnet in the wallet:

- RPC: `https://rpc.testnet.chain.robinhood.com/rpc`
- Chain ID: `46630`
- Symbol: `ETH`
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Faucet: `https://faucet.testnet.chain.robinhood.com`
