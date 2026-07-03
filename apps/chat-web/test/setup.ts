// Registers jest-dom matchers and, crucially, auto-cleans up the DOM after each test so no render
// (or its store subscription) leaks into the next test.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
