/**
 * Task 4 — Ship & document: apps-readiness check (SOLUTION).
 *
 * `checkAppsReady` is what `/progress` runs to decide whether the capstone is done. For each
 * slice it verifies three things are wired:
 *
 *   1. an AUTH STACK is present (Auth.js session for Kanban, JWT/Passport for Chat);
 *   2. every REQUIRED core action is wired (a `requiredActions` ⊆ `wiredActions` check);
 *   3. at least one TEST is referenced.
 *
 * A slice is `ready` only when nothing is missing; the report NAMES each gap so the learner knows
 * exactly what to finish. Overall `done` is true only when EVERY slice is ready.
 */

export interface SliceReadinessSpec {
  name: "kanban" | "chat";
  /** The slice's auth stack, or `null` if none is wired yet. */
  authStack: string | null;
  requiredActions: string[];
  wiredActions: string[];
  tests: string[];
}

export interface SliceReadiness {
  name: "kanban" | "chat";
  authStack: string | null;
  ready: boolean;
  missing: string[];
}

export interface AppsReadiness {
  slices: SliceReadiness[];
  done: boolean;
  missing: string[];
}

function checkSlice(spec: SliceReadinessSpec): SliceReadiness {
  const missing: string[] = [];
  if (!spec.authStack) missing.push(`${spec.name}: missing auth stack`);
  for (const action of spec.requiredActions) {
    if (!spec.wiredActions.includes(action)) {
      missing.push(`${spec.name}: missing action "${action}"`);
    }
  }
  if (spec.tests.length === 0) missing.push(`${spec.name}: no tests referenced`);
  return {
    name: spec.name,
    authStack: spec.authStack,
    ready: missing.length === 0,
    missing,
  };
}

export function checkAppsReady(input: {
  kanban: SliceReadinessSpec;
  chat: SliceReadinessSpec;
}): AppsReadiness {
  const slices = [checkSlice(input.kanban), checkSlice(input.chat)];
  const missing = slices.flatMap((slice) => slice.missing);
  const done = slices.every((slice) => slice.ready);
  return { slices, done, missing };
}
