/**
 * WORKED EXAMPLE — GET a URL and parse JSON, throwing on a non-2xx status.
 */
export async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * YOUR TURN (analog) — POST `body` as JSON (set the content-type header), throw on non-2xx,
 * and parse+return the JSON response. Mirror httpGet.
 */
export async function httpPost<T>(_url: string, _body: unknown): Promise<T> {
  throw new Error("TODO: POST JSON and parse the response");
}
