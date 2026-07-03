import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../solution/01-query-cache.js";
import { useQuery } from "../solution/02-use-query.js";

describe("useQuery binding", () => {
  it("moves from pending to success and exposes the data", async () => {
    const client = createQueryClient();
    let resolve!: (value: string) => void;
    const fetcher = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    function Comp() {
      const q = useQuery(client, ["greeting"], fetcher);
      return (
        <span data-testid="s">
          {q.status}:{q.data ?? ""}
        </span>
      );
    }
    render(<Comp />);
    expect(screen.getByTestId("s").textContent).toBe("pending:");

    await act(async () => {
      resolve("hello");
    });
    expect(screen.getByTestId("s").textContent).toBe("success:hello");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("two components sharing a key trigger ONE fetch and both render the data", async () => {
    const client = createQueryClient();
    let resolve!: (value: string) => void;
    const fetcher = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    function Comp() {
      const q = useQuery(client, ["greeting"], fetcher);
      return <span>{q.data ?? "loading"}</span>;
    }
    render(
      <>
        <Comp />
        <Comp />
      </>,
    );
    expect(fetcher).toHaveBeenCalledTimes(1); // deduped across both subscribers

    await act(async () => {
      resolve("hi");
    });
    expect(screen.getAllByText("hi")).toHaveLength(2);
  });

  it("flips isFetching true → false around the request", async () => {
    const client = createQueryClient();
    let resolve!: (value: string) => void;
    const fetcher = () => new Promise<string>((r) => (resolve = r));

    function Comp() {
      const q = useQuery(client, ["k"], fetcher);
      return <span data-testid="f">{String(q.isFetching)}</span>;
    }
    render(<Comp />);
    expect(screen.getByTestId("f").textContent).toBe("true");

    await act(async () => {
      resolve("x");
    });
    expect(screen.getByTestId("f").textContent).toBe("false");
  });

  it("surfaces the error status when the fetcher rejects", async () => {
    const client = createQueryClient();
    let reject!: (reason: unknown) => void;
    const fetcher = () => new Promise<string>((_, r) => (reject = r));

    function Comp() {
      const q = useQuery(client, ["k"], fetcher);
      return (
        <span data-testid="s">
          {q.status}:{q.error instanceof Error ? q.error.message : ""}
        </span>
      );
    }
    render(<Comp />);

    await act(async () => {
      reject(new Error("nope"));
    });
    expect(screen.getByTestId("s").textContent).toBe("error:nope");
  });

  it("unsubscribes from the store on unmount (no listener leak)", async () => {
    const client = createQueryClient();
    let resolve!: (value: string) => void;
    const fetcher = () => new Promise<string>((r) => (resolve = r));

    function Comp() {
      useQuery(client, ["k"], fetcher);
      return <span />;
    }
    const { unmount } = render(<Comp />);
    expect(client.getSubscriberCount(["k"])).toBe(1);

    unmount();
    expect(client.getSubscriberCount(["k"])).toBe(0);

    // A post-unmount resolution must not reach the unmounted component.
    await act(async () => {
      resolve("x");
    });
    expect(client.getSubscriberCount(["k"])).toBe(0);
  });
});
