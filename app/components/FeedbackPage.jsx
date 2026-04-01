"use client";
import { useState, useRef, useEffect } from "react";

function collectDeviceInfo() {
  try {
    const ua = navigator.userAgent;
    const browser =
      /Edg\//.test(ua)                           ? "Edge"    :
      /OPR\/|Opera/.test(ua)                     ? "Opera"   :
      /Chrome\//.test(ua)                        ? "Chrome"  :
      /Firefox\//.test(ua)                       ? "Firefox" :
      /Safari\//.test(ua) && !/Chrome/.test(ua)  ? "Safari"  :
      "Other";
    const os =
      /Windows NT 10/.test(ua) ? "Windows 10/11"   :
      /Windows NT 6/.test(ua)  ? "Windows (older)" :
      /Mac OS X/.test(ua)      ? "macOS"            :
      /Android/.test(ua)       ? "Android"          :
      /iPhone|iPad/.test(ua)   ? "iOS"              :
      /Linux/.test(ua)         ? "Linux"            :
      "Unknown OS";
    return { browser, os, screen:`${screen.width}×${screen.height}`, viewport:`${window.innerWidth}×${window.innerHeight}`, dpr:window.devicePixelRatio, language:navigator.language, timezone:Intl.DateTimeFormat().resolvedOptions().timeZone };
  } catch { return {}; }
}

export default function FeedbackPage({ c, sx, t, dir, onBack }) {
  const [text,   setText]   = useState("");
  const [status, setStatus] = useState("idle");
  const taRef = useRef(null);

  useEffect(() => { taRef.current?.focus(); }, []);

  async function submit() {
    if (!text.trim() || status === "sending" || status === "capturing") return;
    setStatus("capturing");
    let screenshot = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.documentElement, { scale:0.5, useCORS:true, allowTaint:true, logging:false, removeContainer:true });
      screenshot = canvas.toDataURL("image/jpeg", 0.65);
    } catch {}
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: text.trim(), page: window.location.href, deviceInfo: collectDeviceInfo(), screenshot }),
      });
      if (res.ok) {
        setStatus("sent");
        setTimeout(() => { setText(""); setStatus("idle"); }, 2000);
      } else {
        setStatus("error");
      }
    } catch { setStatus("error"); }
  }

  const busy = status === "capturing" || status === "sending";
  const btnLabel = busy ? "…" : status === "sent" ? ("✓ " + (t.fbSent||"Received, thanks!").split(",")[0]) : (t.fbSend||"Send");

  return (
    <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 10px"}}>{t.fbTitle||"Feedback"}</h1>
        <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:0,maxWidth:420,marginLeft:"auto",marginRight:"auto"}}>{t.fbPageDesc||"Something not working, or have a suggestion? We read every message and use your feedback to make untangle.lol better for everyone."}</p>
      </div>
      <div style={sx.cd}>
        <textarea
          ref={taRef}
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))submit(); }}
          placeholder={t.fbPh||"Something broken or a suggestion? Tell us…"}
          rows={6}
          disabled={busy||status==="sent"}
          style={{...sx.ip,fontSize:14,lineHeight:1.6,resize:"vertical",fontFamily:"inherit",minHeight:120,opacity:busy?0.6:1}}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,gap:8}}>
          <span style={{fontSize:11,color:c.tf}}>
            {status==="error"
              ? <span style={{color:c.et||"#ef4444"}}>{t.fbErr||"Failed — try again"}</span>
              : status==="sent"
              ? <span style={{color:c.gr||"#22c55e"}}>{t.fbSent||"Received, thanks!"}</span>
              : <span>{t.fbHint||"⌘↵ to send"}</span>}
          </span>
          <button
            onClick={submit}
            disabled={busy||!text.trim()||status==="sent"}
            style={{...sx.bo,marginTop:0,width:"auto",padding:"10px 24px",opacity:(!text.trim()||busy)?0.5:1,transition:"opacity 0.15s,filter 0.15s",minWidth:80,textAlign:"center",whiteSpace:"nowrap"}}
          >{btnLabel}</button>
        </div>
      </div>
      <button onClick={onBack} style={sx.bg}><span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>{t.back||"Back"}</span></button>
    </div></div>
  );
}
