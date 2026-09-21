# OpenAI Codex

Point Codex at this repository and the live OpenAPI document.

## Setup

1. Clone this repo into the Codex workspace (or attach `AGENTS.md` + `docs/api.md`).
2. Allow network: `https://fastflip.xyz` and Robinhood testnet RPC if you will broadcast locally.
3. Starter prompt: [prompts/codex.md](../prompts/codex.md)

## Tasks Codex is good at

- Generating a typed client from https://fastflip.xyz/api/v1/openapi
- Wiring `prepare` → local `ethers` signer (key stays in `PRIVATE_KEY` env)
- Adding tests that mock `prepare` and assert no key in the JSON body

## Guardrail

Any generated `fetch` to `/api/v1/prepare` must stringify only `action`, `marketId`, `side`, `eth`, and/or `shares`.
