/** FastFlip Agent API client. Never send keys. prepare() is unsigned calldata only. */

export const CHAIN_ID = 46630;
export const CONTRACT = "0x715Ba9216Bf7Ea0BbE2c60643B3273E190457ff3";
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
};

const SECRET_KEY = /^(private[_-]?key|mnemonic|seed(_?phrase)?|secret|wallet[_-]?key|pk)$/i;

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
  readonly chainId = CHAIN_ID;
  readonly contract = CONTRACT;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: FastFlipOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch || globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 20_000;
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

  prepare(body: {
    action: PrepareAction;
    marketId: number;
    side?: Side;
    eth?: number;
    shares?: number;
  }) {
    if (hasSecrets(body)) {
      throw new FastFlipError("do not send keys or secrets — sign locally", 400);
    }
    return this.request<PrepareResult>("/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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

/** EIP-1193 / MetaMask fields from an unsigned prepare tx. */
export function asWalletTx(tx: UnsignedTx) {
  return {
    to: tx.to,
    data: tx.data,
    value: `0x${BigInt(tx.value).toString(16)}` as const,
    chainId: `0x${tx.chainId.toString(16)}` as const,
  };
}

export function createClient(options?: FastFlipOptions) {
  return new FastFlip(options);
}
