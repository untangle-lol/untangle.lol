import App from "../components/App";

export const metadata = {
  title: "Get More Questions — untangle.lol",
  description:
    "Buy more questions to keep generating AI action plans on untangle.lol. Secure payment via Mollie. €0.25 per question.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/payment" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/payment",
    siteName: "untangle.lol",
    title: "Get More Questions — untangle.lol",
    description: "Buy more questions for untangle.lol — AI goal planner. €0.25 per question, secure payment via Mollie.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get More Questions — untangle.lol",
    description: "Buy more questions for untangle.lol — AI goal planner. €0.25 per question.",
    images: ["/og.png"],
  },
};

export default function PaymentPage() {
  return <App />;
}
