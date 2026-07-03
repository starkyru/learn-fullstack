import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { uppercaseTransform } from "../solution/02-streams.js";

async function pipeThrough(chunks: (string | Buffer)[]): Promise<string> {
  const out: string[] = [];
  const upper = Readable.from(chunks).pipe(uppercaseTransform());
  for await (const chunk of upper) out.push(chunk.toString());
  return out.join("");
}

describe("uppercaseTransform", () => {
  it("uppercases piped chunks and preserves order", async () => {
    expect(await pipeThrough(["hello ", "world"])).toBe("HELLO WORLD");
  });

  it("handles a multi-byte character split across chunk boundaries", async () => {
    // "é" is 0xC3 0xA9 in UTF-8; split it across two Buffers.
    const out = await pipeThrough([
      Buffer.from([0x63, 0x61, 0x66, 0xc3]),
      Buffer.from([0xa9]),
    ]);
    expect(out).toBe("CAFÉ");
  });
});
