import App from "../components/App";

export const metadata = {
  description:
    "Use the WOOP method (Wish, Outcome, Obstacle, Plan) to set and achieve your goals with AI support on untangle.lol.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/woop" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/woop",
    siteName: "untangle.lol",
    description:
      "Use the WOOP method (Wish, Outcome, Obstacle, Plan) to set and achieve your goals with AI on untangle.lol.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    description: "Use the research-backed WOOP method with AI to achieve any goal.",
    images: ["/og.png"],
  },
};

export default function WoopPage() {
  return <App />;
}
