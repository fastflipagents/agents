# Security

FastFlip Agent API v1 is **non-custodial**.

- The server encodes `buy` / `sell` / `claim` only. It does not encode `resolveMarket` or `createMarket`.
- Production must set `TRUST_PROXY=1` behind nginx so rate limits are per client. Nginx must overwrite `X-Real-IP` / `X-Forwarded-For` from the socket. Without that, all callers share one bucket.
- Request bodies that include key-like fields are rejected.
- Buy size is capped at 5 ETH per prepare.
- Quotes are not a promise of fill price.
- Testnet ETH is not money. Do not treat faucet funds as a bank.

## For agent authors

- Keep keys in the OS keychain, a hardware wallet, or `PRIVATE_KEY` on the user’s machine.
- Before broadcast, pin `tx.to` and `tx.chainId` to the official contract for that network (testnet default `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3` / `46630`; mainnet via `FASTFLIP_CONTRACT` + `FASTFLIP_CHAIN_ID`). The SDK also decodes `data` and checks `value` against the buy/sell/claim you asked for (`assertPrepareTx`).
- Rate limits are in-memory on one Node process. 429 responses include `Retry-After`. Production must set `TRUST_PROXY=1` and overwrite `X-Real-IP` in nginx (see `deploy/nginx-fastflip.conf` in the app repo).
- Never log keys.
- Never put keys in GitHub Issues, Telegram, or this repo.
- Official links only: [fastflip.xyz](https://fastflip.xyz) and [@fastflip_io](https://x.com/fastflip_io). FastFlip does not DM.

## Phishing

Admins will never ask for a seed phrase. If a site asks you to paste a key into `fastflip.xyz/api/v1/prepare`, it is wrong — the real API rejects that.
