import { describe, expect, it, vi } from "vitest";
import {
  compareVersions,
  createSharedScope,
  parseVersion,
  satisfies,
} from "../solution/02-shared-scope.js";

interface Lib {
  version: string;
}

describe("semver helpers", () => {
  it("parseVersion splits x.y.z into numeric parts", () => {
    expect(parseVersion("18.3.1")).toEqual({ major: 18, minor: 3, patch: 1 });
  });

  it("compareVersions orders by major, then minor, then patch", () => {
    expect(compareVersions("1.2.0", "1.10.0")).toBeLessThan(0); // minor 2 < 10
    expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0); // major 2 > 1
    expect(compareVersions("18.3.1", "18.3.1")).toBe(0);
  });

  it("satisfies honors *, caret, tilde, and exact", () => {
    expect(satisfies("18.3.1", "^18.2.0")).toBe(true); // caret: same major, >= base
    expect(satisfies("19.0.0", "^18.2.0")).toBe(false); // caret: major bumped
    expect(satisfies("18.3.1", "~18.2.0")).toBe(false); // tilde: minor bumped
    expect(satisfies("18.2.4", "~18.2.0")).toBe(true); // tilde: same major+minor, higher patch
    expect(satisfies("18.2.0", "18.2.0")).toBe(true); // exact
    expect(satisfies("18.2.1", "18.2.0")).toBe(false); // exact mismatch
    expect(satisfies("1.0.0", "*")).toBe(true); // wildcard
  });

  it("rejects versions BELOW the range's lower bound (caret and tilde)", () => {
    // A range is an interval, not just an upper cap: a version under the base must fail.
    expect(satisfies("18.0.0", "^18.2.0")).toBe(false); // caret: same major but below base minor.patch
    expect(satisfies("18.1.9", "^18.2.0")).toBe(false); // caret: just under the base
    expect(satisfies("18.2.0", "~18.2.5")).toBe(false); // tilde: same major+minor but below base patch
  });
});

describe("createSharedScope", () => {
  it("get instantiates the factory at most once and returns the same singleton", () => {
    const factory = vi.fn((): Lib => ({ version: "18.3.0" }));
    const scope = createSharedScope();
    scope.provide("react", "18.3.0", factory);

    const a = scope.get<Lib>("react", "^18.0.0");
    const b = scope.get<Lib>("react", "^18.0.0");

    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("shares ONE instance across different ranges that resolve to the same version", () => {
    // The singleton must be keyed by the RESOLVED version, not the request range: two consumers
    // asking with different ranges that both land on 18.3.0 get the exact same instance (one factory run).
    const factory183 = vi.fn((): Lib => ({ version: "18.3.0" }));
    const scope = createSharedScope();
    scope.provide("react", "18.1.0", (): Lib => ({ version: "18.1.0" }));
    scope.provide("react", "18.3.0", factory183);

    const viaCaret = scope.get<Lib>("react", "^18.0.0"); // highest 18.x → 18.3.0
    const viaTilde = scope.get<Lib>("react", "~18.3.0"); // also 18.3.0

    expect(viaCaret.version).toBe("18.3.0");
    expect(viaTilde).toBe(viaCaret); // same singleton, not a per-range instance
    expect(factory183).toHaveBeenCalledTimes(1); // instantiated once for 18.3.0
  });

  it("picks the highest provided version that satisfies the range", () => {
    const scope = createSharedScope();
    scope.provide("react", "18.1.0", (): Lib => ({ version: "18.1.0" }));
    scope.provide("react", "18.3.0", (): Lib => ({ version: "18.3.0" }));
    scope.provide("react", "19.0.0", (): Lib => ({ version: "19.0.0" }));

    // ^18.0.0 excludes 19.0.0, so the winner is the highest 18.x.
    expect(scope.get<Lib>("react", "^18.0.0").version).toBe("18.3.0");
  });

  it('"*" resolves to the highest provided version overall', () => {
    const scope = createSharedScope();
    scope.provide("react", "18.1.0", (): Lib => ({ version: "18.1.0" }));
    scope.provide("react", "18.3.0", (): Lib => ({ version: "18.3.0" }));
    scope.provide("react", "19.0.0", (): Lib => ({ version: "19.0.0" }));

    expect(scope.get<Lib>("react", "*").version).toBe("19.0.0");
  });

  it("throws when no provided version satisfies the range", () => {
    const scope = createSharedScope();
    scope.provide("react", "17.0.2", (): Lib => ({ version: "17.0.2" }));

    expect(scope.has("react", "^18.0.0")).toBe(false);
    expect(() => scope.get("react", "^18.0.0")).toThrow(
      'No provided "react" satisfies range "^18.0.0"',
    );
  });

  it("has() reports satisfiability without instantiating the factory", () => {
    const factory = vi.fn((): Lib => ({ version: "18.3.0" }));
    const scope = createSharedScope();
    scope.provide("react", "18.3.0", factory);

    expect(scope.has("react", "^18.0.0")).toBe(true);
    expect(factory).not.toHaveBeenCalled();
  });
});
