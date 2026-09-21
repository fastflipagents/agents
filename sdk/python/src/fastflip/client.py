"""FastFlip Agent API client. Never send keys."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

def _env_chain_id() -> int:
    raw = os.environ.get("FASTFLIP_CHAIN_ID")
    try:
        n = int(raw) if raw else 46630
    except ValueError:
        n = 46630
    return n if n > 0 else 46630


def _env_contract() -> str:
    raw = (os.environ.get("FASTFLIP_CONTRACT") or "").strip()
    if raw.startswith("0x") and len(raw) == 42:
        return raw
    return "0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3"


CHAIN_ID = _env_chain_id()
CONTRACT = _env_contract()
DEFAULT_BASE_URL = "https://fastflip.xyz"
TESTNET_RPC = "https://rpc.testnet.chain.robinhood.com/rpc"
EXPLORER = "https://explorer.testnet.chain.robinhood.com"
FAUCET = "https://faucet.testnet.chain.robinhood.com"
OPENAPI = "https://fastflip.xyz/api/v1/openapi"

_SECRET_KEY = re.compile(
    r"^(private[_-]?key|eth[_-]?private[_-]?key|priv[_-]?key|mnemonic|seed(_?phrase)?|secret(_?key)?|wallet[_-]?key|xprv|pk)$",
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


SELECTOR = {"buy": "31c26b11", "sell": "49c0cc14", "claim": "379607f5"}


def eth_to_parseable(amount_eth: float) -> str:
    """Match JS Number#toLocaleString('en-US', { maximumFractionDigits: 18 })."""
    if amount_eth != amount_eth or amount_eth <= 0:
        return "0"
    js = json.dumps(amount_eth)
    if "e" in js.lower():
        return format(amount_eth, ".18f").rstrip("0").rstrip(".") or "0"
    return js


def eth_to_wei(amount_eth: float) -> int:
    s = eth_to_parseable(amount_eth)
    if s == "0":
        return 0
    w, _, f = s.partition(".")
    frac = (f + "0" * 18)[:18]
    return int(w or "0") * 10**18 + int(frac or "0")


def _strip0x(data: str) -> str:
    return data[2:] if data.startswith(("0x", "0X")) else data


def decode_market_call(data: str) -> dict[str, Any]:
    hexdata = _strip0x(data).lower()
    if len(hexdata) < 8 or (len(hexdata) - 8) % 64 != 0:
        raise FastFlipError("unexpected calldata length", 400, {"data": data})
    sel = hexdata[:8]
    words = [int(hexdata[i : i + 64], 16) for i in range(8, len(hexdata), 64)]
    if sel == SELECTOR["buy"] and len(words) == 2:
        if words[1] not in (0, 1):
            raise FastFlipError("unexpected side encoding", 400)
        return {"name": "buy", "marketId": words[0], "side": "yes" if words[1] == 1 else "no"}
    if sel == SELECTOR["sell"] and len(words) == 3:
        if words[1] not in (0, 1):
            raise FastFlipError("unexpected side encoding", 400)
        return {
            "name": "sell",
            "marketId": words[0],
            "side": "yes" if words[1] == 1 else "no",
            "sharesWei": words[2],
        }
    if sel == SELECTOR["claim"] and len(words) == 1:
        return {"name": "claim", "marketId": words[0]}
    raise FastFlipError("calldata is not buy/sell/claim", 400, {"data": data})


def assert_official_tx(tx: dict, chain_id: int | None = None, contract: str | None = None) -> dict:
    """Refuse a prepare tx that is not the official FastFlip market contract."""
    pin_chain = CHAIN_ID if chain_id is None else chain_id
    pin_to = (CONTRACT if contract is None else contract).lower()
    if int(tx.get("chainId") or 0) != pin_chain:
        raise FastFlipError(f"unexpected chainId {tx.get('chainId')}", 400, tx)
    if str(tx.get("to") or "").lower() != pin_to:
        raise FastFlipError("unexpected to — not the FastFlip market contract", 400, tx)
    return tx


def assert_prepare_tx(
    tx: dict,
    action: str,
    market_id: int,
    *,
    side: str | None = None,
    eth: float | None = None,
    shares: float | None = None,
    chain_id: int | None = None,
    contract: str | None = None,
) -> dict:
    assert_official_tx(tx, chain_id=chain_id, contract=contract)
    decoded = decode_market_call(str(tx.get("data") or ""))
    if decoded["name"] != action:
        raise FastFlipError(f"calldata action {decoded['name']} != {action}", 400, tx)
    if int(decoded["marketId"]) != int(market_id):
        raise FastFlipError("calldata marketId mismatch", 400, tx)
    if action != "claim" and decoded.get("side") != (side or "yes"):
        raise FastFlipError("calldata side mismatch", 400, tx)
    try:
        value = int(tx.get("value"))
    except (TypeError, ValueError) as exc:
        raise FastFlipError("invalid tx.value", 400, tx) from exc
    if action == "buy":
        if eth is None:
            raise FastFlipError("buy requires eth", 400, tx)
        if value != eth_to_wei(eth):
            raise FastFlipError("tx.value does not match eth", 400, tx)
    elif value != 0:
        raise FastFlipError("sell/claim value must be 0", 400, tx)
    if action == "sell":
        if shares is None:
            raise FastFlipError("sell requires shares", 400, tx)
        if decoded.get("sharesWei") != eth_to_wei(shares):
            raise FastFlipError("calldata shares mismatch", 400, tx)
    if tx.get("functionName") and tx["functionName"] != action:
        raise FastFlipError("functionName mismatch", 400, tx)
    return tx


def as_wallet_tx(tx: dict, chain_id: int | None = None, contract: str | None = None) -> dict:
    """EIP-1193 / MetaMask fields from an unsigned prepare tx."""
    assert_official_tx(tx, chain_id=chain_id, contract=contract)
    decode_market_call(str(tx.get("data") or ""))
    pin_to = CONTRACT if contract is None else contract
    pin_chain = CHAIN_ID if chain_id is None else chain_id
    return {
        "to": pin_to,
        "data": tx["data"],
        "value": hex(int(tx["value"])),
        "chainId": hex(pin_chain),
    }


class FastFlip:
    def __init__(
        self,
        base_url: str | None = None,
        timeout: float = 20,
        chain_id: int | None = None,
        contract: str | None = None,
    ) -> None:
        origin = base_url or os.environ.get("FASTFLIP_API") or DEFAULT_BASE_URL
        self.base_url = origin.rstrip("/")
        self.timeout = timeout
        self.chain_id = CHAIN_ID if chain_id is None else chain_id
        self.contract = CONTRACT if contract is None else contract

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
        data = self._request("/prepare", method="POST", body=body)
        tx = data.get("tx")
        if not isinstance(tx, dict):
            raise FastFlipError("prepare returned no unsigned tx", 502, data)
        assert_prepare_tx(
            tx,
            action,
            market_id,
            side=side,
            eth=eth,
            shares=shares,
            chain_id=self.chain_id,
            contract=self.contract,
        )
        return data

    def prepare_buy(self, market_id: int, eth: float, side: str = "yes") -> dict[str, Any]:
        return self.prepare("buy", market_id, side=side, eth=eth)

    def prepare_sell(self, market_id: int, shares: float, side: str = "yes") -> dict[str, Any]:
        return self.prepare("sell", market_id, side=side, shares=shares)

    def prepare_claim(self, market_id: int) -> dict[str, Any]:
        return self.prepare("claim", market_id)
