/**
 * ARTIFACT — Storybook "play" test for the Board (Task 2).
 *
 * The GATE does NOT run this file (Storybook needs a browser + the test-runner; it lives outside
 * `test/` and is excluded from vitest's `include`). It is here as the tooling deliverable: the
 * SAME interaction the RTL "play" test covers headlessly, expressed as a Storybook play function so
 * it can be reviewed visually and run under `@storybook/test-runner` in CI.
 *
 * Run manually with: `storybook dev` (visual) or `test-storybook` (headless play).
 */
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { http, HttpResponse } from "msw";
import { Board } from "../solution/02-board.js";

const meta: Meta<typeof Board> = {
  title: "Testing/Board",
  component: Board,
  args: { apiUrl: "http://api.test" },
  parameters: {
    msw: {
      handlers: [
        http.get("http://api.test/cards", () => HttpResponse.json([])),
        http.post("http://api.test/cards", async ({ request }) => {
          const body = (await request.json()) as { title: string };
          return HttpResponse.json({ id: "99", title: body.title }, { status: 201 });
        }),
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Board>;

export const AddACard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText("New card title"), "Gamma");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(await canvas.findByText("Gamma")).toBeInTheDocument();
  },
};
