import App from "../components/App";

export const metadata = {
  description: "Manage your account and settings on untangle.lol — free AI goal planner.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/settings" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/settings",
    siteName: "untangle.lol",
    description: "Manage your account and settings on untangle.lol.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function SettingsPage() {
  return <App />;
}
