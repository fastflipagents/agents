# Market contract review (testnet)

Contract: `0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3`  
Chain: Robinhood Chain Testnet `46630`  
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3

**Source is not verified on the explorer.** There is no `Market.sol` in this repo. This is an ABI + app review, not a formal bytecode audit.

## What the ABI exposes

| Function | App usage |
| --- | --- |
| `buy(marketId, yes)` payable | Website + Agent prepare |
| `sell(marketId, yes, shares)` | Website + Agent prepare |
| `claim(marketId)` | Website + Agent prepare |
| `createMarket(...)` payable | Website wallet only |
| `resolveMarket(marketId, outcome)` | Website wallet only |
| `refund(marketId)` | ABI only — not in Agent API |
| `owner()`, `feeBps()`, `markets`, shares, `yesProbability` | Reads |

Agent `/api/v1/prepare` encodes **buy / sell / claim only**.

## AMM (off-chain preview)

`src/lib/amm.ts` documents the intended on-chain buy:

`net = amt * (1 - feeBps/10000)`  
`shares = net * (y + n + net) / (other + net)`

Yes probability from reserves: `n / (y + n)`.

Without verified source we cannot prove the deployed bytecode matches that math.

## Resolve

The UI only shows Resolve if the connected wallet is **creator or `owner()`** and the market has ended. That is a **frontend** check. If the contract does not enforce the same rule, anyone who calls `resolveMarket` directly can set the outcome. **Cannot pass until source is verified.**

## Claim / refund

`claim` is permissionless in the ABI (the winner’s wallet claims their own shares). That is normal if the contract pays `msg.sender`. `refund` exists on-chain but is not prepared by the Agent API.

## Verdict

**NO PASS** for a formal contract audit. Verify and publish `Market.sol` on the explorer, then re-review `onlyOwner` / creator on `resolveMarket`, fee bounds, and share accounting.
