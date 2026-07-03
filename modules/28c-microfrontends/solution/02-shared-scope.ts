/**
 * A shared-dependency scope, from scratch — Module Federation's "shared singleton" negotiation with
 * no semver library. Many remotes each declare which version of a shared lib (say `react`) they
 * bring; the host must resolve ONE instance per shared name so two remotes don't run two copies.
 *
 * The rule: among every provided version that SATISFIES the consumer's range, pick the HIGHEST, and
 * instantiate it AT MOST ONCE (a true singleton — cached per `(name, version)`), returning that same
 * instance to every consumer. A tiny hand-rolled semver drives the "satisfies" + "highest" logic.
 */

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

/** Parse a strict `"x.y.z"` into numeric parts; throws on anything that isn't three dotted integers. */
export function parseVersion(input: string): Version {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(input.trim());
  if (match === null) {
    throw new Error(`Invalid semver "${input}" — expected "x.y.z"`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

/** Total order on versions: compare major, then minor, then patch. Returns <0, 0, or >0. */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

/**
 * Does `version` satisfy `range`? Supports a small dialect:
 *   - `"*"`           any version
 *   - `"^x.y.z"`      same major, and >= the base (caret)
 *   - `"~x.y.z"`      same major AND minor, and >= the base patch (tilde)
 *   - `"x.y.z"`       exact match
 */
export function satisfies(version: string, range: string): boolean {
  const trimmed = range.trim();
  if (trimmed === "*") return true;

  const v = parseVersion(version);

  if (trimmed.startsWith("^")) {
    const base = parseVersion(trimmed.slice(1));
    if (v.major !== base.major) return false;
    return compareVersions(version, `${base.major}.${base.minor}.${base.patch}`) >= 0;
  }

  if (trimmed.startsWith("~")) {
    const base = parseVersion(trimmed.slice(1));
    if (v.major !== base.major || v.minor !== base.minor) return false;
    return v.patch >= base.patch;
  }

  const exact = parseVersion(trimmed);
  return v.major === exact.major && v.minor === exact.minor && v.patch === exact.patch;
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

interface ProvidedEntry {
  version: string;
  factory: () => unknown;
  instantiated: boolean;
  instance: unknown;
}

export function createSharedScope(): SharedScope {
  const scope = new Map<string, ProvidedEntry[]>();

  const provide = <T>(name: string, version: string, factory: () => T): void => {
    parseVersion(version); // validate the version eagerly so bad input fails at declaration time
    const list = scope.get(name) ?? [];
    const existingIndex = list.findIndex((entry) => entry.version === version);
    const entry: ProvidedEntry = {
      version,
      factory: factory as () => unknown,
      instantiated: false,
      instance: undefined,
    };
    // A later provider of the same exact version replaces the earlier one.
    if (existingIndex >= 0) list[existingIndex] = entry;
    else list.push(entry);
    scope.set(name, list);
  };

  const bestMatch = (name: string, range: string): ProvidedEntry | undefined => {
    const list = scope.get(name);
    if (list === undefined) return undefined;
    let best: ProvidedEntry | undefined;
    for (const entry of list) {
      if (!satisfies(entry.version, range)) continue;
      if (best === undefined || compareVersions(entry.version, best.version) > 0) {
        best = entry;
      }
    }
    return best;
  };

  const get = <T>(name: string, range: string): T => {
    const entry = bestMatch(name, range);
    if (entry === undefined) {
      throw new Error(`No provided "${name}" satisfies range "${range}"`);
    }
    // Singleton: build once, then hand back the very same instance forever.
    if (!entry.instantiated) {
      entry.instance = entry.factory();
      entry.instantiated = true;
    }
    return entry.instance as T;
  };

  const has = (name: string, range: string): boolean =>
    bestMatch(name, range) !== undefined;

  return { provide, get, has };
}
