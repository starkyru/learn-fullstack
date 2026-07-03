/**
 * Build a shared-dependency scope from scratch: hand-rolled semver + highest-satisfying-wins
 * singleton negotiation.
 *
 * YOUR TURN — implement the four exports:
 *   - parseVersion(input): parse strict "x.y.z" to { major, minor, patch }; throw on bad input.
 *   - compareVersions(a, b): order by major, then minor, then patch; return <0 / 0 / >0.
 *   - satisfies(version, range): support "*", "^x.y.z" (same major, >= base), "~x.y.z" (same major
 *     AND minor, >= base patch), and exact "x.y.z".
 *   - createSharedScope(): provide(name, version, factory); get(name, range) picks the HIGHEST
 *     provided version that satisfies the range and instantiates its factory AT MOST ONCE (singleton
 *     cached per (name, version)); has(name, range) reports satisfiability without instantiating;
 *     get throws when nothing satisfies.
 */

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(_input: string): Version {
  throw new Error('TODO: parse "x.y.z" into { major, minor, patch }');
}

export function compareVersions(_a: string, _b: string): number {
  throw new Error("TODO: compare by major, then minor, then patch");
}

export function satisfies(_version: string, _range: string): boolean {
  throw new Error('TODO: support "*", "^x.y.z", "~x.y.z", and exact "x.y.z"');
}

/** A declared shared dependency: its version and a lazy factory that builds the instance. */
export interface Shared<T = unknown> {
  version: string;
  factory: () => T;
}

export interface SharedScope {
  provide<T>(name: string, version: string, factory: () => T): void;
  get<T>(name: string, range: string): T;
  has(name: string, range: string): boolean;
}

export function createSharedScope(): SharedScope {
  throw new Error(
    "TODO: build the shared scope (provide / highest-satisfying get singleton / has)",
  );
}
