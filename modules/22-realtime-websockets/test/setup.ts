// MUST be the first import in the whole test run: Nest's DI + gateway metadata read the
// `Reflect.getMetadata(...)` API that this shim installs onto the global `Reflect`.
import "reflect-metadata";
// Registers the jest-dom matchers (`toHaveTextContent`, …) used by the React client test.
import "@testing-library/jest-dom/vitest";
