export const metadata = {
  title: "Page not found — untangle.lol",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          :root{
            --bg:linear-gradient(135deg,#f8fafc,#e2e8f0,#f8fafc);
            --tx:#1e293b;--tm:#64748b;--tf:#94a3b8;
            --ac:#b45309;
            --card:#ffffff;--cb:rgba(0,0,0,0.08);
            --sh:0 2px 8px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04);
            --cta-bg:#b45309;--cta-tx:#ffffff;
          }
          @media(prefers-color-scheme:dark){
            :root{
              --bg:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);
              --tx:#f1f5f9;--tm:#94a3b8;--tf:#64748b;
              --ac:#facc15;
              --card:rgba(255,255,255,0.055);--cb:rgba(255,255,255,0.1);
              --sh:none;
              --cta-bg:#facc15;--cta-tx:#0f172a;
            }
          }
          body{
            font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            background:var(--bg);color:var(--tx);
            min-height:100dvh;display:flex;align-items:center;justify-content:center;
            padding:24px;-webkit-font-smoothing:antialiased;
          }
          .wrap{max-width:480px;width:100%;text-align:center}
          .logo{display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin-bottom:32px;text-decoration:none;color:inherit}
          .logo-icon{color:var(--ac);filter:drop-shadow(0 0 10px color-mix(in srgb,var(--ac) 40%,transparent))}
          .logo-name{font-size:20px;font-weight:800;letter-spacing:-0.03em;color:var(--tx);line-height:1}
          .logo-tld{font-size:9px;font-weight:500;letter-spacing:0.15em;color:var(--tf);text-transform:uppercase}
          h1{font-size:26px;font-weight:800;letter-spacing:-0.03em;color:var(--tx);margin-bottom:10px}
          p{font-size:15px;color:var(--tm);line-height:1.6;margin-bottom:28px}
          .cta{
            display:inline-flex;align-items:center;gap:8px;
            background:var(--cta-bg);color:var(--cta-tx);
            font-family:'DM Sans',-apple-system,sans-serif;
            font-size:15px;font-weight:700;
            padding:13px 24px;border-radius:12px;
            text-decoration:none;transition:opacity 0.15s;
            letter-spacing:-0.01em;
          }
          .cta:hover{opacity:0.88}
          .hint{margin-top:16px;font-size:12px;color:var(--tf)}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <a href="https://untangle.lol" className="logo">
            <span className="logo-icon">
              <svg width="38" height="23" viewBox="0 0 52 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:"block"}}>
                <path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/>
              </svg>
            </span>
            <span className="logo-name">untangle</span>
            <span className="logo-tld">.lol</span>
          </a>

          <h1>Plan not found</h1>
          <p>This plan may have expired or the link is incorrect.<br />Plans are available for 30 days after creation.</p>

          <a href="https://untangle.lol" className="cta">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create your own plan
          </a>
          <p className="hint">untangle.lol — free AI goal planner</p>
        </div>
      </body>
    </html>
  );
}
