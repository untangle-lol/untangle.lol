import { permanentRedirect } from "next/navigation";

const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

export const metadata = {
  description:
    "Support the development of untangle.lol, a free, private, AI-powered to-do list and goal planner available in 15 languages.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://untangle.lol/donate",
    languages: {
      "x-default": "https://untangle.lol/donate",
      ...Object.fromEntries(LANGS.map(l => [l, `https://untangle.lol/donate/${l}`])),
    },
  },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/donate",
    siteName: "untangle.lol",
    description:
      "Support the development of untangle.lol — free AI to-do list and goal planner in 15 languages.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Support the development of untangle.lol — free AI to-do list and goal planner in 15 languages.",
    images: ["/og.png"],
  },
};

export default function DonatePage() {
  permanentRedirect("/donate/en");
}
