import Link from "next/link";

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
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}
          .wrap{max-width:420px;width:100%;text-align:center}
          .icon{font-size:56px;line-height:1;margin-bottom:20px}
          h1{font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#1e293b;margin-bottom:8px}
          p{font-size:15px;color:#64748b;line-height:1.6;margin-bottom:28px}
          .cta{display:inline-flex;align-items:center;gap:8px;background:#b45309;color:#fff;font-size:15px;font-weight:600;padding:13px 24px;border-radius:12px;text-decoration:none;transition:opacity 0.15s}
          .cta:hover{opacity:0.88}
          .hint{margin-top:16px;font-size:12px;color:#94a3b8}
          @media(prefers-color-scheme:dark){
            body{background:#0f172a;color:#f1f5f9}
            h1{color:#f1f5f9}
            p{color:#94a3b8}
            .cta{background:#facc15;color:#0f172a}
            .hint{color:#475569}
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="icon">🪢</div>
          <h1>Plan not found</h1>
          <p>This plan may have expired or the link is incorrect.<br />Plans are available for 30 days after creation.</p>
          <a href="https://untangle.lol" className="cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create your own plan
          </a>
          <p className="hint">untangle.lol — free AI goal planner</p>
        </div>
      </body>
    </html>
  );
}
