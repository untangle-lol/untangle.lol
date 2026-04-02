export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getShare } from "../../lib/shares.js";

const I18N = {
  nl: { ctaTitle:"Maak je eigen gratis AI-actieplan", ctaSub:"Typ een doel en krijg een helder stappenplan in seconden. Gratis, privé, geen account nodig.", ctaBtn:"Probeer untangle.lol — gratis", expiry:"Plannen verlopen na 30 dagen" },
  en: { ctaTitle:"Create your own free AI action plan", ctaSub:"Type any goal and get a clear, step-by-step plan in seconds. Free, private, no account needed.", ctaBtn:"Try untangle.lol — it's free", expiry:"Plans expire after 30 days" },
  de: { ctaTitle:"Erstelle deinen eigenen kostenlosen KI-Aktionsplan", ctaSub:"Gib ein Ziel ein und erhalte in Sekunden einen klaren Schritt-für-Schritt-Plan. Kostenlos, privat, kein Konto nötig.", ctaBtn:"untangle.lol ausprobieren — kostenlos", expiry:"Pläne laufen nach 30 Tagen ab" },
  fr: { ctaTitle:"Crée ton propre plan d'action IA gratuit", ctaSub:"Décris un objectif et obtiens un plan étape par étape en quelques secondes. Gratuit, privé, sans compte.", ctaBtn:"Essayer untangle.lol — c'est gratuit", expiry:"Les plans expirent après 30 jours" },
  es: { ctaTitle:"Crea tu propio plan de acción con IA gratis", ctaSub:"Escribe cualquier objetivo y obtén un plan paso a paso en segundos. Gratis, privado, sin cuenta.", ctaBtn:"Prueba untangle.lol — es gratis", expiry:"Los planes caducan después de 30 días" },
  pt: { ctaTitle:"Crie o seu plano de ação com IA gratuitamente", ctaSub:"Digite qualquer objetivo e obtenha um plano passo a passo em segundos. Grátis, privado, sem conta.", ctaBtn:"Experimentar untangle.lol — é grátis", expiry:"Os planos expiram após 30 dias" },
  ar: { ctaTitle:"أنشئ خطة عمل ذكاء اصطناعي مجانية", ctaSub:"اكتب أي هدف واحصل على خطة خطوة بخطوة في ثوانٍ. مجاني، خاص، لا حاجة لحساب.", ctaBtn:"جرّب untangle.lol — مجاناً", expiry:"تنتهي صلاحية الخطط بعد 30 يوماً" },
  bn: { ctaTitle:"আপনার নিজের বিনামূল্যে AI অ্যাকশন প্ল্যান তৈরি করুন", ctaSub:"যেকোনো লক্ষ্য লিখুন এবং সেকেন্ডে একটি স্পষ্ট পদক্ষেপ পরিকল্পনা পান। বিনামূল্যে, ব্যক্তিগত, কোনো অ্যাকাউন্ট নেই।", ctaBtn:"untangle.lol চেষ্টা করুন — বিনামূল্যে", expiry:"পরিকল্পনা ৩০ দিন পরে মেয়াদ শেষ হয়" },
  hi: { ctaTitle:"अपना मुफ्त AI एक्शन प्लान बनाएं", ctaSub:"कोई भी लक्ष्य लिखें और सेकंड में एक स्पष्ट चरण-दर-चरण योजना पाएं। मुफ्त, निजी, खाते की जरूरत नहीं।", ctaBtn:"untangle.lol आज़माएं — मुफ्त", expiry:"योजनाएं 30 दिनों के बाद समाप्त होती हैं" },
  id: { ctaTitle:"Buat rencana aksi AI gratismu sendiri", ctaSub:"Ketik tujuan apa saja dan dapatkan rencana langkah demi langkah dalam detik. Gratis, privat, tanpa akun.", ctaBtn:"Coba untangle.lol — gratis", expiry:"Rencana kedaluwarsa setelah 30 hari" },
  ja: { ctaTitle:"無料のAIアクションプランを作ろう", ctaSub:"目標を入力するだけで、数秒で明確なステップバイステッププランが得られます。無料・プライベート・アカウント不要。", ctaBtn:"untangle.lolを試す — 無料", expiry:"プランは30日後に期限切れになります" },
  ru: { ctaTitle:"Создайте свой бесплатный план действий с ИИ", ctaSub:"Напишите любую цель и получите чёткий пошаговый план за секунды. Бесплатно, конфиденциально, без аккаунта.", ctaBtn:"Попробовать untangle.lol — бесплатно", expiry:"Планы истекают через 30 дней" },
  sw: { ctaTitle:"Unda mpango wako wa hatua wa AI bure", ctaSub:"Andika lengo lolote na upate mpango wa hatua kwa hatua kwa sekunde. Bure, faragha, bila akaunti.", ctaBtn:"Jaribu untangle.lol — ni bure", expiry:"Mipango inaisha baada ya siku 30" },
  tr: { ctaTitle:"Kendi ücretsiz AI eylem planını oluştur", ctaSub:"Herhangi bir hedef yaz ve saniyeler içinde net, adım adım bir plan al. Ücretsiz, özel, hesap gerekmez.", ctaBtn:"untangle.lol'u dene — ücretsiz", expiry:"Planlar 30 gün sonra sona erer" },
  zh: { ctaTitle:"创建你自己的免费 AI 行动计划", ctaSub:"输入任何目标，几秒内获得清晰的分步计划。免费、私密、无需账户。", ctaBtn:"试试 untangle.lol — 免费", expiry:"计划在 30 天后过期" },
};

