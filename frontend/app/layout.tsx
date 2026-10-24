import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NationOS", template: "%s · NationOS" },
  description: "Cited Nigerian public figures, FAAC, and explainable budget splits.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B3B2C",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
