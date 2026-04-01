import App from "../components/App";

export const metadata = {
  title: "New Plan — untangle.lol",
  description: "Start a new AI-generated goal plan on untangle.lol. Type any goal and get an instant step-by-step action plan.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://untangle.lol/new" },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/new",
    siteName: "untangle.lol",
    title: "New Plan — untangle.lol",
    description: "Type any goal and get an instant AI-generated step-by-step plan.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function NewPage() {
  return <App />;
}
