/**
 * Task 4 — Ship & document: apps-readiness check (TODO).
 *
 * Implement `checkAppsReady` so `/progress` can decide whether the capstone is done. For EACH
 * slice, produce a `SliceReadiness` by collecting the gaps into a `missing` string[]:
 *
 *   1. if `authStack` is falsy → push `` `${name}: missing auth stack` `` (Kanban = Auth.js
 *      session, Chat = JWT/Passport — the two stacks the capstone deliberately differs on);
 *   2. for every action in `requiredActions` NOT present in `wiredActions` → push
 *      `` `${name}: missing action "${action}"` ``;
 *   3. if `tests` is empty → push `` `${name}: no tests referenced` ``.
 *
 * A slice is `ready` when its `missing` is empty. Then combine the two slices:
 *   - `slices`: `[kanban, chat]` readiness;
 *   - `missing`: every slice's gaps, flattened;
 *   - `done`: true ONLY when EVERY slice is ready.
 *
 * Keep the exact return SHAPE below; do not swallow gaps — the report must NAME each one. When
 * done, flip the test imports from `../solution/04-readiness.js` to `../src/04-readiness.js`.
 */

export interface SliceReadinessSpec {
  name: "kanban" | "chat";
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

export function checkAppsReady(_input: {
  kanban: SliceReadinessSpec;
  chat: SliceReadinessSpec;
}): AppsReadiness {
  throw new Error("TODO");
}
