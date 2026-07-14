import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    controls: { expanded: true },
  },
};

export default preview;
