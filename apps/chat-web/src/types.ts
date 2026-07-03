import type { User } from "@learn-fullstack/shared";

/**
 * Chat domain types for the M0 slice. `author` reuses the shared `User` contract (the same
 * `@learn-fullstack/shared` source of truth the APIs use) so client and server agree on identity.
 */

/** Who can post — a projection of the shared `User` (id + display name). */
export type Author = Pick<User, "id" | "name">;

/**
 * `pending` = shown optimistically before the server acknowledges it.
 * `sent`    = confirmed by the server (an inbound echo or a fresh message from another user).
 */
export type MessageStatus = "pending" | "sent";

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  text: string;
  status: MessageStatus;
}

/**
 * Narrows an untyped socket payload to a confirmed `Message`. Inbound messages are always `sent`.
 * Returns `null` for anything malformed so the view can ignore junk without throwing.
 */
export function toIncomingMessage(data: unknown): Message | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (
    typeof d.id !== "string" ||
    typeof d.channelId !== "string" ||
    typeof d.authorId !== "string" ||
    typeof d.authorName !== "string" ||
    typeof d.text !== "string"
  ) {
    return null;
  }
  return {
    id: d.id,
    channelId: d.channelId,
    authorId: d.authorId,
    authorName: d.authorName,
    text: d.text,
    status: "sent",
  };
}
