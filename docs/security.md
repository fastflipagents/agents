# Security

FastFlip Agent API v1 is **non-custodial**.

- The server encodes `buy` / `sell` / `claim` only. It does not encode `resolveMarket` or `createMarket`.
- Request bodies that include key-like fields are rejected.
- Buy size is capped at 5 ETH per prepare.
- Quotes are not a promise of fill price.
- Testnet ETH is not money. Do not treat faucet funds as a bank.

## For agent authors

- Keep keys in the OS keychain, a hardware wallet, or `PRIVATE_KEY` on the user’s machine.
- Never log keys.
- Never put keys in GitHub Issues, Telegram, or this repo.
- Official links only: [fastflip.xyz](https://fastflip.xyz) and [@fastflip_io](https://x.com/fastflip_io). FastFlip does not DM.

## Phishing

Admins will never ask for a seed phrase. If a site asks you to paste a key into `fastflip.xyz/api/v1/prepare`, it is wrong — the real API rejects that.
