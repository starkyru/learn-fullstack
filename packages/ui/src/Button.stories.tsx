import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button.js";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Save" },
  argTypes: { variant: { control: "radio", options: ["primary", "secondary", "ghost"] } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Learn more" } };
