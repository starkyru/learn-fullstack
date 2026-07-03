import type { ReactElement, ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Kanban",
  description: "Kanban board — learn-fullstack capstone (Next.js App Router).",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
