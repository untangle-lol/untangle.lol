import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://untangle.lol"),
  title: "Untangle.lol — Free AI To-Do List & Goal Planner",
  description:
    "Untangle.lol is a free AI-powered to-do list and goal planner. Type any goal and instantly get a clear, step-by-step action plan. No account, no ads, fully private. Works in English, Dutch, German, French, Spanish, Arabic, Bengali, Hindi, Indonesian, Japanese, Portuguese, Russian, Swahili, Turkish, and Chinese.",
  authors: [{ name: "untangle.lol", url: "https://untangle.lol" }],
  keywords: [
    "AI to-do list",
    "AI goal planner",
    "free to-do list app",
    "AI action plan",
    "goal breakdown",
    "step by step planner",
    "no account to-do list",
    "private to-do list",
    "Claude AI planner",
    "productivity app",
  ],
  alternates: {
    canonical: "https://untangle.lol/",
    languages: {
      "x-default": "https://untangle.lol/",
      en: "https://untangle.lol/donate/en",
      nl: "https://untangle.lol/donate/nl",
      de: "https://untangle.lol/donate/de",
      fr: "https://untangle.lol/donate/fr",
      es: "https://untangle.lol/donate/es",
      pt: "https://untangle.lol/donate/pt",
      ar: "https://untangle.lol/donate/ar",
      bn: "https://untangle.lol/donate/bn",
      hi: "https://untangle.lol/donate/hi",
      id: "https://untangle.lol/donate/id",
      ja: "https://untangle.lol/donate/ja",
      ru: "https://untangle.lol/donate/ru",
      sw: "https://untangle.lol/donate/sw",
      tr: "https://untangle.lol/donate/tr",
      zh: "https://untangle.lol/donate/zh",
    },
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://untangle.lol/",
    siteName: "untangle.lol",
    title: "Untangle.lol — Free AI To-Do List & Goal Planner",
    description:
      "Type any goal, get an instant step-by-step to-do list powered by AI. Free, private, no account needed. Supports 15 languages including English, Spanish, Arabic, Hindi, and Chinese.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Untangle.lol — Free AI To-Do List & Goal Planner",
    description:
      "Type any goal, get an instant step-by-step to-do list powered by AI. Free, private, no account needed. Supports 15 languages.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "untangle.lol",
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "untangle.lol",
  alternateName: ["Untangle", "untangle lol", "untangle.lol to-do list"],
  url: "https://untangle.lol/",
  description:
    "Untangle.lol is a free AI-powered to-do list and goal planner. Enter any goal and receive an instant, personalised step-by-step action plan. No account required, fully private, data stays in your browser.",
  applicationCategory: "ProductivityApplication",
  applicationSubCategory: "To-Do List",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  inLanguage: ["en", "nl", "de", "fr", "es", "ar", "bn", "hi", "id", "ja", "pt", "ru", "sw", "tr", "zh"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to use with your own Anthropic or OpenRouter API key",
  },
  featureList: [
    "AI-generated step-by-step to-do lists",
    "Goal breakdown into actionable tasks",
    "Progress tracking with checkboxes",
    "No account or sign-up required",
    "Fully private — all data stored locally in your browser",
    "Multi-language: English, Dutch, German, French, Spanish, Arabic, Bengali, Hindi, Indonesian, Japanese, Portuguese, Russian, Swahili, Turkish, Chinese",
    "Works on mobile and desktop",
    "Supports Anthropic (Claude) and OpenRouter API keys",
  ],
  screenshot: "https://untangle.lol/og.png",
  creator: { "@type": "Organization", name: "untangle.lol", url: "https://untangle.lol/" },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "untangle.lol",
  url: "https://untangle.lol/",
  logo: "https://untangle.lol/og.png",
  description: "untangle.lol builds free, private, AI-powered productivity tools. Our flagship product turns any goal into an instant, step-by-step to-do list using Claude AI.",
  sameAs: [],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best free AI to-do list app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Untangle.lol is a free AI-powered to-do list app that turns any goal into a personalised, step-by-step action plan in seconds. It requires no account, stores all data privately in your browser, and supports multiple languages. You bring your own Anthropic or OpenRouter API key, so there are no subscriptions or usage limits set by the app.",
      },
    },
    {
      "@type": "Question",
      name: "How do I turn a goal into a to-do list with AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Go to untangle.lol, type your goal in plain language (for example: 'I want to run a 5K' or 'I want to learn Spanish'), and press Enter. The AI generates a clear, numbered to-do list with specific, doable steps you can start today. Each step can be checked off as you complete it, and your progress is saved automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Is untangle.lol free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Untangle.lol is free. It uses a bring-your-own-key model: you provide your own Anthropic (Claude) or OpenRouter API key. There are no subscriptions, no per-use fees charged by the app, and no ads. The typical cost for a single AI-generated to-do list is a fraction of a cent.",
      },
    },
    {
      "@type": "Question",
      name: "Does untangle.lol require an account or sign-up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Untangle.lol requires no account, no email address, and no sign-up. You can start using it immediately. Your goals, to-do lists, and progress are saved locally in your browser only and are never sent to any server.",
      },
    },
    {
      "@type": "Question",
      name: "What can I use untangle.lol for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Untangle.lol works for any goal you can describe in a sentence. Common uses include: building a workout or fitness plan, learning a new skill (coding, music, language), improving sleep or productivity habits, planning a project or trip, organising daily tasks, breaking a big ambition into small steps, and overcoming procrastination.",
      },
    },
    {
      "@type": "Question",
      name: "What languages does untangle.lol support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Untangle.lol currently supports English, Dutch (Nederlands), German (Deutsch), French (Français), Spanish (Español), Arabic (العربية), Bengali (বাংলা), Hindi (हिन्दी), Indonesian (Bahasa Indonesia), Japanese (日本語), Portuguese (Português), Russian (Русский), Swahili (Kiswahili), Turkish (Türkçe), and Chinese (中文). The AI responds in whichever language you select, and the entire interface is localised for each language.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data private on untangle.lol?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All your data — goals, to-do lists, progress, and API key — is stored exclusively in your own browser's localStorage. Nothing is sent to untangle.lol servers. Your API key goes directly from your browser to Anthropic or OpenRouter and nowhere else.",
      },
    },
    {
      "@type": "Question",
      name: "How is untangle.lol different from other to-do list apps like Todoist or Things?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional to-do list apps like Todoist, Things, or Notion require you to know what tasks to add. Untangle.lol generates the tasks for you using AI: you describe a goal in plain language and it creates a personalised, prioritised action plan automatically. It is best for goal-oriented planning rather than ongoing task management.",
      },
    },
    {
      "@type": "Question",
      name: "How is untangle.lol different from asking ChatGPT for a plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "While ChatGPT can generate plans in a conversation, untangle.lol is purpose-built for goal planning: it outputs a structured, interactive to-do list with checkboxes, saves your progress automatically, keeps a history of all your goals, and is optimised for mobile. It is faster and more focused for this specific use case.",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta property="fb:app_id" content="0" />
        {/* Geo metadata — company registered in the Netherlands */}
        <meta name="geo.region" content="NL" />
        <meta name="geo.country" content="NL" />
        <meta name="geo.placename" content="Netherlands" />
        <meta name="language" content="en,nl,de,fr,es,pt,ar,bn,hi,id,ja,ru,sw,tr,zh" />
        <link rel="me" href="https://untangle.lol/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
        <script
          defer
          src="https://stats.fabrikage.nl/script.js"
          data-website-id="5df9894f-35a2-4ba6-8729-407a1baed305"
        />
      </head>
      <body>
        {/*
          Static semantic content rendered server-side.
          Visually hidden but fully readable by search engines and AI crawlers.
          This is the real HTML bots index — the React app mounts alongside it.
        */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
          }}
        >
          <h1>Untangle.lol — Free AI To-Do List and Goal Planner</h1>
          <p>
            Untangle.lol is a free, private, AI-powered to-do list app and goal planner.
            Describe any goal in plain language and the app instantly generates a
            personalised, step-by-step to-do list you can act on today.
            No account, no email, no ads. All data stays in your browser.
          </p>

          <h2>How it works</h2>
          <ol>
            <li>Go to untangle.lol and type your goal — for example "I want to sleep better" or "I want to learn to code".</li>
            <li>The AI (powered by Claude via Anthropic or OpenRouter) generates a numbered action plan with 3 to 5 concrete, doable steps.</li>
            <li>Check off each step as you complete it. Progress is saved automatically in your browser.</li>
            <li>Come back any time to review past goals or start a new one.</li>
          </ol>

          <h2>Key features</h2>
          <ul>
            <li>AI-generated to-do lists and action plans from a single sentence goal</li>
            <li>Step-by-step task breakdown with progress tracking</li>
            <li>No account or sign-up required</li>
            <li>Completely private — zero data sent to untangle.lol servers</li>
            <li>Free to use with your own Anthropic or OpenRouter API key</li>
            <li>Available in 15 languages: English, Dutch, German, French, Spanish, Arabic, Bengali, Hindi, Indonesian, Japanese, Portuguese, Russian, Swahili, Turkish, and Chinese</li>
            <li>Works on any device — mobile, tablet, desktop</li>
            <li>History of past goals saved locally for easy reference</li>
          </ul>

          <h2>Example goals you can untangle</h2>
          <ul>
            <li>I want to run a 5K in 8 weeks</li>
            <li>I want to learn to play guitar</li>
            <li>I want to sleep better and wake up with more energy</li>
            <li>I want to eat healthier without going on a strict diet</li>
            <li>I want to learn Spanish in 3 months</li>
            <li>I want to start meditating every day</li>
            <li>I want to write a book</li>
            <li>I want to get better at managing my time</li>
            <li>I want to save more money each month</li>
            <li>I want to build a morning routine</li>
          </ul>

          <h2>Who is untangle.lol for?</h2>
          <p>
            Untangle.lol is for anyone who has a goal but is not sure where to start.
            It is ideal for people who feel overwhelmed by big ambitions, who struggle
            with procrastination, or who want a smarter alternative to a blank to-do list.
            It is especially useful for personal development, health and fitness goals,
            learning new skills, and productivity improvement.
          </p>

          <h2>Privacy and data</h2>
          <p>
            Untangle.lol does not collect any personal data. Your goals, to-do lists,
            progress, and API key are stored only in your own browser&apos;s localStorage.
            Nothing is transmitted to untangle.lol&apos;s servers. Your API key is sent
            directly from your browser to Anthropic or OpenRouter and never touches
            untangle.lol&apos;s infrastructure.
          </p>

          <h2>Pricing</h2>
          <p>
            Untangle.lol is free. It uses a bring-your-own-key (BYOK) model.
            You provide your own Anthropic or OpenRouter API key.
            A typical AI-generated to-do list costs less than $0.01 in API usage.
            There are no subscriptions, no paywalls, and no ads.
          </p>

          <h2>Supported languages</h2>
          <p>English, Dutch (Nederlands), German (Deutsch), French (Français), Spanish (Español), Arabic (العربية), Bengali (বাংলা), Hindi (हिन्दी), Indonesian (Bahasa Indonesia), Japanese (日本語), Portuguese (Português), Russian (Русский), Swahili (Kiswahili), Turkish (Türkçe), Chinese (中文).</p>
        </div>

        {children}

        <noscript>
          <div style={{ fontFamily: "sans-serif", maxWidth: "640px", margin: "40px auto", padding: "0 24px" }}>
            <h1>Untangle.lol — Free AI To-Do List &amp; Goal Planner</h1>
            <p>Turn any goal into a clear, step-by-step to-do list in seconds using AI. Free, private, no account needed.</p>
            <p>Please enable JavaScript to use this app.</p>
          </div>
        </noscript>
      </body>
    </html>
  );
}
