import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount any RTL-rendered trees after each test so client islands hold no state or
// listeners across tests (the web analog of closing sockets/apps in an API afterEach).
afterEach(() => {
  cleanup();
});
