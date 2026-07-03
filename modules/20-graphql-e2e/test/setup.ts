// MUST be first: Nest's DI + code-first GraphQL read the `Reflect.getMetadata(...)` API this shim
// installs onto the global `Reflect`.
import "reflect-metadata";
// jest-dom matchers (`toBeInTheDocument`, …) for the React CLIENT test files that run under jsdom.
import "@testing-library/jest-dom/vitest";
