import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * WORKED EXAMPLE — a compound <Tabs> that shares the active tab through context.
 * Usage: <Tabs><Tabs.Tab id="a">A</Tabs.Tab><Tabs.Panel id="a">…</Tabs.Panel></Tabs>
 */
const TabsContext = createContext<{
  active: string;
  setActive: (id: string) => void;
} | null>(null);
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}
export function Tabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: ReactNode;
}) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>
  );
}
Tabs.Tab = function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active === id}
      onClick={() => setActive(id)}
    >
      {children}
    </button>
  );
};
Tabs.Panel = function Panel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div role="tabpanel">{children}</div> : null;
};

/**
 * YOUR TURN (analog) — a compound <Accordion> that tracks which section is open via context.
 * Provide <Accordion.Header id> (a button that opens its section) and <Accordion.Body id>
 * (renders its children only when open). Model it on <Tabs>. Start with `openId = null`.
 * Clicking a header sets openId to its id.
 */
export function Accordion(_props: { children: ReactNode }) {
  throw new Error("TODO: compound Accordion with shared openId context + Header/Body");
}
