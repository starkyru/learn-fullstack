/**
 * A typed client generated from the OpenAPI spec's schemas.
 *
 * The argument/return types (`Card`, `CreateCardBody`, `CardsPage`, …) mirror the `components.schemas`
 * from `03-openapi.ts`, so the client and the server can't disagree at compile time. `createClient`
 * takes an injected `fetchImpl` (an in-memory adapter in tests, `globalThis.fetch` in production) so
 * it never touches the real network here.
 *
 * EXT — this file already mirrors the solution. Extend it (e.g. add `updateCard`/`deleteCard`, or a
 * strongly-typed error union) once the earlier tasks are green.
 */

export type CardStatus = "todo" | "doing" | "done";

export interface Card {
  id: string;
  boardId: string;
  title: string;
  status: CardStatus;
  createdAt: string;
}

export interface CreateCardBody {
  title: string;
  status?: CardStatus;
  createdAt?: string;
}

export interface ListCardsParams {
  limit?: number;
  cursor?: string;
  sort?: string;
  status?: CardStatus;
}

export interface CardsPage {
  data: Card[];
  nextCursor: string | null;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export interface FetchResponse {
  status: number;
  json: () => Promise<unknown>;
}

export type FetchImpl = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponse>;

/** Thrown when the API replies with a `>= 400` problem+json response. */
export class ProblemError extends Error {
  readonly problem: Problem;
  constructor(problem: Problem) {
    super(`${problem.status} ${problem.title}: ${problem.detail}`);
    this.name = "ProblemError";
    this.problem = problem;
  }
}

export interface ApiClient {
  listCards(boardId: string, params?: ListCardsParams): Promise<CardsPage>;
  getCard(boardId: string, cardId: string): Promise<Card>;
  createCard(boardId: string, body: CreateCardBody): Promise<Card>;
}

function buildQuery(params?: ListCardsParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.cursor !== undefined) q.set("cursor", params.cursor);
  if (params.sort !== undefined) q.set("sort", params.sort);
  if (params.status !== undefined) q.set("status", params.status);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function createClient(baseUrl: string, fetchImpl: FetchImpl): ApiClient {
  const base = baseUrl.replace(/\/+$/, "");

  async function parse<T>(res: FetchResponse): Promise<T> {
    const body = await res.json();
    if (res.status >= 400) throw new ProblemError(body as Problem);
    return body as T;
  }

  return {
    async listCards(boardId, params) {
      const res = await fetchImpl(
        `${base}/v1/boards/${encodeURIComponent(boardId)}/cards${buildQuery(params)}`,
        { method: "GET" },
      );
      return parse<CardsPage>(res);
    },
    async getCard(boardId, cardId) {
      const res = await fetchImpl(
        `${base}/v1/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}`,
        { method: "GET" },
      );
      return parse<Card>(res);
    },
    async createCard(boardId, body) {
      const res = await fetchImpl(
        `${base}/v1/boards/${encodeURIComponent(boardId)}/cards`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      return parse<Card>(res);
    },
  };
}
