import App from "../components/App";

export const metadata = {
  title: "API Key — untangle.lol",
  description: "Enter your Anthropic or OpenRouter API key to use untangle.lol with your own account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/key" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/key",
    siteName: "untangle.lol",
    title: "API Key — untangle.lol",
    description: "Use untangle.lol with your own Anthropic or OpenRouter API key.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function KeyPage() {
  return <App />;
}
