/** FastFlip Agent API client. Never send keys. prepare() is unsigned calldata only. */

function envChainId() {
  const raw = typeof process !== "undefined" ? process.env.FASTFLIP_CHAIN_ID : undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 46630;
}

function envContract() {
  const raw = typeof process !== "undefined" ? process.env.FASTFLIP_CONTRACT : undefined;
  return raw && /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw : "0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3";
}

export const CHAIN_ID = envChainId();
export const CONTRACT = envContract();
export const DEFAULT_BASE_URL = "https://fastflip.xyz";
export const TESTNET_RPC = "https://rpc.testnet.chain.robinhood.com/rpc";
export const EXPLORER = "https://explorer.testnet.chain.robinhood.com";
export const FAUCET = "https://faucet.testnet.chain.robinhood.com";
export const OPENAPI = "https://fastflip.xyz/api/v1/openapi";

export type Side = "yes" | "no";
export type MarketStatusFilter = "open" | "resolved";
export type PrepareAction = "buy" | "sell" | "claim";

export type Market = {
  id: number;
  question: string;
  resolutionSource: string;
  endTime: number;
  status: number;
  outcome: number | null;
  creator: string;
  yesProb: number;
  noProb: number;
  yesReserveEth: number;
  noReserveEth: number;
  open: boolean;
};

export type Quote = {
  marketId: number;
  side: Side;
  action: "buy";
  amountEth: number;
  shares: number;
  feeEth: number;
  netEth: number;
  avgPrice: number;
  avgCents: number;
  maxPayoutEth: number;
  impact: number;
  feeBps: number;
  indicative: boolean;
};

export type UnsignedTx = {
  to: string;
  chainId: number;
  value: string;
  data: string;
  functionName: string;
};

export type Position = {
  marketId: number;
  question: string;
  yesShares: number;
  noShares: number;
};

export type ApiInfo = {
  ok: true;
  name: string;
  version: string;
  custody: boolean;
  chainId: number;
  contract: string;
  docs: string;
  openapi: string;
  endpoints: Record<string, string>;
};

export type PrepareResult = {
  ok: true;
  unsigned: true;
  custody: false;
  warning: string;
  market: Market;
  quote?: Quote;
  tx: UnsignedTx;
};

export type FastFlipOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  chainId?: number;
  contract?: string;
};

export type NetworkPins = { chainId?: number; contract?: string };

const SECRET_KEY =
  /^(private[_-]?key|eth[_-]?private[_-]?key|priv[_-]?key|mnemonic|seed(_?phrase)?|secret(_?key)?|wallet[_-]?key|xprv|pk)$/i;

function hasSecrets(value: unknown, depth = 0): boolean {
  if (depth > 4 || value == null) return false;
  if (Array.isArray(value)) return value.some((v) => hasSecrets(v, depth + 1));
  if (typeof value !== "object") return false;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(k)) return true;
    if (hasSecrets(v, depth + 1)) return true;
  }
  return false;
}

export class FastFlipError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "FastFlipError";
    this.status = status;
    this.body = body;
  }
}

export class FastFlip {
  readonly baseUrl: string;
  readonly chainId: number;
  readonly contract: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: FastFlipOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch || globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.chainId = options.chainId ?? CHAIN_ID;
    this.contract = options.contract ?? CONTRACT;
  }

  private url(path: string, query?: Record<string, string | number | undefined>) {
    const u = new URL(`/api/v1${path}`, this.baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
      }
    }
    return u.toString();
  }

  private async request<T>(path: string, init: RequestInit = {}, query?: Record<string, string | number | undefined>): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(this.url(path, query), { ...init, signal: ctrl.signal });
    } catch (err) {
      throw new FastFlipError(err instanceof Error ? err.message : "request failed", 0);
    } finally {
      clearTimeout(timer);
    }

    let data: { ok?: boolean; error?: string } & Record<string, unknown>;
    try {
      data = (await res.json()) as typeof data;
    } catch {
      throw new FastFlipError(`invalid json (${res.status})`, res.status);
    }
    if (!res.ok || data.ok === false) {
      throw new FastFlipError(data.error || `http ${res.status}`, res.status, data);
    }
    return data as T;
  }

  info() {
    return this.request<ApiInfo>("");
  }

  markets(opts: { status?: MarketStatusFilter; limit?: number } = {}) {
    return this.request<{ ok: true; count: number; markets: Market[] }>(
      "/markets",
      {},
      { status: opts.status, limit: opts.limit },
    );
  }

  async market(id: number) {
    const data = await this.request<{ ok: true; market: Market }>(`/markets/${id}`);
    return data.market;
  }

  async quote(opts: { marketId: number; side?: Side; eth: number }) {
    const data = await this.request<{ ok: true; quote: Quote }>(
      "/quote",
      {},
      { marketId: opts.marketId, side: opts.side ?? "yes", eth: opts.eth },
    );
    return data.quote;
  }

  positions(address: string) {
    return this.request<{ ok: true; address: string; scanned: number; positions: Position[] }>(
      `/positions/${address}`,
    );
  }

  async prepare(body: {
    action: PrepareAction;
    marketId: number;
    side?: Side;
    eth?: number;
    shares?: number;
  }) {
    if (hasSecrets(body)) {
      throw new FastFlipError("do not send keys or secrets — sign locally", 400);
    }
    const data = await this.request<PrepareResult>("/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assertPrepareTx(data.tx, body, { chainId: this.chainId, contract: this.contract });
    return data;
  }

  prepareBuy(opts: { marketId: number; side?: Side; eth: number }) {
    return this.prepare({ action: "buy", marketId: opts.marketId, side: opts.side ?? "yes", eth: opts.eth });
  }

  prepareSell(opts: { marketId: number; side?: Side; shares: number }) {
    return this.prepare({ action: "sell", marketId: opts.marketId, side: opts.side ?? "yes", shares: opts.shares });
  }

  prepareClaim(marketId: number) {
    return this.prepare({ action: "claim", marketId });
  }
}

