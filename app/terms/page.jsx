import { redirect } from "next/navigation";

export const metadata = {
  title: "Terms of Service — untangle.lol",
  description:
    "Terms of service for untangle.lol — a free, private, AI-powered to-do list and goal planner. No account required, no data collected.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/terms" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/terms",
    siteName: "untangle.lol",
    title: "Terms of Service — untangle.lol",
    description: "Terms of service for untangle.lol — free AI goal planner and to-do list app.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service — untangle.lol",
    description: "Terms of service for untangle.lol — free AI goal planner and to-do list app.",
    images: ["/og.png"],
  },
};

export default function TermsPage() {
  redirect("/#terms");
}
