"""FastFlip Agent API SDK. Never send keys. prepare() is unsigned calldata only."""

from .client import (
    CHAIN_ID,
    CONTRACT,
    DEFAULT_BASE_URL,
    EXPLORER,
    FAUCET,
    OPENAPI,
    TESTNET_RPC,
    FastFlip,
    FastFlipError,
    as_wallet_tx,
)

__all__ = [
    "CHAIN_ID",
    "CONTRACT",
    "DEFAULT_BASE_URL",
    "EXPLORER",
    "FAUCET",
    "OPENAPI",
    "TESTNET_RPC",
    "FastFlip",
    "FastFlipError",
    "as_wallet_tx",
]
__version__ = "1.0.0"
