# Cursor

Use this repo as project context so Cursor can call FastFlip without inventing APIs.

## Setup

1. Clone https://github.com/fastflipagents/agents
2. Open the folder in Cursor.
3. Keep [`AGENTS.md`](../AGENTS.md) in the root (Cursor-style agents read it).
4. Optional: copy [`.cursor/rules/fastflip-agent.mdc`](../.cursor/rules/fastflip-agent.mdc) into your app repo.

## Starter prompt

Paste [prompts/cursor.md](../prompts/cursor.md) as the first user message.

## What to ask Cursor

- “List open FastFlip markets and quote 0.01 ETH Yes on id 4.”
- “Prepare an unsigned buy; do not sign. Show `tx` JSON.”
- “Write a small Node script using `examples/javascript/client.mjs`.”

## Do not ask Cursor to

- Hold or upload a private key to FastFlip
- Broadcast from a key it generated in chat
- Target mainnet (not live)

## Verify

```bash
curl -s https://fastflip.xyz/api/v1 | python3 -m json.tool
```
