import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { useBoardName } from "../solution/03-effect.js";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useBoardName", () => {
  it("moves from loading to the resolved name", async () => {
    server.use(
      http.get("http://api.test/name", () => HttpResponse.json({ name: "Sprint 1" })),
    );
    const { result } = renderHook(() => useBoardName("http://api.test/name"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.name).toBe("Sprint 1");
    expect(result.current.error).toBeNull();
  });

  it("reports an error on a non-2xx response", async () => {
    server.use(
      http.get("http://api.test/name", () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = renderHook(() => useBoardName("http://api.test/name"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/500/);
    expect(result.current.name).toBeNull();
  });
});
