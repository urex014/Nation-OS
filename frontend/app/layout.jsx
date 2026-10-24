import "./globals.css";
import { DraftProvider } from "../components/nigeria/draft-provider";
import { WorkspaceShell } from "../components/workspace/shell";
export const metadata = {
  title: "NationOS · Nigeria planning workspace",
  description: "Nigerian public data, explainable budget scenarios and decision records.",
};
// This provider carries an unsaved plan between pages; SQLite stores saved records.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DraftProvider>
          <WorkspaceShell>{children}</WorkspaceShell>
        </DraftProvider>
      </body>
    </html>
  );
}
