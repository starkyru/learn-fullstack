import { createContext, useContext, useState, type ReactNode } from "react";

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

const AccordionContext = createContext<{
  openId: string | null;
  setOpenId: (id: string) => void;
} | null>(null);
function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion.* must be used inside <Accordion>");
  return ctx;
}
export function Accordion({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <AccordionContext.Provider value={{ openId, setOpenId }}>
      {children}
    </AccordionContext.Provider>
  );
}
Accordion.Header = function Header({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { openId, setOpenId } = useAccordion();
  return (
    <button type="button" aria-expanded={openId === id} onClick={() => setOpenId(id)}>
      {children}
    </button>
  );
};
Accordion.Body = function Body({ id, children }: { id: string; children: ReactNode }) {
  const { openId } = useAccordion();
  return openId === id ? <div role="region">{children}</div> : null;
};
