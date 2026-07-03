// MUST be the first import in the whole test run: Nest's DI reads the `Reflect.getMetadata(...)`
// API that this shim installs onto the global `Reflect` (Task 3's integration test).
import "reflect-metadata";

// Extends vitest's `expect` with DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, …) for the
// jsdom React tests (Task 2). Harmless in node-env test files — it only registers matchers.
import "@testing-library/jest-dom/vitest";
