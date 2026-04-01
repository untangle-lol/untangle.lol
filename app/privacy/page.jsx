import { redirect } from "next/navigation";

export const metadata = {
  title: "Privacy Policy — untangle.lol",
  description:
    "Privacy policy for untangle.lol. We collect no personal data. Your goals, plans, and API key are stored only in your own browser — nothing is ever sent to our servers.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/privacy" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/privacy",
    siteName: "untangle.lol",
    title: "Privacy Policy — untangle.lol",
    description: "We collect no personal data. Your goals and API key stay in your browser only.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — untangle.lol",
    description: "We collect no personal data. Your goals and API key stay in your browser only.",
    images: ["/og.png"],
  },
};

export default function PrivacyPage() {
  redirect("/#privacy");
}
