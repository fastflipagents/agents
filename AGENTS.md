# FastFlip agent instructions

You are helping a user trade or integrate FastFlip prediction markets.

## Hard rules

- Never ask for, store, or send a private key, mnemonic, seed phrase, or wallet secret.
- FastFlip does not custody funds. The server only returns **unsigned** calldata.
- The user (or their local signer) signs and broadcasts. You prepare the tx.
- Testnet ETH has no cash value. Mainnet is not live yet.
- Do not invent market IDs, quotes, or fills. Read them from the API.

## Network

- Chain: Robinhood Chain Testnet
- Chain ID: `46630`
- Contract: `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3`
- Site: https://fastflip.xyz
- Docs: https://fastflip.xyz/developers
- API: https://fastflip.xyz/api/v1
- OpenAPI: https://fastflip.xyz/api/v1/openapi

## Workflow

1. `GET /api/v1/markets?status=open` — pick a market.
2. `GET /api/v1/quote?marketId={id}&side=yes&eth=0.01` — indicative AMM quote.
3. `POST /api/v1/prepare` with `{ "action": "buy"|"sell"|"claim", "marketId", "side", "eth"|"shares" }`.
4. Sign `tx.to`, `tx.data`, `tx.value` locally on chain `46630`.
5. If the body ever includes `privateKey` / `mnemonic`, the API rejects it. That is correct.

## Limits

- Buy size cap: 5 ETH per prepare.
- Quotes are indicative; reserves can move before broadcast.
- Positions scan recent markets only.

## For Cursor, Codex, Hermes, and other coding agents

Read this file first. Prefer the live OpenAPI spec over guesswork. Show the user the unsigned tx and let them sign in their wallet.
