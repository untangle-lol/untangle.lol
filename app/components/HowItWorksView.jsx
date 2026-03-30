"use client";
import { HOWTO } from "../lib/data/howto.js";

const STEP_ICONS = [
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14A2.5 2.5 0 0 0 14.5 2"/></svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
];

const WOOP_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

export default function HowItWorksView({ lang, c, sx, t, dir, onBack, onStart }) {
  const d = HOWTO[lang] || HOWTO.en;
  const pageDir = d.dir || dir;

  return (
    <div dir={pageDir} style={{ ...sx.pg, paddingTop: "calc(64px + env(safe-area-inset-top))" }}>
      <div className="uw" style={sx.w}>
        <div style={sx.cd}>
          {/* Title */}
          <h1 style={{ fontSize: 20, fontWeight: 800, color: c.tx, margin: "0 0 6px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{d.title}</h1>
          <p style={{ fontSize: 13, color: c.tm, margin: "0 0 20px", lineHeight: 1.6, paddingBottom: 16, borderBottom: "1px solid " + c.cb }}>{d.subtitle}</p>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            {d.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: c.sb, border: "1px solid " + c.sr, borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.ab, border: "1px solid " + c.abr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.ac }}>
                  {STEP_ICONS[i]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.tx, marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: c.tm, lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* WOOP */}
          <div style={{ padding: "12px 14px", background: c.hp || c.ab, border: "1px solid " + (c.hpr || c.abr), borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.ab, border: "1px solid " + c.abr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.ac }}>
              {WOOP_ICON}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.tx, marginBottom: 3 }}>{d.woop.title}</div>
              <div style={{ fontSize: 13, color: c.tm, lineHeight: 1.6 }}>{d.woop.desc}</div>
            </div>
          </div>

          {/* CTA */}
          <button onClick={onStart} style={sx.bo}>{d.cta}</button>
          <button onClick={onBack} style={{ ...sx.bg, marginTop: 8 }}>{t.back}</button>
        </div>
      </div>
    </div>
  );
}
