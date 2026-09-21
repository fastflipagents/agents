# fastflip (Python)

SDK for the [FastFlip Agent API](https://fastflip.xyz/api/v1).

```bash
pip install fastflip
```

Python 3.9+, stdlib only. **Never sends a private key.** `prepare_*` returns unsigned calldata. You sign locally.

```python
from fastflip import FastFlip

ff = FastFlip()
listed = ff.markets(status="open", limit=5)
market_id = listed["markets"][0]["id"]
quote = ff.quote(market_id, 0.01, side="yes")
prepared = ff.prepare_buy(market_id, 0.01, side="yes")
print(prepared["tx"])  # to, chainId 46630, value, data, functionName
```

CLI:

```bash
fastflip markets --status open --limit 5
fastflip quote --market 2 --side yes --eth 0.01
fastflip prepare buy --market 2 --side yes --eth 0.01
```

Docs: https://github.com/fastflipagents/agents/blob/main/docs/sdk.md
