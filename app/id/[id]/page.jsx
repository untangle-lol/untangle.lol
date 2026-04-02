export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getShare } from "../../lib/shares.js";

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
  const title = `${steps.titel} — Action Plan | untangle.lol`;
  const description = `Free step-by-step action plan: "${steps.titel}". ${numSteps} actionable steps created with untangle.lol, the free AI goal planner.`;
  const url = `https://untangle.lol/id/${params.id}`;
  return {
    title,
    description,
    // Only index guest (anonymous) plans — logged-in user plans stay private
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
  const url = `https://untangle.lol/id/${params.id}`;
  const numSteps = steps.stappen?.length || 0;
  const description = `Free step-by-step action plan: "${steps.titel}". ${numSteps} actionable steps created with untangle.lol.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: steps.titel,
    description,
    url,
    inLanguage: htmlLang,
    ...(createdAt ? { dateCreated: new Date(createdAt).toISOString() } : {}),
    author: {
      "@type": "Organization",
      name: "untangle.lol",
      url: "https://untangle.lol",
    },
    publisher: {
      "@type": "Organization",
      name: "untangle.lol",
      url: "https://untangle.lol",
    },
    step: (steps.stappen || []).map((s, i) => ({
      "@type": "HowToStep",
      position: String(i + 1),
      name: s.actie,
      text: s.toelichting || s.actie,
    })),
  };

  return (
    <html lang={htmlLang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{steps.titel} — untangle</title>
        <meta name="description" content={description} />
        <meta name="geo.region" content="NL" />
        <meta name="geo.country" content="NL" />
        <meta name="geo.placename" content="Netherlands" />
        <link rel="canonical" href={url} />
        {guest && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;min-height:100dvh;padding:24px 16px 48px}
          .wrap{max-width:540px;margin:0 auto}
          .logo{display:flex;flex-direction:column;align-items:flex-start;gap:2px;margin-bottom:28px;text-decoration:none}
          .logo-icon{font-size:32px;line-height:1}
          .logo-name{font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#1e293b;line-height:1}
          .logo-tld{font-size:9px;font-weight:500;letter-spacing:0.15em;color:#94a3b8;text-transform:uppercase}
          h1{font-size:22px;font-weight:700;color:#1e293b;margin-bottom:20px;line-height:1.3}
          .step{display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.07);border:1px solid rgba(0,0,0,0.08)}
          .num{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:#b45309;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
          .actie{font-size:15px;font-weight:600;color:#1e293b;margin-bottom:3px}
          .toelichting{font-size:13px;color:#64748b;line-height:1.5}
          .cta{display:block;margin-top:28px;text-align:center;background:#b45309;color:#fff;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;text-decoration:none}
          .cta:hover{opacity:0.88}
          .footer{margin-top:16px;text-align:center;font-size:12px;color:#94a3b8}
          @media(prefers-color-scheme:dark){
            body{background:#0f172a;color:#f1f5f9}
            .logo-name{color:#f1f5f9}
            .logo-tld{color:#475569}
            h1{color:#f1f5f9}
            .step{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);box-shadow:none}
            .num{background:#facc15;color:#0f172a}
            .actie{color:#f1f5f9}
            .toelichting{color:#94a3b8}
            .cta{background:#facc15;color:#0f172a}
            .footer{color:#475569}
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <a href="https://untangle.lol" className="logo">
            <span className="logo-icon">🪢</span>
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
          <a href="https://untangle.lol" className="cta">Create your own free plan →</a>
          <p className="footer">Generated with untangle.lol — free AI goal planner</p>
        </div>
      </body>
    </html>
  );
}
