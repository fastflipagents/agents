# FastFlip Agents

Guides and examples for **AI agents** (Cursor, Codex, Hermes, and others) and **human developers**.

FastFlip is a prediction-market product on **Robinhood Chain**. Public **testnet is live**. Mainnet follows after testing. Testnet assets have no cash value.

| | |
| --- | --- |
| Site | [fastflip.xyz](https://fastflip.xyz) |
| Product docs | [fastflip.xyz/developers](https://fastflip.xyz/developers) |
| Agent API | [fastflip.xyz/api/v1](https://fastflip.xyz/api/v1) |
| OpenAPI | [fastflip.xyz/api/v1/openapi](https://fastflip.xyz/api/v1/openapi) |
| X | [@fastflip_io](https://x.com/fastflip_io) |

We never DM. We never ask for keys. The API never accepts a private key.

## Start here

| You are | Read |
| --- | --- |
| Cursor | [docs/cursor.md](docs/cursor.md) · [`AGENTS.md`](AGENTS.md) |
| OpenAI Codex | [docs/codex.md](docs/codex.md) |
| Hermes / other agents | [docs/hermes.md](docs/hermes.md) |
| Human developer | [docs/humans.md](docs/humans.md) |
| Need the HTTP spec | [docs/api.md](docs/api.md) |
| Published SDK | [docs/sdk.md](docs/sdk.md) · `npm i fastflip` · `pip install fastflip` |
| Security / custody | [docs/security.md](docs/security.md) |

## Network

- Robinhood Chain **Testnet**
- Chain ID: `46630`
- Market contract: `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3`

## Agent loop (all tools)

```text
discover  GET /api/v1/markets?status=open
quote     GET /api/v1/quote?marketId=&side=yes&eth=0.01
prepare   POST /api/v1/prepare   → unsigned tx
sign      locally in the wallet  → never POST a key
broadcast to chain 46630
```

## SDK

```bash
npm install https://github.com/fastflipagents/agents/releases/download/v1.0.0/fastflip-1.0.0.tgz
pip install https://github.com/fastflipagents/agents/releases/download/v1.0.0/fastflip-1.0.0-py3-none-any.whl
```

Registry name (npm + PyPI): `fastflip` — `npm install fastflip` / `pip install fastflip` after those accounts are connected.

```js
import { FastFlip } from "fastflip";
const ff = new FastFlip();
const { tx } = await ff.prepareBuy({ marketId: 2, side: "yes", eth: 0.01 });
```

```python
from fastflip import FastFlip
tx = FastFlip().prepare_buy(2, 0.01, side="yes")["tx"]
```

CLI: `npx fastflip markets --status open` · `fastflip quote --market 2 --eth 0.01`

Full guide: [docs/sdk.md](docs/sdk.md)

## Examples

```bash
# unsigned quote + prepare (no key)
./examples/quote-and-prepare.sh

# SDK
node examples/javascript/sdk-demo.mjs
PYTHONPATH=sdk/python/src python3 examples/python/sdk_demo.py

# raw HTTP clients
node examples/javascript/client.mjs
python3 examples/python/client.py
```

Local signing (optional, **your machine only**):

```bash
cd examples/javascript && npm install
PRIVATE_KEY=0xYOUR_LOCAL_KEY node sign-and-send.mjs
```

That script never sends the key to FastFlip.

## License

MIT
