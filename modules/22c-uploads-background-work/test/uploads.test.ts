import { describe, expect, it, vi } from "vitest";
import { validateUpload } from "../solution/01-upload-policy.js";
import { createWorker } from "../solution/02-worker.js";

describe("uploads and worker boundaries", () => {
  it("rejects unsafe metadata before a presign step", () => {
    expect(
      validateUpload(
        { name: "large.pdf", mime: "application/pdf", bytes: 11 },
        { allowedMime: ["image/png"], maxBytes: 10 },
      ),
    ).toBe("unsupported MIME type: application/pdf");
  });
  it("is idempotent after a successful delivery", async () => {
    const handler = vi.fn(async () => undefined);
    const worker = createWorker(handler);
    await expect(worker.run({ key: "scan:1", payload: {} })).resolves.toEqual({
      status: "processed",
      attempts: 1,
    });
    await expect(worker.run({ key: "scan:1", payload: {} })).resolves.toEqual({
      status: "duplicate",
      attempts: 1,
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
