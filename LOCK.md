# Locked snapshot

This tree is the FastFlip agents **testnet lock**. Use the same SDK on mainnet.

Current network (defaults):

- Robinhood Chain **Testnet**
- Chain ID `46630`
- Market `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3`

## When FastFlip goes live

Keep this SDK. Point it at the new contract with env or constructor options only:

```
FASTFLIP_CONTRACT=0x…
FASTFLIP_CHAIN_ID=…
FASTFLIP_API=https://fastflip.xyz
```

```js
new FastFlip({ chainId: …, contract: "0x…" })
```

```python
FastFlip(chain_id=…, contract="0x…")
```

Do not fork the client. Do not add resolve/create encoding. Do not send keys to `/api/v1/prepare`.
