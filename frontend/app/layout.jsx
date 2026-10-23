import "./globals.css";
import { WorkspaceProvider } from "../components/workspace/provider";
import { WorkspaceShell } from "../components/workspace/shell";

export const metadata = {
  title: "NationOS · Aderin planning workspace",
  description: "Explore a synthetic country and review evidence-led public investment plans.",
};

// The persistent provider keeps an unsaved proposal alive while Next changes pages.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>
          <WorkspaceShell>{children}</WorkspaceShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
