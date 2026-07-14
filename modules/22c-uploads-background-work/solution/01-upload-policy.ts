export type Upload = { name: string; mime: string; bytes: number };
export type UploadPolicy = { allowedMime: readonly string[]; maxBytes: number };

export function validateUpload(upload: Upload, policy: UploadPolicy): string | undefined {
  if (!policy.allowedMime.includes(upload.mime))
    return `unsupported MIME type: ${upload.mime}`;
  if (upload.bytes > policy.maxBytes) return `file exceeds ${policy.maxBytes} bytes`;
  return undefined;
}
