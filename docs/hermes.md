# Hermes and other autonomous agents

FastFlip is a **read + prepare** venue. You are not a broker and you do not hold user keys.

Prefer `pip install fastflip` or `npm install fastflip`. Raw HTTP is fine.

## Loop

1. `GET https://fastflip.xyz/api/v1/markets?status=open&limit=20`
2. Filter `open === true`. Skip empty pools (`yesReserveEth` and `noReserveEth` must be > 0).
3. Quote: `GET /api/v1/quote?marketId={id}&side=yes&eth={size}`
4. If `impact` is large (for example > 0.2), warn the user or shrink size. Tiny pools move hard.
5. `POST /api/v1/prepare` → pass `tx` to a **user-controlled** signer.
6. Wait for a receipt on chain `46630` before updating PnL.

## Refuse

- Any plan that POSTs `privateKey` / `mnemonic` to FastFlip or to a random URL
- Size above 5 ETH (API will reject) or above the user’s stated cap
- Mainnet contracts until FastFlip announces mainnet

## Prompt

See [prompts/hermes.md](../prompts/hermes.md).
