import Link from "next/link";
import { DONATE_CONTENT } from "../../lib/data/donate.js";
import { notFound } from "next/navigation";

const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

const LANG_LOCALE = {
  en: "en_US", nl: "nl_NL", de: "de_DE", fr: "fr_FR", es: "es_ES",
  pt: "pt_PT", ar: "ar_SA", bn: "bn_BD", hi: "hi_IN", id: "id_ID",
  ja: "ja_JP", ru: "ru_RU", sw: "sw_KE", tr: "tr_TR", zh: "zh_CN",
};

const LANG_TITLE = {
  en: "Support untangle.lol — Free AI Goal Planner",
  nl: "Steun untangle.lol — Gratis AI doelplanner",
  de: "untangle.lol unterstützen — Kostenloser KI-Zielplaner",
  fr: "Soutenir untangle.lol — Planificateur d'objectifs IA gratuit",
  es: "Apoya untangle.lol — Planificador de metas con IA gratis",
  pt: "Apoie untangle.lol — Planejador de metas com IA gratuito",
  ar: "ادعم untangle.lol — مخطط الأهداف بالذكاء الاصطناعي مجانًا",
  bn: "untangle.lol সমর্থন করুন — বিনামূল্যে AI লক্ষ্য পরিকল্পনাকারী",
  hi: "untangle.lol को सपोर्ट करें — मुफ़्त AI लक्ष्य योजनाकार",
  id: "Dukung untangle.lol — Perencana Tujuan AI Gratis",
  ja: "untangle.lolを支援する — 無料AIゴールプランナー",
  ru: "Поддержите untangle.lol — Бесплатный ИИ-планировщик целей",
  sw: "Saidia untangle.lol — Mpangilio wa Malengo wa AI bila Malipo",
  tr: "untangle.lol'u Destekle — Ücretsiz Yapay Zeka Hedef Planlayıcı",
  zh: "支持 untangle.lol — 免费 AI 目标规划工具",
};

const LANG_DESC = {
  en: "Support the development of untangle.lol, a free, private, AI-powered to-do list and goal planner available in 15 languages.",
  nl: "Steun de ontwikkeling van untangle.lol, een gratis, privé AI-takenlijst en doelplanner beschikbaar in 15 talen.",
  de: "Unterstütze die Entwicklung von untangle.lol, einem kostenlosen, privaten, KI-gestützten Aufgaben- und Zielplaner in 15 Sprachen.",
  fr: "Soutenez le développement d'untangle.lol, un planificateur de tâches et d'objectifs IA gratuit et privé disponible en 15 langues.",
  es: "Apoya el desarrollo de untangle.lol, un planificador de tareas y metas con IA, gratuito y privado, disponible en 15 idiomas.",
  pt: "Apoie o desenvolvimento do untangle.lol, um planejador de tarefas e metas com IA, gratuito e privado, disponível em 15 idiomas.",
  ar: "ادعم تطوير untangle.lol، مخطط مهام وأهداف بالذكاء الاصطناعي، مجاني وخاص، متوفر بـ 15 لغة.",
  bn: "untangle.lol-এর উন্নয়নে সহায়তা করুন — ১৫টি ভাষায় উপলব্ধ একটি বিনামূল্যে, ব্যক্তিগত AI লক্ষ্য পরিকল্পনাকারী।",
  hi: "untangle.lol के विकास का समर्थन करें — 15 भाषाओं में उपलब्ध एक मुफ़्त, निजी AI लक्ष्य योजनाकार।",
  id: "Dukung pengembangan untangle.lol, perencana tugas dan tujuan bertenaga AI yang gratis, privat, dan tersedia dalam 15 bahasa.",
  ja: "15言語対応の無料・プライベートなAI目標・タスクプランナー、untangle.lolの開発を支援してください。",
  ru: "Поддержите разработку untangle.lol — бесплатного приватного ИИ-планировщика задач и целей на 15 языках.",
  sw: "Saidia maendeleo ya untangle.lol, mpangilio wa kazi na malengo wa AI, bure na faragha, unaopatikana katika lugha 15.",
  tr: "15 dilde kullanılabilen ücretsiz, gizli, yapay zeka destekli görev ve hedef planlayıcısı untangle.lol'un gelişimini destekleyin.",
  zh: "支持 untangle.lol 的开发——一款免费、私密、支持 15 种语言的 AI 目标与任务规划工具。",
};

export async function generateStaticParams() {
  return LANGS.map(lang => ({ lang }));
}

export async function generateMetadata({ params }) {
  const lang = LANGS.includes(params.lang) ? params.lang : "en";
  const title = LANG_TITLE[lang];
  const description = LANG_DESC[lang];
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://untangle.lol/donate/${lang}`,
      languages: {
        "x-default": "https://untangle.lol/donate",
        ...Object.fromEntries(LANGS.map(l => [l, `https://untangle.lol/donate/${l}`])),
      },
    },
    openGraph: {
      type: "website",
      url: `https://untangle.lol/donate/${lang}`,
      siteName: "untangle.lol",
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
      locale: LANG_LOCALE[lang] ?? "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function DonateLangPage({ params }) {
  const lang = LANGS.includes(params.lang) ? params.lang : null;
  if (!lang) notFound();
  const d = DONATE_CONTENT[lang] || DONATE_CONTENT.en;

  return (
    <div dir={d.dir || "ltr"} style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh", color: "#111" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 15, color: "#111", textDecoration: "none", letterSpacing: "-0.03em" }}>
          untangle<span style={{ color: "#6b7280", fontWeight: 400 }}>.lol</span>
        </Link>
        <span style={{ color: "#d1d5db" }}>·</span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{d.label}</span>
      </nav>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px 64px" }}>
        {/* Hero */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", margin: "0 0 8px" }}>{d.tagline}</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{d.title}</h1>
        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, margin: "0 0 28px", paddingBottom: 24, borderBottom: "1px solid #e5e7eb" }}>{d.hero}</p>

        {/* Mission */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>{d.missionTitle}</h2>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: 0, padding: "14px 16px", background: "#eff6ff", borderLeft: "3px solid #2563eb", borderRadius: "0 8px 8px 0" }}>{d.mission}</p>
        </section>

        {/* Why */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>{d.whyTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {d.why.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#2563eb", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.65 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>{d.howTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {d.how.map((item, i) => (
              <div key={i} style={{ padding: "14px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <blockquote style={{ margin: "0 0 24px", textAlign: "center", padding: "18px 20px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: "#111", lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>"{d.quote}"</p>
        </blockquote>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "24px 20px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 6px", letterSpacing: "-0.02em" }}>{d.ctaTitle}</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{d.ctaDesc}</p>
          <a href={d.ctaUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 10, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", letterSpacing: "-0.01em" }}>
            ♥ {d.ctaBtn}
          </a>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 1.65 }}>{d.footer}</p>

        {/* Back to app */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>← {lang === "nl" ? "Terug naar de app" : lang === "de" ? "Zurück zur App" : lang === "fr" ? "Retour à l'appli" : lang === "es" ? "Volver a la app" : "Back to the app"}</Link>
        </div>
      </main>
    </div>
  );
}
