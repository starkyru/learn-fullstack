import { useEffect } from "react";
import {
  composerChanged,
  messageReceived,
  messageSent,
  selectChannelId,
  selectComposerText,
  selectVisibleMessages,
  type ChatStore,
} from "./chatSlice.js";
import { useSocket, type SocketStore } from "./socket-store.js";
import { toIncomingMessage, type Author, type Message } from "./types.js";
import { useChatState } from "./useChatState.js";
import styles from "./ChatView.module.css";

export interface ChatViewProps {
  store: ChatStore;
  socket: SocketStore;
  /** Who the local user posts as. */
  currentUser: Author;
  /** Deterministic id source for optimistic sends (injected so tests avoid Math.random/Date.now). */
  nextId: () => string;
}

/**
 * The M0 Chat slice: renders the selected channel's messages + a composer. Inbound socket messages
 * flow through the Redux `messageReceived` reducer; sending appends optimistically and emits over
 * the socket. State is read via `useChatState` (useSyncExternalStore over the Redux store).
 */
export function ChatView({ store, socket, currentUser, nextId }: ChatViewProps) {
  const channelId = useChatState(store, selectChannelId);
  const composerText = useChatState(store, selectComposerText);
  const messages = useChatState(store, selectVisibleMessages);
  const { status, lastMessage } = useSocket(socket);

  // Feed inbound socket payloads into the store. `messageReceived` dedupes by id, so re-running on
  // an echo of an optimistic message just flips it to `sent`.
  useEffect(() => {
    const incoming = toIncomingMessage(lastMessage);
    if (incoming) store.dispatch(messageReceived(incoming));
  }, [lastMessage, store]);

  function handleSend(): void {
    const text = composerText.trim();
    if (!text) return;
    const message: Message = {
      id: nextId(),
      channelId,
      authorId: currentUser.id,
      authorName: currentUser.name ?? currentUser.id,
      text,
      status: "pending",
    };
    store.dispatch(messageSent(message)); // optimistic: appears before the server acknowledges
    socket.send("message", message);
  }

  return (
    <section className={styles.view} aria-label="Chat">
      <header className={styles.header}>
        <span className={styles.channel}>#{channelId}</span>
        <span className={styles.status} data-testid="status">
          {status}
        </span>
      </header>

      <ul className={styles.messages} data-testid="messages">
        {messages.length === 0 ? (
          <li className={styles.empty}>No messages yet — say hi.</li>
        ) : (
          messages.map((m) => (
            <li
              key={m.id}
              data-testid="message"
              data-status={m.status}
              className={
                m.status === "pending"
                  ? `${styles.message} ${styles.pending}`
                  : styles.message
              }
            >
              <span className={styles.author}>{m.authorName}</span> {m.text}
            </li>
          ))
        )}
      </ul>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          className={styles.input}
          aria-label="Message"
          placeholder={`Message #${channelId}`}
          value={composerText}
          onChange={(e) => store.dispatch(composerChanged(e.target.value))}
        />
        <button className={styles.send} type="submit">
          Send
        </button>
      </form>
    </section>
  );
}
