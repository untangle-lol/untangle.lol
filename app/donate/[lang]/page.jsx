import { redirect } from "next/navigation";

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

export default function DonateLangPage() {
  redirect("/#donate");
}
