export type Upload = { name: string; mime: string; bytes: number };
export type UploadPolicy = { allowedMime: readonly string[]; maxBytes: number };

/** Return an actionable validation error, or `undefined` when an upload may be presigned. */
export function validateUpload(
  _upload: Upload,
  _policy: UploadPolicy,
): string | undefined {
  throw new Error("TODO: enforce the MIME allowlist and maximum bytes before presigning");
}
