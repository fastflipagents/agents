# SDKs

Published packages wrap the live Agent API. Same rules as HTTP: **unsigned prepare only, never send keys.**

| Registry | Package | Install |
| --- | --- | --- |
| npm | [`fastflip`](https://www.npmjs.com/package/fastflip) | `npm install fastflip` |
| PyPI | [`fastflip`](https://pypi.org/project/fastflip/) | `pip install fastflip` |

Source in this repo: [`sdk/js`](../sdk/js) · [`sdk/python`](../sdk/python).

Requires Node 18+ or Python 3.9+. Default base URL is `https://fastflip.xyz`. Override with `new FastFlip({ baseUrl })`, `FastFlip(base_url=...)`, or `FASTFLIP_API`.

## JavaScript

```js
import { FastFlip, asWalletTx } from "fastflip";

const ff = new FastFlip();
const { markets } = await ff.markets({ status: "open" });
const id = markets[0].id;
await ff.quote({ marketId: id, side: "yes", eth: 0.01 });
const prepared = await ff.prepareBuy({ marketId: id, side: "yes", eth: 0.01 });
// sign in the wallet — do not POST prepared.tx to FastFlip with a key
const walletTx = asWalletTx(prepared.tx);
```

CLI:

```bash
npx fastflip info
npx fastflip markets --status open --limit 5
npx fastflip quote --market 2 --eth 0.01
npx fastflip prepare buy --market 2 --eth 0.01
```

## Python

```python
from fastflip import FastFlip, as_wallet_tx

ff = FastFlip()
listed = ff.markets(status="open")
mid = listed["markets"][0]["id"]
ff.quote(mid, 0.01, side="yes")
prepared = ff.prepare_buy(mid, 0.01, side="yes")
wallet_tx = as_wallet_tx(prepared["tx"])
```

CLI:

```bash
fastflip info
fastflip markets --status open
fastflip prepare buy --market 2 --eth 0.01
```

## What the SDK will not do

- Accept, log, or POST a private key, mnemonic, or seed
- Broadcast a transaction (you sign with MetaMask, ethers, web3.py, etc.)
- Create or resolve markets (the API cannot either)

## Network constants

Exported from both packages:

- Chain ID `46630`
- Contract `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3`
- RPC `https://rpc.testnet.chain.robinhood.com/rpc`

## From this repo (unpublished / local)

```bash
npm install ./sdk/js
pip install ./sdk/python
```
