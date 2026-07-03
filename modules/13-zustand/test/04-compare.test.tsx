import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  CounterProvider,
  createReduxCounter,
  createZustandCounter,
  useCounterContext,
} from "../solution/04-compare.js";

describe("redux-like store", () => {
  it("increments, notifies, and stops after unsubscribe", () => {
    const store = createReduxCounter();
    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);

    expect(store.getState().count).toBe(0);
    store.dispatch({ type: "increment" });
    expect(store.getState().count).toBe(1);
    expect(notified).toBe(1);

    unsubscribe();
    store.dispatch({ type: "increment" });
    expect(store.getState().count).toBe(2);
    expect(notified).toBe(1); // no notification after unsubscribe

    store.dispatch({ type: "reset" });
    expect(store.getState().count).toBe(0);
  });
});

describe("zustand store", () => {
  it("increments and resets", () => {
    const store = createZustandCounter();
    store.getState().increment();
    store.getState().increment();
    expect(store.getState().count).toBe(2);
    store.getState().reset();
    expect(store.getState().count).toBe(0);
  });
});

describe("context + useReducer", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CounterProvider>{children}</CounterProvider>
  );

  it("increments via dispatch", () => {
    const { result } = renderHook(() => useCounterContext(), { wrapper });
    expect(result.current.count).toBe(0);
    act(() => result.current.dispatch({ type: "increment" }));
    expect(result.current.count).toBe(1);
  });

  it("throws when used outside a provider", () => {
    expect(() => renderHook(() => useCounterContext())).toThrow(
      /within a CounterProvider/,
    );
  });
});
