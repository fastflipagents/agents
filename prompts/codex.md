Work in https://github.com/fastflipagents/agents.

Prefer `npm install fastflip` / `pip install fastflip`. Generate or extend a small client that:

1. Calls GET https://fastflip.xyz/api/v1/markets?status=open
2. Quotes a buy
3. POSTs /api/v1/prepare without any key fields
4. Optionally signs only from process.env.PRIVATE_KEY on the local machine using ethers, then sends to RPC https://rpc.testnet.chain.robinhood.com/rpc chainId 46630

Never put PRIVATE_KEY in source control or in the prepare JSON. Follow AGENTS.md and docs/api.md.