/** Official Market.sol selectors — buy / sell / claim only. */
export const SELECTOR = {
  buy: "31c26b11",
  sell: "49c0cc14",
  claim: "379607f5",
} as const;

function strip0x(hex: string) {
  return hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
}

/** Same decimal flattening the API uses before parseEther. */
export function ethToParseable(amountEth: number) {
  if (!(amountEth > 0) || !Number.isFinite(amountEth)) return "0";
  return amountEth.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 18,
    minimumFractionDigits: 0,
  });
}

export function ethToWei(amountEth: number): bigint {
  const s = ethToParseable(amountEth);
  if (s === "0") return 0n;
  const [w, f = ""] = s.split(".");
  const frac = `${f}${"0".repeat(18)}`.slice(0, 18);
  return BigInt(w || "0") * 10n ** 18n + BigInt(frac || "0");
}

export function decodeMarketCall(data: string) {
  const hex = strip0x(data).toLowerCase();
  if (hex.length < 8 || (hex.length - 8) % 64 !== 0) {
    throw new FastFlipError("unexpected calldata length", 400, { data });
  }
  const sel = hex.slice(0, 8);
  const words: bigint[] = [];
  for (let i = 8; i < hex.length; i += 64) words.push(BigInt(`0x${hex.slice(i, i + 64)}`));
  if (sel === SELECTOR.buy && words.length === 2) {
    if (words[1] !== 0n && words[1] !== 1n) throw new FastFlipError("unexpected side encoding", 400);
    return { name: "buy" as const, marketId: Number(words[0]), side: words[1] === 1n ? "yes" : "no" };
  }
  if (sel === SELECTOR.sell && words.length === 3) {
    if (words[1] !== 0n && words[1] !== 1n) throw new FastFlipError("unexpected side encoding", 400);
    return {
      name: "sell" as const,
      marketId: Number(words[0]),
      side: words[1] === 1n ? "yes" : "no",
      sharesWei: words[2],
    };
  }
  if (sel === SELECTOR.claim && words.length === 1) {
    return { name: "claim" as const, marketId: Number(words[0]), side: undefined, sharesWei: undefined };
  }
  throw new FastFlipError("calldata is not buy/sell/claim", 400, { data });
}

/** Refuse a prepare tx that is not the official FastFlip market contract. */
export function assertOfficialTx(tx: UnsignedTx, pins: NetworkPins = {}) {
  const chainId = pins.chainId ?? CHAIN_ID;
  const contract = (pins.contract ?? CONTRACT).toLowerCase();
  if (Number(tx.chainId) !== chainId) {
    throw new FastFlipError(`unexpected chainId ${tx.chainId}`, 400, tx);
  }
  if (String(tx.to || "").toLowerCase() !== contract) {
    throw new FastFlipError("unexpected to — not the FastFlip market contract", 400, tx);
  }
}

/** Pin destination and match calldata + value to the request the user made. */
export function assertPrepareTx(
  tx: UnsignedTx,
  req: { action: PrepareAction; marketId: number; side?: Side; eth?: number; shares?: number },
  pins: NetworkPins = {},
) {
  assertOfficialTx(tx, pins);
  const decoded = decodeMarketCall(tx.data);
  if (decoded.name !== req.action) {
    throw new FastFlipError(`calldata action ${decoded.name} != ${req.action}`, 400, tx);
  }
  if (decoded.marketId !== req.marketId) {
    throw new FastFlipError("calldata marketId mismatch", 400, tx);
  }
  if (req.action !== "claim") {
    const side = req.side ?? "yes";
    if (decoded.side !== side) throw new FastFlipError("calldata side mismatch", 400, tx);
  }
  let value: bigint;
  try {
    value = BigInt(tx.value);
  } catch {
    throw new FastFlipError("invalid tx.value", 400, tx);
  }
  if (req.action === "buy") {
    if (req.eth == null) throw new FastFlipError("buy requires eth", 400, tx);
    if (value !== ethToWei(req.eth)) throw new FastFlipError("tx.value does not match eth", 400, tx);
  } else if (value !== 0n) {
    throw new FastFlipError("sell/claim value must be 0", 400, tx);
  }
  if (req.action === "sell") {
    if (req.shares == null) throw new FastFlipError("sell requires shares", 400, tx);
    if (decoded.sharesWei !== ethToWei(req.shares)) throw new FastFlipError("calldata shares mismatch", 400, tx);
  }
  if (tx.functionName && tx.functionName !== req.action) {
    throw new FastFlipError("functionName mismatch", 400, tx);
  }
}

/** EIP-1193 / MetaMask fields from an unsigned prepare tx. */
export function asWalletTx(tx: UnsignedTx, pins: NetworkPins = {}) {
  assertOfficialTx(tx, pins);
  decodeMarketCall(tx.data);
  const contract = pins.contract ?? CONTRACT;
  const chainId = pins.chainId ?? CHAIN_ID;
  return {
    to: contract,
    data: tx.data,
    value: `0x${BigInt(tx.value).toString(16)}` as const,
    chainId: `0x${chainId.toString(16)}` as const,
  };
}

export function createClient(options?: FastFlipOptions) {
  return new FastFlip(options);
}
