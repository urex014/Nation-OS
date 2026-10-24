import "./globals.css";
import { DraftProvider } from "../components/nigeria/draft-provider";
import { AppFrame } from "../components/workspace/frame";
import { currentUser } from "../lib/auth/current";

export const runtime = "nodejs";

const description =
  "Budget planning, revenue insight, and decision records for Lagos State agencies.";

export const metadata = {
  title: "NationOS",
  description,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0B3B2C" }],
  },
  openGraph: {
    title: "NationOS",
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "NationOS" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B3B2C",
};

// DraftProvider carries an unsaved plan between workspace pages. Public pages skip the shell.
export default async function RootLayout({ children }) {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  return (
    <html lang="en">
      <body>
        <DraftProvider>
          <AppFrame user={user}>{children}</AppFrame>
        </DraftProvider>
      </body>
    </html>
  );
}
