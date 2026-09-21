"""FastFlip Agent API client. Never send keys."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

CHAIN_ID = 46630
CONTRACT = "0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3"
DEFAULT_BASE_URL = "https://fastflip.xyz"
TESTNET_RPC = "https://rpc.testnet.chain.robinhood.com/rpc"
EXPLORER = "https://explorer.testnet.chain.robinhood.com"
FAUCET = "https://faucet.testnet.chain.robinhood.com"
OPENAPI = "https://fastflip.xyz/api/v1/openapi"

_SECRET_KEY = re.compile(
    r"^(private[_-]?key|mnemonic|seed(_?phrase)?|secret|wallet[_-]?key|pk)$",
    re.I,
)


class FastFlipError(RuntimeError):
    def __init__(self, message: str, status: int = 0, body: Any = None) -> None:
        super().__init__(message)
        self.status = status
        self.body = body


def _has_secrets(value: Any, depth: int = 0) -> bool:
    if depth > 4 or value is None:
        return False
    if isinstance(value, list):
        return any(_has_secrets(v, depth + 1) for v in value)
    if not isinstance(value, dict):
        return False
    for k, v in value.items():
        if _SECRET_KEY.match(str(k)):
            return True
        if _has_secrets(v, depth + 1):
            return True
    return False


def as_wallet_tx(tx: dict) -> dict:
    """EIP-1193 / MetaMask fields from an unsigned prepare tx."""
    return {
        "to": tx["to"],
        "data": tx["data"],
        "value": hex(int(tx["value"])),
        "chainId": hex(int(tx["chainId"])),
    }


class FastFlip:
    def __init__(self, base_url: str | None = None, timeout: float = 20) -> None:
        origin = base_url or os.environ.get("FASTFLIP_API") or DEFAULT_BASE_URL
        self.base_url = origin.rstrip("/")
        self.timeout = timeout
        self.chain_id = CHAIN_ID
        self.contract = CONTRACT

    def _url(self, path: str, query: dict[str, Any] | None = None) -> str:
        url = f"{self.base_url}/api/v1{path}"
        if query:
            q = {k: str(v) for k, v in query.items() if v is not None and v != ""}
            if q:
                url = f"{url}?{urllib.parse.urlencode(q)}"
        return url

    def _request(
        self,
        path: str,
        *,
        method: str = "GET",
        body: dict[str, Any] | None = None,
        query: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            if _has_secrets(body):
                raise FastFlipError("do not send keys or secrets — sign locally", 400)
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self._url(path, query), data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                payload = json.loads(res.read().decode())
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode() if exc.fp else ""
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"error": raw or str(exc)}
            raise FastFlipError(payload.get("error") or str(exc), exc.code, payload) from None
        except urllib.error.URLError as exc:
            raise FastFlipError(str(exc.reason or exc), 0) from None
        if not payload.get("ok", True):
            raise FastFlipError(payload.get("error") or "request failed", 400, payload)
        return payload

    def info(self) -> dict[str, Any]:
        return self._request("")

    def markets(self, status: str | None = None, limit: int | None = None) -> dict[str, Any]:
        return self._request("/markets", query={"status": status, "limit": limit})

    def market(self, market_id: int) -> dict[str, Any]:
        return self._request(f"/markets/{market_id}")["market"]

    def quote(self, market_id: int, eth: float, side: str = "yes") -> dict[str, Any]:
        return self._request("/quote", query={"marketId": market_id, "side": side, "eth": eth})["quote"]

    def positions(self, address: str) -> dict[str, Any]:
        return self._request(f"/positions/{address}")

    def prepare(
        self,
        action: str,
        market_id: int,
        *,
        side: str | None = None,
        eth: float | None = None,
        shares: float | None = None,
        **extra: Any,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"action": action, "marketId": market_id}
        if side is not None:
            body["side"] = side
        if eth is not None:
            body["eth"] = eth
        if shares is not None:
            body["shares"] = shares
        body.update(extra)
        return self._request("/prepare", method="POST", body=body)

    def prepare_buy(self, market_id: int, eth: float, side: str = "yes") -> dict[str, Any]:
        return self.prepare("buy", market_id, side=side, eth=eth)

    def prepare_sell(self, market_id: int, shares: float, side: str = "yes") -> dict[str, Any]:
        return self.prepare("sell", market_id, side=side, shares=shares)

    def prepare_claim(self, market_id: int) -> dict[str, Any]:
        return self.prepare("claim", market_id)
