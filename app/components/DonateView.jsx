"use client";
import { useState } from "react";
import { DONATE_CONTENT } from "../lib/data/donate.js";

const DONATE_LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

const HOW_ICONS = {
  server: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  ai: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/></svg>,
  dev: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
};

export default function DonateView({ lang, c, sx, t, dir, onBack }) {
  const fallback = DONATE_LANGS.includes(lang) ? lang : "en";
  const [viewLang, setViewLang] = useState(fallback);
  const d = DONATE_CONTENT[viewLang] || DONATE_CONTENT.en;

  return (
    <div dir={d.dir||dir} style={{...sx.pg,paddingTop:"calc(64px + env(safe-area-inset-top))"}}><div className="uw" style={sx.w}>
      {/* Lang switcher */}
      <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
        {DONATE_LANGS.map(l=>(
          <button key={l} onClick={()=>setViewLang(l)} style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:l===viewLang?c.ab:"transparent",color:l===viewLang?c.ac:c.tf,border:"1px solid "+(l===viewLang?c.abr:c.cb),cursor:"pointer",letterSpacing:"0.05em",fontFamily:"inherit"}}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={sx.cd}>
        {/* Hero */}
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:c.ac,margin:"0 0 8px"}}>{d.tagline}</p>
        <h1 style={{fontSize:20,fontWeight:800,color:c.tx,margin:"0 0 10px",lineHeight:1.2,letterSpacing:"-0.02em"}}>{d.title}</h1>
        <p style={{fontSize:13,color:c.tm,lineHeight:1.7,margin:"0 0 18px",paddingBottom:16,borderBottom:"1px solid "+c.cb}}>{d.hero}</p>

        {/* Mission */}
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:c.tf,marginBottom:8}}>{d.missionTitle}</h2>
          <p style={{fontSize:13,color:c.tm,lineHeight:1.75,margin:0,padding:"14px 16px",background:c.ab,borderLeft:"3px solid "+c.ac,borderRadius:"0 8px 8px 0"}}>{d.mission}</p>
        </div>

        {/* Why */}
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:c.tf,marginBottom:8}}>{d.whyTitle}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {d.why.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",background:c.card,border:"1px solid "+c.cb,borderRadius:8}}>
                <div style={{width:18,height:18,borderRadius:5,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,color:c.ac,fontSize:10,fontWeight:800}}>{i+1}</div>
                <p style={{margin:0,fontSize:12,color:c.tm,lineHeight:1.6}}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How */}
        <div style={{marginBottom:18}}>
          <h2 style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:c.tf,marginBottom:8}}>{d.howTitle}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:6}}>
            {d.how.map((item,i)=>(
              <div key={i} style={{padding:"12px 10px",background:c.card,border:"1px solid "+c.cb,borderRadius:8,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{color:c.ac}}>{HOW_ICONS[item.icon]}</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:c.tx,marginBottom:2}}>{item.label}</div>
                  <div style={{fontSize:10,color:c.tf,lineHeight:1.5}}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{marginBottom:18,textAlign:"center",padding:"16px 20px",background:c.ab,border:"1px solid "+c.abr,borderRadius:12}}>
          <p style={{fontSize:13,color:c.tx,lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{d.quote}"</p>
        </div>

        {/* CTA */}
        <div style={{textAlign:"center",padding:"20px 16px",background:c.card,border:"1px solid "+c.cb,borderRadius:12}}>
          <h2 style={{fontSize:16,fontWeight:800,color:c.tx,margin:"0 0 4px",letterSpacing:"-0.02em"}}>{d.ctaTitle}</h2>
          <p style={{fontSize:12,color:c.tf,marginBottom:14}}>{d.ctaDesc}</p>
          <a href={d.ctaUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"12px 24px",borderRadius:10,background:c.ag,color:c.bt,fontWeight:800,fontSize:14,textDecoration:"none",letterSpacing:"-0.01em",fontFamily:"inherit"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {d.ctaBtn}
          </a>
        </div>

        {/* Footer note */}
        <p style={{fontSize:11,color:c.tf,textAlign:"center",marginTop:14,lineHeight:1.6}}>{d.footer}</p>
      </div>

      <button onClick={onBack} style={{...sx.bg,marginTop:8}}><span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>{t.back||"Back"}</span></button>
    </div></div>
  );
}
