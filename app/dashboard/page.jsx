import App from "../components/App";

export const metadata = {
  title: "My Plans — untangle.lol",
  description: "View and continue your AI-generated goal plans on untangle.lol — free, private, no account required.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/dashboard" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/dashboard",
    siteName: "untangle.lol",
    title: "My Plans — untangle.lol",
    description: "Your saved AI goal plans on untangle.lol.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function DashboardPage() {
  return <App />;
}
