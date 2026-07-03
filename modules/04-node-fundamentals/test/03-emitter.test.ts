import { describe, expect, it } from "vitest";
import { TypedEmitter } from "../solution/03-emitter.js";

type Events = {
  message: { text: string };
  count: number;
};

describe("TypedEmitter", () => {
  it("delivers a typed payload to registered handlers", () => {
    const bus = new TypedEmitter<Events>();
    const seen: string[] = [];
    bus.on("message", (p) => seen.push(p.text));
    const ran = bus.emit("message", { text: "hi" });
    expect(ran).toBe(true);
    expect(seen).toEqual(["hi"]);
  });

  it("returns false when no handler is registered", () => {
    const bus = new TypedEmitter<Events>();
    expect(bus.emit("count", 1)).toBe(false);
  });

  it("does not run a handler registered during the same emit pass", () => {
    const bus = new TypedEmitter<Events>();
    let calls = 0;
    bus.on("count", () => {
      calls++;
      if (calls === 1) bus.on("count", () => calls++); // must not fire this pass
    });
    bus.emit("count", 1);
    expect(calls).toBe(1);
  });
});
