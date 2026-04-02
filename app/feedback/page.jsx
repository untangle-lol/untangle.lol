import App from "../components/App";

export const metadata = {
  description: "Share your feedback about untangle.lol — free AI goal planner and to-do list app.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/feedback" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/feedback",
    siteName: "untangle.lol",
    description: "Share your feedback about untangle.lol.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function FeedbackPage() {
  return <App />;
}
