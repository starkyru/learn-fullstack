import { describe, expect, it } from "vitest";
import { checkAppsReady, type SliceReadinessSpec } from "../solution/04-readiness.js";

// A fully-wired Kanban slice (Auth.js session) and Chat slice (JWT/Passport). Tests below
// remove one thing at a time to prove each gap is named.
function wiredKanban(): SliceReadinessSpec {
  return {
    name: "kanban",
    authStack: "authjs-session",
    requiredActions: ["createBoard", "addCard", "moveCard"],
    wiredActions: ["createBoard", "addCard", "moveCard", "getBoard"],
    tests: ["01-kanban-slice.test.ts"],
  };
}

function wiredChat(): SliceReadinessSpec {
  return {
    name: "chat",
    authStack: "jwt-passport",
    requiredActions: ["joinRoom", "postMessage", "history"],
    wiredActions: ["joinRoom", "postMessage", "history"],
    tests: ["02-chat-slice.test.ts"],
  };
}

describe("checkAppsReady", () => {
  it("reports ready + done when both slices are fully wired with different auth stacks", () => {
    const report = checkAppsReady({ kanban: wiredKanban(), chat: wiredChat() });

    expect(report.done).toBe(true);
    expect(report.missing).toEqual([]);
    expect(report.slices.map((s) => ({ name: s.name, ready: s.ready }))).toEqual([
      { name: "kanban", ready: true },
      { name: "chat", ready: true },
    ]);
    // The capstone's whole point: the two slices carry DIFFERENT auth stacks.
    const [kanban, chat] = report.slices;
    expect(kanban?.authStack).toBe("authjs-session");
    expect(chat?.authStack).toBe("jwt-passport");
    expect(kanban?.authStack).not.toBe(chat?.authStack);
  });

  it("marks a slice NOT ready and names the gap when its auth stack is missing", () => {
    const report = checkAppsReady({
      kanban: { ...wiredKanban(), authStack: null },
      chat: wiredChat(),
    });

    expect(report.done).toBe(false);
    const kanban = report.slices.find((s) => s.name === "kanban");
    expect(kanban?.ready).toBe(false);
    expect(kanban?.missing).toContain("kanban: missing auth stack");
    // The other slice is unaffected.
    expect(report.slices.find((s) => s.name === "chat")?.ready).toBe(true);
    expect(report.missing).toEqual(["kanban: missing auth stack"]);
  });

  it("names a missing required action by name", () => {
    const chat = wiredChat();
    const report = checkAppsReady({
      kanban: wiredKanban(),
      chat: { ...chat, wiredActions: ["joinRoom", "history"] }, // postMessage not wired
    });

    expect(report.done).toBe(false);
    const chatSlice = report.slices.find((s) => s.name === "chat");
    expect(chatSlice?.ready).toBe(false);
    expect(chatSlice?.missing).toEqual(['chat: missing action "postMessage"']);
  });

  it("flags a slice with no tests referenced", () => {
    const report = checkAppsReady({
      kanban: { ...wiredKanban(), tests: [] },
      chat: wiredChat(),
    });

    expect(report.done).toBe(false);
    expect(report.slices.find((s) => s.name === "kanban")?.missing).toEqual([
      "kanban: no tests referenced",
    ]);
  });

  it("accumulates multiple gaps for one slice", () => {
    const report = checkAppsReady({
      kanban: {
        name: "kanban",
        authStack: null,
        requiredActions: ["createBoard", "moveCard"],
        wiredActions: ["createBoard"],
        tests: [],
      },
      chat: wiredChat(),
    });

    const kanban = report.slices.find((s) => s.name === "kanban");
    expect(kanban?.missing).toEqual([
      "kanban: missing auth stack",
      'kanban: missing action "moveCard"',
      "kanban: no tests referenced",
    ]);
  });
});
