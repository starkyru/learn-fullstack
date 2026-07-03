import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { io, type Socket as IOSocket } from "socket.io-client";
import { ChatView } from "./ChatView.js";
import { createChatStore } from "./chatSlice.js";
import { createSocketStore, type Scheduler, type Socket } from "./socket-store.js";

/**
 * Real wiring (artifact — NOT exercised by the test gate): a socket.io-client adapter behind the
 * store's `Socket` interface + a `window.setTimeout` scheduler. The slice/store/view are identical
 * to what the tests drive with fakes.
 */

const SERVER_URL = import.meta.env?.VITE_CHAT_URL ?? "http://localhost:3001";

function ioAdapter(url: string): Socket {
  let raw: IOSocket | null = null;
  const adapter: Socket = {
    onopen: null,
    onclose: null,
    connect() {
      raw = io(url, { autoConnect: false });
      raw.on("connect", () => adapter.onopen?.());
      raw.on("disconnect", () => adapter.onclose?.());
      raw.connect();
    },
    close() {
      raw?.disconnect();
    },
    emit(event, data) {
      raw?.emit(event, data);
    },
    on(event, handler) {
      raw?.on(event, handler);
    },
  };
  return adapter;
}

const scheduler: Scheduler = {
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
  clearTimeout: (handle) => window.clearTimeout(handle),
};

const store = createChatStore();
const socket = createSocketStore({
  createSocket: () => ioAdapter(SERVER_URL),
  scheduler,
});

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ChatView
        store={store}
        socket={socket}
        currentUser={{ id: "me", name: "You" }}
        nextId={() => crypto.randomUUID()}
      />
    </StrictMode>,
  );
}
