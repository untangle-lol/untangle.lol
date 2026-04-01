import App from "../components/App";

export const metadata = {
  title: "Choose Language — untangle.lol",
  description:
    "Select your language to use untangle.lol in English, Dutch, German, French, Spanish, Arabic, Bengali, Hindi, Indonesian, Japanese, Portuguese, Russian, Swahili, Turkish, or Chinese.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/lang" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/lang",
    siteName: "untangle.lol",
    title: "Choose Language — untangle.lol",
    description: "Use untangle.lol in your language — supports 15 languages.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function LangPage() {
  return <App />;
}
