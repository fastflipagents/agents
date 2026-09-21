# fastflip (JavaScript)

Typed SDK for the [FastFlip Agent API](https://fastflip.xyz/api/v1).

```bash
npm install fastflip
```

Node 18+ (`fetch`). Zero runtime dependencies. **Never sends a private key.** `prepare*` returns unsigned calldata. You sign locally.

```js
import { FastFlip } from "fastflip";

const ff = new FastFlip();
const { markets } = await ff.markets({ status: "open", limit: 5 });
const quote = await ff.quote({ marketId: markets[0].id, side: "yes", eth: 0.01 });
const { tx } = await ff.prepareBuy({ marketId: markets[0].id, side: "yes", eth: 0.01 });
console.log(tx); // { to, chainId: 46630, value, data, functionName }
```

CLI (same package):

```bash
npx fastflip markets --status open --limit 5
npx fastflip quote --market 2 --side yes --eth 0.01
npx fastflip prepare buy --market 2 --side yes --eth 0.01
```

MetaMask helper: `asWalletTx(tx)`.

Docs: https://github.com/fastflipagents/agents/blob/main/docs/sdk.md
