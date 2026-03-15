export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getShare } from "../../lib/shares.js";

export default async function SharePage({ params }) {
  const share = getShare(params.id);
  if (!share) notFound();

  const { steps } = share;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{steps.titel} — untangle</title>
        <meta name="description" content={`Action plan: ${steps.titel}`} />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:#1c1c1e;min-height:100dvh;padding:24px 16px 48px}
          .wrap{max-width:540px;margin:0 auto}
          .logo{font-size:13px;font-weight:700;color:#888;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:24px}
          h1{font-size:22px;font-weight:700;color:#1c1c1e;margin-bottom:20px;line-height:1.3}
          .step{display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.07)}
          .num{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:#007aff;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
          .actie{font-size:15px;font-weight:600;color:#1c1c1e;margin-bottom:3px}
          .toelichting{font-size:13px;color:#555;line-height:1.5}
          .cta{display:block;margin-top:28px;text-align:center;background:#007aff;color:#fff;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;text-decoration:none}
          .cta:hover{background:#0066d6}
          .footer{margin-top:16px;text-align:center;font-size:12px;color:#aaa}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="logo">untangle</div>
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
          <a href="https://untangle.lol" className="cta">Create your own plan →</a>
          <p className="footer">Plans expire after 30 days</p>
        </div>
      </body>
    </html>
  );
}