export async function generateMetadata({ params }) {
  const share = getShare(params.id);
  if (!share) {
    return {
      title: "Plan not found — untangle.lol",
      robots: { index: false, follow: false },
    };
  }
  const { steps, guest } = share;
  const numSteps = steps.stappen?.length || 0;
  const title = `${steps.titel} | untangle.lol`;
  const description = `${steps.titel} — ${numSteps} actionable steps. Created with untangle.lol, the free AI goal planner.`;
  const url = `https://untangle.lol/id/${params.id}`;
  return {
    title,
    description,
    robots: guest ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "untangle.lol",
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function PlanPage({ params }) {
  const share = getShare(params.id);
  if (!share) notFound();

  const { steps, lang, createdAt, guest } = share;
  const htmlLang = (lang || "en").split("-")[0];
  const i18n = I18N[htmlLang] || I18N.en;
  const url = `https://untangle.lol/id/${params.id}`;
  const numSteps = steps.stappen?.length || 0;
  const description = `${steps.titel} — ${numSteps} actionable steps. Created with untangle.lol, the free AI goal planner.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: steps.titel,
    description,
    url,
    inLanguage: htmlLang,
    ...(createdAt ? { dateCreated: new Date(createdAt).toISOString() } : {}),
    author: { "@type": "Organization", name: "untangle.lol", url: "https://untangle.lol" },
    publisher: { "@type": "Organization", name: "untangle.lol", url: "https://untangle.lol" },
    step: (steps.stappen || []).map((s, i) => ({
      "@type": "HowToStep",
      position: String(i + 1),
      name: s.actie,
      text: s.toelichting || s.actie,
    })),
  };

  const dir = htmlLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={htmlLang} dir={dir}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{steps.titel} | untangle.lol</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
        {guest && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          :root{
            --bg:linear-gradient(135deg,#f8fafc,#e2e8f0,#f8fafc);
            --tx:#1e293b;--tm:#64748b;--tf:#94a3b8;
            --ac:#b45309;
            --card:#ffffff;--cb:rgba(0,0,0,0.08);
            --sh:0 2px 8px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04);
            --num-bg:#b45309;--num-tx:#ffffff;
            --cta-bg:#b45309;--cta-tx:#ffffff;
          }
          @media(prefers-color-scheme:dark){
            :root{
              --bg:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);
              --tx:#f1f5f9;--tm:#94a3b8;--tf:#64748b;
              --ac:#facc15;
              --card:rgba(255,255,255,0.055);--cb:rgba(255,255,255,0.1);
              --sh:none;
              --num-bg:#facc15;--num-tx:#0f172a;
              --cta-bg:#facc15;--cta-tx:#0f172a;
            }
          }
          body{
            font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            background:var(--bg);color:var(--tx);
            min-height:100dvh;padding:24px 16px 64px;
            -webkit-font-smoothing:antialiased;
          }
          .wrap{max-width:540px;margin:0 auto}
          .logo{display:inline-flex;align-items:center;gap:8px;margin-bottom:32px;text-decoration:none;color:inherit}
          .logo-icon{color:var(--ac);filter:drop-shadow(0 0 10px color-mix(in srgb,var(--ac) 40%,transparent));line-height:0}
          .logo-name{font-size:20px;font-weight:800;letter-spacing:-0.03em;color:var(--tx)}
          .logo-tld{font-size:11px;font-weight:500;letter-spacing:0.1em;color:var(--tf);text-transform:uppercase;margin-top:1px}
          h1{font-size:22px;font-weight:700;color:var(--tx);margin-bottom:20px;line-height:1.3;letter-spacing:-0.02em}
          @media(min-width:640px){h1{font-size:28px}}
          .step{
            display:flex;gap:14px;align-items:flex-start;
            background:var(--card);border-radius:14px;
            padding:14px 16px;margin-bottom:10px;
            box-shadow:var(--sh);border:1px solid var(--cb);
          }
          .num{
            flex-shrink:0;width:28px;height:28px;border-radius:50%;
            background:var(--num-bg);color:var(--num-tx);
            font-size:12px;font-weight:700;
            display:flex;align-items:center;justify-content:center;margin-top:1px;
          }
          .actie{font-size:15px;font-weight:600;color:var(--tx);margin-bottom:4px;line-height:1.4}
          .toelichting{font-size:13px;color:var(--tm);line-height:1.55}
          .cta-box{
            margin-top:32px;padding:24px;
            background:var(--card);border-radius:16px;
            border:1px solid var(--cb);box-shadow:var(--sh);text-align:center;
          }
          .cta-title{font-size:17px;font-weight:700;color:var(--tx);margin-bottom:6px;letter-spacing:-0.02em}
          .cta-sub{font-size:13px;color:var(--tm);margin-bottom:18px;line-height:1.5}
          .cta-btn{
            display:inline-flex;align-items:center;gap:8px;
            background:var(--cta-bg);color:var(--cta-tx);
            font-family:'DM Sans',-apple-system,sans-serif;
            font-size:15px;font-weight:700;
            padding:13px 24px;border-radius:12px;
            text-decoration:none;transition:opacity 0.15s;letter-spacing:-0.01em;
          }
          .cta-btn:hover{opacity:0.88}
          .footer{margin-top:20px;text-align:center;font-size:12px;color:var(--tf)}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <a href="https://untangle.lol" className="logo">
            <span className="logo-icon">
              <svg width="32" height="20" viewBox="0 0 52 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:"block"}}>
                <path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/>
              </svg>
            </span>
            <span className="logo-name">untangle</span>
            <span className="logo-tld">.lol</span>
          </a>

          <h1>{steps.titel}</h1>

          {(steps.stappen || []).map((s, i) => (
            <div key={i} className="step">
              <div className="num">{i + 1}</div>
              <div>
                <div className="actie">{s.actie}</div>
                {s.toelichting && <div className="toelichting">{s.toelichting}</div>}
              </div>
            </div>
          ))}

          <div className="cta-box">
            <div className="cta-title">{i18n.ctaTitle}</div>
            <div className="cta-sub">{i18n.ctaSub}</div>
            <a href="https://untangle.lol" className="cta-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {i18n.ctaBtn}
            </a>
          </div>

          <p className="footer">{i18n.expiry} · untangle.lol</p>
        </div>
      </body>
    </html>
  );
}
