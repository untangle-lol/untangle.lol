"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import LANGS from "../lib/langs/index.js";
import FeedbackWidget from "./FeedbackWidget.jsx";
import FeedbackPage from "./FeedbackPage.jsx";
import LegalView from "./LegalView.jsx";
import DonateView from "./DonateView.jsx";
import HowItWorksView from "./HowItWorksView.jsx";

const ALTRUISM_BONUS_CREDITS = 2;

// Umami custom event helper — safe no-op if script hasn't loaded yet
const utrack=(event,data)=>{try{window.umami?.track(event,data);}catch{}};

// ─── Config ──────────────────────────────────────────────────────────────────
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ANTHROPIC   = "claude-sonnet-4-6";
const MODEL_OPENROUTER  = "anthropic/claude-sonnet-4-6";
const PRICE = { input: 3.00, output: 15.00 };
function calcCost(inp,out){ return (inp/1e6)*PRICE.input + (out/1e6)*PRICE.output; }
function fmtCost(usd){ return usd<0.001?"<$0.001":"$"+usd.toFixed(4); }

const ls = {
  get: (k)    => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }        catch {} },
  del: (k)    => { try { localStorage.removeItem(k); }        catch {} },
};

const KEYS = {
  theme:    "untangle_theme",
  dyslexia: "untangle_dyslexia",
  session:  "untangle_session",
  apiKey:   "untangle_apikey",
  recents:  "untangle_recents", // legacy key (not used for new lang-scoped reads)
  guestHist:"untangle_guest_hist",
  usage:    "untangle_usage",
   credits:  "untangle_credits",
   creditsTs: "untangle_credits_ts",
   altruismBonusTs: "untangle_altruism_bonus_ts",
   clientRef:"untangle_client_ref",
};

const recentsKey=(lang)=>"untangle_recents_"+(lang||"nl");

const FREE_CREDITS = 3;
const STRIPE_ENABLED = false; // disabled — set to true to re-enable Stripe payments


function eKey(email) { return "untangle_hist_" + email.toLowerCase().replace(/[^a-z0-9]/g,"_"); }
function acctCreditsKey(email){ return "untangle_credits_acct_"+email.toLowerCase().replace(/[^a-z0-9]/g,"_"); }

function keyProvider(key){ return key?.startsWith("sk-or-")?"openrouter":"anthropic"; }
function getCredential() {
  const key = ls.get(KEYS.apiKey);
  return { key, valid: !!key, provider: key?keyProvider(key):null };
}
function buildHeaders(key) {
  const provider = keyProvider(key);
  if(provider==="openrouter"){
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://untangle.lol",
      "X-Title": "untangle.lol",
    };
  }
  return {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-api-key": key,
  };
}

// Generate a random client reference ID for Stripe fulfillment
function genClientRef() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,"0")).join("");
}


const TH = {
  dark:{bg:"linear-gradient(135deg,#0f172a,#1e293b,#0f172a)",card:"rgba(255,255,255,0.055)",cb:"rgba(255,255,255,0.1)",ib:"rgba(255,255,255,0.06)",ibr:"rgba(255,255,255,0.12)",tx:"#f1f5f9",tm:"#94a3b8",tf:"#64748b",ac:"#facc15",ag:"linear-gradient(135deg,#facc15,#eab308)",ab:"rgba(250,204,21,0.15)",abr:"rgba(250,204,21,0.4)",am:"rgba(250,204,21,0.2)",bt:"#0f172a",gr:"#22c55e",gb:"rgba(34,197,94,0.06)",gbr:"rgba(34,197,94,0.12)",gt:"#6ee7a0",eb:"rgba(239,68,68,0.12)",et:"#fca5a5",ghb:"rgba(255,255,255,0.06)",ghr:"rgba(255,255,255,0.1)",ckb:"rgba(255,255,255,0.06)",ckr:"rgba(255,255,255,0.15)",cm:"#0f172a",dt:"#4a6350",sb:"rgba(255,255,255,0.02)",sr:"rgba(255,255,255,0.06)",dm:"#475569",sh:"none",hp:"rgba(250,204,21,0.08)",hpr:"rgba(250,204,21,0.25)"},
  light:{bg:"linear-gradient(135deg,#f8fafc,#e2e8f0,#f8fafc)",card:"#ffffff",cb:"rgba(0,0,0,0.08)",ib:"#fff",ibr:"rgba(0,0,0,0.15)",tx:"#1e293b",tm:"#64748b",tf:"#94a3b8",ac:"#b45309",ag:"linear-gradient(135deg,#f59e0b,#d97706)",ab:"rgba(245,158,11,0.12)",abr:"rgba(245,158,11,0.4)",am:"rgba(245,158,11,0.15)",bt:"#fff",gr:"#16a34a",gb:"rgba(22,163,74,0.06)",gbr:"rgba(22,163,74,0.15)",gt:"#16a34a",eb:"rgba(239,68,68,0.08)",et:"#dc2626",ghb:"rgba(0,0,0,0.03)",ghr:"rgba(0,0,0,0.1)",ckb:"#fff",ckr:"rgba(0,0,0,0.2)",cm:"#fff",dt:"#4d7c56",sb:"rgba(0,0,0,0.015)",sr:"rgba(0,0,0,0.06)",dm:"#94a3b8",sh:"0 2px 8px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)",hp:"rgba(245,158,11,0.06)",hpr:"rgba(245,158,11,0.2)"},
};

const GS=`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes heroFade{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-6px)}}@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.4);opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}@keyframes modalIn{from{opacity:0;transform:translateY(24px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}.sugg-fading{opacity:0;transition:opacity 0.15s ease}.sugg-list{opacity:1;transition:opacity 0.2s ease}@keyframes diceRoll{0%{transform:rotate(0deg) scale(1)}20%{transform:rotate(-30deg) scale(1.3)}50%{transform:rotate(200deg) scale(1.5)}75%{transform:rotate(330deg) scale(1.2)}90%{transform:rotate(350deg) scale(1.05)}100%{transform:rotate(360deg) scale(1)}}.dice-roll{animation:diceRoll 0.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards}@keyframes spinBorder{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.ta-glow{display:block;position:relative;border-radius:12px;padding:1px;overflow:hidden;isolation:isolate;background:var(--ta-border-color,#d1d5db)}.ta-glow::before{content:"";position:absolute;inset:-100%;width:300%;height:300%;background:conic-gradient(from 0deg,transparent 60%,rgba(250,204,21,0.9) 75%,rgba(254,240,138,1) 80%,rgba(250,204,21,0.9) 85%,transparent 100%);animation:spinBorder 2.4s linear infinite;z-index:0;opacity:1;transition:opacity 0.4s ease}.ta-glow::after{content:"";position:absolute;inset:0;border-radius:12px;background:rgba(250,204,21,0.9);z-index:0;opacity:0;transition:opacity 0.4s ease}.ta-glow-focused::before{opacity:0}.ta-glow-focused::after{opacity:1;animation:glowPulse 2s ease-in-out infinite}@keyframes glowPulse{0%,100%{opacity:1}50%{opacity:0.55}}.ta-glow textarea{position:relative;z-index:1;border:none!important;border-radius:10px;display:block;width:100%;box-sizing:border-box;margin:0}@media(min-width:768px){.uw{max-width:640px!important}.uw h1{font-size:34px!important}.uw h2{font-size:24px!important}.uw label{font-size:17px!important;line-height:1.5!important}.uw p{font-size:16px!important}.uw input,.uw textarea{font-size:18px!important}.uw button{font-size:16px!important}.uw .ci-lbl{font-size:17px!important}.uw .ci-dsc{font-size:15px!important}.bb,.bb button,.bb a,.bb span{font-size:12px!important}.uw .eth-txt,.uw .donate-txt{font-size:15px!important}.uw .altruism-txt{font-size:16px!important}@media(min-width:768px){.nb .nb-logo{font-size:18px!important}.nb .nb-tld{font-size:10px!important}.nb .nb-ico{font-size:24px!important}}}*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}button:not(:disabled):active{transform:scale(0.97)!important;opacity:0.88!important}@media(max-width:479px){.nb-dy{display:none!important}.nb-login-full{display:none!important}.nb-login-short{display:inline!important}}`;

function tz(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch{return"UTC"}}
function fmtDate(iso,z,lc){try{return new Date(iso).toLocaleString(lc||undefined,{timeZone:z,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return new Date(iso).toLocaleString()}}
function tAgo(iso,lc){const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(lc==="nl"){if(m<60)return m+" min geleden";if(h<24)return h+" uur geleden";return dy===1?"gisteren":dy+" dagen geleden";}if(lc==="ar"){if(m<60)return "منذ "+m+" دقيقة";if(h<24)return "منذ "+h+" ساعة";return dy===1?"أمس":"منذ "+dy+" أيام";}if(m<60)return m+"m ago";if(h<24)return h+"h ago";return dy===1?"yesterday":dy+"d ago";}

const BACK_SVG=<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>;

const LP_ICONS=[
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14A2.5 2.5 0 0 0 14.5 2"/></svg>,
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>,
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><path d="M8 8l1.5 1.5M14.5 14.5 16 16M16 8l-1.5 1.5M9.5 14.5 8 16"/></svg>,
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>,
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
];

function Loader({c,lp}){
  const phrases=lp||["Thinking...","Brewing ideas...","Crystal ball warming up...","Casting spells...","Deep thought...","Locking in..."];
  const [i,setI]=useState(0);const [d,setD]=useState("");const [b,setB]=useState(false);
  useEffect(()=>{let x=0;const a=setInterval(()=>{x=(x+1)%phrases.length;setI(x);setB(true);setTimeout(()=>setB(false),400);},2400);const dd=setInterval(()=>setD(p=>p.length>=3?"":p+"."),500);return()=>{clearInterval(a);clearInterval(dd);};},[]);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px"}}><div style={{color:c.ac,transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",transform:b?"scale(1.25) rotate(8deg)":"scale(1)",marginBottom:20}}>{LP_ICONS[i%LP_ICONS.length]}</div><div style={{fontSize:16,color:c.tx,fontWeight:500}}>{phrases[i]||""}{d}</div><div style={{marginTop:24,display:"flex",gap:8}}>{[0,1,2].map(j=>(<div key={j} style={{width:10,height:10,borderRadius:"50%",background:c.ac,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>))}</div></div>);
}

function PBar({done,total,c}){
  const p=total>0?(done/total)*100:0;
  return(<div style={{width:"100%",height:6,borderRadius:3,background:c.ghr}}><div style={{height:"100%",borderRadius:3,background:p>=100?c.gr:c.ac,width:p+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.4s",boxShadow:p>=100?"0 0 8px rgba(34,197,94,0.5)":"0 0 5px rgba(250,204,21,0.3)"}}/></div>);
}
function TTog({mode,set,c}){
  const nx={light:"dark",dark:"system",system:"light"};
  const SunIc=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{display:"block"}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
  const MoonIc=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{display:"block"}}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
  const MonIc=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>);
  const ic={light:<SunIc/>,dark:<MoonIc/>,system:<MonIc/>};
  return(<button onClick={()=>set(nx[mode])} title={mode} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:8,padding:"5px 8px",cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",color:c.tm,transition:"background 0.15s,color 0.15s,border-color 0.15s"}}>{ic[mode]}</button>);
}
function DyTog({on,set,c,label}){
  return(
    <button
      onClick={()=>set(!on)}
      title={label||"Dyslexia-friendly font"}
      style={{background:on?c.ab:c.ghb,border:"1px solid "+(on?c.abr:c.ghr),borderRadius:8,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,color:on?c.ac:c.tm,transition:"background 0.15s,color 0.15s,border-color 0.15s"}}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{display:"block",flexShrink:0}}>
        <circle cx="8" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="6" cy="6.5" r="0.85" fill="currentColor"/>
        <circle cx="10" cy="6.5" r="0.85" fill="currentColor"/>
        <path d="M5.5 9 Q8 11.5 10.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      </svg>
      <span style={{fontFamily:"serif",fontWeight:700,fontSize:12,letterSpacing:"-0.02em",lineHeight:1}}>Aa</span>
    </button>
  );
}
function HeroSubtitle({phrases,paused,style}){
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    if(paused||!phrases||phrases.length<=1)return;
    const id=setInterval(()=>setIdx(i=>(i+1)%phrases.length),3000);
    return()=>clearInterval(id);
  },[phrases,paused]);
  return<p key={idx} style={style}>{(phrases||[])[idx%((phrases||[]).length||1)]||""}</p>;
}
function BrandMark({c,size}){
  const s=size==="large";
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:s?6:2,marginBottom:s?8:4}}>
    <div style={{filter:"drop-shadow(0 0 12px "+c.ac+")",display:"flex",alignItems:"center",justifyContent:"center",color:c.ac}}><svg width={s?52:38} height={s?32:23} viewBox="0 0 52 32" fill="none" stroke="currentColor" strokeWidth={s?3:2.5} strokeLinecap="round" style={{display:"block"}}><path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/></svg></div>
    <div style={{fontSize:s?28:20,fontWeight:800,letterSpacing:"-0.03em",color:c.tx,lineHeight:1}}>untangle</div>
    <div style={{fontSize:s?11:9,fontWeight:500,letterSpacing:"0.15em",color:c.tf,textTransform:"uppercase"}}>.lol</div>
  </div>);
}
function CheckItem({done,label,desc,onToggle,c}){
  return(<div onClick={onToggle} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",borderRadius:12,cursor:onToggle?"pointer":"default",background:done?c.gb:c.sb,border:"1px solid "+(done?c.gbr:c.sr),transition:"background 0.2s,border-color 0.2s,opacity 0.2s",opacity:done?0.72:1,userSelect:"none"}}>
    <div style={{width:28,height:28,minWidth:28,borderRadius:8,background:done?c.gr:c.ckb,border:"2px solid "+(done?c.gr:c.ckr),display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,flexShrink:0,transition:"background 0.2s,border-color 0.2s",color:c.cm}}>{done?(<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>):null}</div>
    <div style={{flex:1}}><div className="ci-lbl" style={{fontSize:15,fontWeight:600,color:done?c.gr:c.tx,marginBottom:3,textDecoration:done?"line-through":"none",transition:"color 0.2s"}}>{label}</div><div className="ci-dsc" style={{fontSize:13,color:done?c.dt:c.tm,lineHeight:1.5,transition:"color 0.2s"}}>{desc}</div></div>
  </div>);
}

// ─── Modal overlay ────────────────────────────────────────────────────────────
function Modal({c,children}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}>
      <div style={{background:c.card,borderRadius:20,padding:28,width:"100%",maxWidth:400,border:"1px solid "+c.cb,boxShadow:"0 24px 64px rgba(0,0,0,0.35)",animation:"modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        {children}
      </div>
    </div>
  );
}

function AuthBadge({c,onManage,t}){
  const {key}=getCredential();
  const unset=t?.apiKeyUnset||"set";
  return(
    <button onClick={onManage} style={{display:"flex",alignItems:"center",gap:6,background:c.ab,border:"1px solid "+c.abr,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:c.ac,whiteSpace:"nowrap"}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
      <span>{t?.apiKeyBadge||"API Key"}</span>
      <span style={{opacity:0.5}}>·</span>
      <span style={{color:c.tf}}>{key?key.slice(0,10)+"…":unset}</span>
    </button>
  );
}

export default function App(){
  const [sys,setSys]=useState(()=>{try{return window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}catch{return"dark"}});
  useEffect(()=>{try{const q=window.matchMedia("(prefers-color-scheme:dark)");const h=e=>setSys(e.matches?"dark":"light");q.addEventListener("change",h);return()=>q.removeEventListener("change",h);}catch{}},[]);

  const [tm,setTm]=useState("system");
  const [dy,setDy]=useState(false);
const [lang,setLang]=useState(null);
  const [auth,setAuth]=useState("out");
  const [user,setUser]=useState(null);
  const [inp,setInp]=useState("");

  const [steps,setSteps]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [hist,setHist]=useState([]);
  const [vw,setVw]=useState("splash");
  const [activeId,setActiveId]=useState(null);
  const [localComp,setLocalComp]=useState([]);
  const [apiKeyInput,setApiKeyInput]=useState("");
  const [apiKeyErr,setApiKeyErr]=useState("");
  const [ready,setReady]=useState(false);
  const [recents,setRecents]=useState([]);
  const [globalSugg,setGlobalSugg]=useState([]);
  const [usage,setUsage]=useState({calls:0,inputTokens:0,outputTokens:0,costUsd:0});
  const [credits,setCredits]=useState(FREE_CREDITS);
  // Honeypot
  const [honeypot,setHoneypot]=useState("");
  // Altruism
  const [altruismPopup,setAltruismPopup]=useState(false);   // show "you're helping others!" popup
  const [altruismBonusPopup,setAltruismBonusPopup]=useState(false); // show "+10 credits earned!" popup
  const [pendingAltruismId,setPendingAltruismId]=useState(null); // entry id that has pending bonus
  const [loadingAltruistic,setLoadingAltruistic]=useState(false); // show amber pill on loading screen
  // true when the user hasn't received an altruism bonus in the last 24 hours
  const canEarnAltruismBonus=(()=>{const ts=parseInt(ls.get(KEYS.altruismBonusTs)||"0",10);return(Date.now()-ts)>=24*60*60*1000;})();
  // Hero subtitle cycling handled by HeroSubtitle component
  // Stripe
  const [topUpBusy,setTopUpBusy]=useState(false);
  const [mollieBusy,setMollieBusy]=useState(false);
  const [customQty,setCustomQty]=useState(75);
  const [topUpMsg,setTopUpMsg]=useState(null);
  const [avatarMenu,setAvatarMenu]=useState(false);
  const [topUpPopup,setTopUpPopup]=useState(null); // { credits: N }
  const [clientRef,setClientRef]=useState(null);
  // Revenue
  const [revenueTxns,setRevenueTxns]=useState([]);
  const [revenueBusy,setRevenueBusy]=useState(false);
  const [revenueErr,setRevenueErr]=useState(null);
  const [revenueHasMore,setRevenueHasMore]=useState(false);
  const [revenueCursor,setRevenueCursor]=useState(null);
  // Share sheet
  const [shareOpen,setShareOpen]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  const [shareId,setShareId]=useState(null);
  const [shareLoading,setShareLoading]=useState(false);
  // WOOP
  const [woopStep,setWoopStep]=useState(0); // 0=W,1=O,2=O,3=P
  const [woopData,setWoopData]=useState({wish:"",outcome:"",obstacle:"",plan:""});
  const woopKeys=["wish","outcome","obstacle","plan"];
  const [suggPicks,setSuggPicks]=useState([]);
  const [diceAnim,setDiceAnim]=useState(false);
  const [suggFading,setSuggFading]=useState(false);
  const [suggKey,setSuggKey]=useState(0);
  const isPoppingState=useRef(false);
  const [dismissedAlts,setDismissedAlts]=useState([]);
  const [taFocused,setTaFocused]=useState(false);
  const [taClearConfirm,setTaClearConfirm]=useState(false);
  const taClearTimer=useRef(null);
  const [celebOpen,setCelebOpen]=useState(false);
  const handleTaClear=()=>{
    if(!taClearConfirm){setTaClearConfirm(true);clearTimeout(taClearTimer.current);taClearTimer.current=setTimeout(()=>setTaClearConfirm(false),2000);}
    else{clearTimeout(taClearTimer.current);setTaClearConfirm(false);setInp("");}
  };
  const userRef=useRef(null);
  const zone=useMemo(()=>tz(),[]);

  const t=lang?LANGS.find(l=>l.code===lang)||LANGS[1]:LANGS[1];
  const rt=tm==="system"?sys:tm;
  const c=TH[rt];
  const dir=t.rtl?"rtl":"ltr";

  const chTm=(m)=>{setTm(m);ls.set(KEYS.theme,m);};
  const chDy=(v)=>{setDy(v);ls.set(KEYS.dyslexia,v?"1":"");};

  useEffect(()=>{document.documentElement.classList.toggle("od",dy);},[dy]);

  useEffect(()=>{
    const color=rt==="dark"?"#0f172a":"#f8fafc";
    let tag=document.querySelector("meta[name='theme-color']");
    if(!tag){tag=document.createElement("meta");tag.name="theme-color";document.head.appendChild(tag);}
    tag.content=color;
    document.documentElement.style.background=color;
    document.body.style.background=color;
  },[rt]);

  const VW_HASH={home:'',lang:'lang',dash:'dashboard',new_goal:'new',woop_input:'woop',byok:'key',no_credits:'payment',manage_auth:'settings',feedback:'feedback',terms:'terms',privacy:'privacy',donate:'donate'};
  const HASH_VW=Object.fromEntries(Object.entries(VW_HASH).map(([k,v])=>[v,k]));

  const PAGE_TITLES={
    home:'Untangle.lol — Free AI To-Do List & Goal Planner',
    lang:'Choose Language — untangle.lol',
    dash:'My Plans — untangle.lol',
    new_goal:'New Plan — untangle.lol',
    woop_input:'WOOP Goal Setting — untangle.lol',
    byok:'API Key — untangle.lol',
    no_credits:'Get More Questions — untangle.lol',
    manage_auth:'Account & Settings — untangle.lol',
    feedback:'Feedback — untangle.lol',
    terms:'Terms of Service — untangle.lol',
    privacy:'Privacy Policy — untangle.lol',
    donate:'Support untangle.lol',
    result:'Your Plan — untangle.lol',
    loading:'Generating Plan… — untangle.lol',
  };

  // Sync view → URL + document.title
  useEffect(()=>{
    if(isPoppingState.current){isPoppingState.current=false;return;}
    if(!ready||vw==='loading'||vw==='splash'||vw==='result')return;
    const h=VW_HASH[vw];if(h===undefined)return;
    const target=h?'/'+h:'/';
    if(window.location.pathname!==(h?'/'+h:'/'))window.history.pushState({vw},'',target);
    if(PAGE_TITLES[vw])document.title=PAGE_TITLES[vw];
  },[vw,ready]);// eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward navigation
  useEffect(()=>{
    const handle=()=>{
      isPoppingState.current=true;
      const p=window.location.pathname;
      const tv=(p==='/'?null:HASH_VW[p.slice(1)])||(auth==='in'?'dash':'home');
      setVw(tv);
    };
    window.addEventListener('popstate',handle);
    return()=>window.removeEventListener('popstate',handle);
  },[auth]);// eslint-disable-line react-hooks/exhaustive-deps

  // Persist current view so refresh restores the same page
  useEffect(()=>{
    if(vw&&vw!=="splash"&&vw!=="loading"&&vw!=="result")ls.set(KEYS.view,vw);
  },[vw]);


  // Boot
  useEffect(()=>{(async()=>{
    const sv=ls.get(KEYS.theme);if(sv)setTm(sv);
    const dv=ls.get(KEYS.dyslexia);if(dv==="1")setDy(true);
const langSv=ls.get("untangle_lang");if(langSv)setLang(langSv);
    // recents are loaded per-lang in a separate useEffect below
    const uv=ls.get(KEYS.usage);if(uv){try{setUsage(JSON.parse(uv));}catch{}}
    const cv=ls.get(KEYS.credits);
    const now=Date.now();
    const TOPUP_MS=24*60*60*1000;
    if(cv===null){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(now));setCredits(FREE_CREDITS);}
    else{
      const n=parseInt(cv,10);
      const ts=parseInt(ls.get(KEYS.creditsTs)||"0",10);
      if((isNaN(n)||n<=0)&&(now-ts)>=TOPUP_MS){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(now));setCredits(FREE_CREDITS);}
      else{setCredits(isNaN(n)?FREE_CREDITS:Math.max(0,n));}
    }
    // Ensure clientRef exists
    let ref=ls.get(KEYS.clientRef);
    if(!ref){ref=genClientRef();ls.set(KEYS.clientRef,ref);}
    setClientRef(ref);
    const {valid}=getCredential();
    const params=new URLSearchParams(window.location.search);
    const signedIn=params.get("signed_in")==="1";
    const authErr=params.get("auth_error")==="1";
    const topupSuccess=params.get("topup")==="success";
    const restoreId=params.get("id");
    const pn=window.location.pathname;
    const hashVw=pn==='/'?null:HASH_VW[pn.slice(1)];
    if(signedIn||authErr||topupSuccess){window.history.replaceState({},"",window.location.pathname);}
    // Try Google session cookie first
    try{
      const sr=await fetch("/api/auth/session");
      const sd=await sr.json();
      if(sd.user?.email){
        const {email,name,picture}=sd.user;
        setUser({email,name,picture});
        userRef.current=email;
        const savedLang=ls.get("untangle_lang");
        if(savedLang)setLang(savedLang);
        setAuth("in");
        // Load account-specific credits (separate from guest credits, no daily reset)
        const acv=ls.get(acctCreditsKey(email));
        if(acv===null){ls.set(acctCreditsKey(email),String(FREE_CREDITS));setCredits(FREE_CREDITS);}
        else{setCredits(Math.max(0,parseInt(acv,10)||0));}
        let parsedHist=[];
        const hv=ls.get(eKey(email));if(hv){try{parsedHist=JSON.parse(hv);}catch{}}
        setHist(parsedHist);
        if(signedIn)utrack("sign_in");
        if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
        if(restoreId){const e=parsedHist.find(h=>String(h.id)===restoreId);if(e){setSteps(e.resultaat);setActiveId(e.id);setLocalComp(e.completed||e.resultaat.stappen.map(()=>false));setVw("result");setReady(true);return;}}
        const AUTH_VWS=["dash","new_goal","woop_input","byok","no_credits","manage_auth","lang","result","feedback","terms","privacy","donate"];
        const savedVw=hashVw||ls.get(KEYS.view);
        setVw(savedVw&&AUTH_VWS.includes(savedVw)?savedVw:"dash");setReady(true);return;
      }
    }catch{}
    let parsedGuestHist=[];
    const gh=ls.get(KEYS.guestHist);if(gh){try{parsedGuestHist=JSON.parse(gh);}catch{}}
    setHist(parsedGuestHist);
    if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
    if(restoreId){const e=parsedGuestHist.find(h=>String(h.id)===restoreId);if(e){setSteps(e.resultaat);setActiveId(e.id);setLocalComp(e.completed||e.resultaat.stappen.map(()=>false));setVw("result");setReady(true);return;}}
    const GUEST_VWS=["home","woop_input","byok","no_credits","lang","result","feedback","terms","privacy","donate"];
    const savedVwG=hashVw||ls.get(KEYS.view);
    setVw(savedVwG&&GUEST_VWS.includes(savedVwG)?savedVwG:(langSv?"home":"lang"));
    setReady(true);
  })();},[]);

  // Load lang-scoped recents whenever lang changes
  useEffect(()=>{
    if(!lang)return;
    const rv=ls.get(recentsKey(lang));
    if(rv){try{setRecents(JSON.parse(rv));}catch{setRecents([]);}}
    else{setRecents([]);}
  },[lang]);

  // Poll /api/credits/claim until credits land (after Stripe redirect)
  const pollCredits=async(ref,attempts=0)=>{
    if(attempts>10)return;
    try{
      const r=await fetch("/api/credits/verify?ref="+encodeURIComponent(ref));
      const d=await r.json();
      if(d.credits>0){
        addCredits(d.credits);
        utrack("credits_topped_up",{credits:d.credits});
        setTopUpMsg(null);
        setTopUpPopup({credits:d.credits});
        return;
      }
    }catch{}
    setTimeout(()=>pollCredits(ref,attempts+1),3000);
  };

  // Returns the correct localStorage key for credits based on whether a user is logged in
  const activeCreditsKey=()=>userRef.current?acctCreditsKey(userRef.current):KEYS.credits;

  const addCredits=(n)=>{
    const key=activeCreditsKey();
    setCredits(prev=>{const next=prev+n;ls.set(key,String(next));return next;});
  };

  const saveApiKey=async()=>{
    const k=apiKeyInput.trim();
    const provider=keyProvider(k);
    if(!k.startsWith("sk-ant-")&&!k.startsWith("sk-or-")){setApiKeyErr(t.keyErrFmt);return;}
    ls.set(KEYS.apiKey,k);
    setApiKeyErr("");setApiKeyInput("");
    setBusy(true);
    try{
      if(provider==="openrouter"){
        const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr(t.keyErrInv+d.error.message);setBusy(false);return;}
      }else{
        const r=await fetch(ANTHROPIC_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_ANTHROPIC,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr(t.keyErrInv+d.error.message);setBusy(false);return;}
      }
    }catch(e){
      setApiKeyErr(t.keyErrNet);
    }
    setBusy(false);
    utrack("byok_key_saved",{provider});
    setVw(auth==="in"?"dash":lang?"home":"lang");
  };

  const removeAuth=()=>{ls.del(KEYS.apiKey);setVw(auth==="in"?"dash":"home");};
  const logout=async()=>{
    try{await fetch("/api/auth/logout",{method:"POST"});}catch{}
    utrack("sign_out");
    setAuth("out");setUser(null);userRef.current=null;setHist([]);setSteps(null);setInp("");setVw("home");setActiveId(null);setLocalComp([]);
    // Reload guest credits (separate from account credits, with daily reset)
    const gcv=ls.get(KEYS.credits);const gnow=Date.now();const TOPUP_MS=24*60*60*1000;
    if(gcv===null){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(gnow));setCredits(FREE_CREDITS);}
    else{const gn=parseInt(gcv,10);const gts=parseInt(ls.get(KEYS.creditsTs)||"0",10);
      if((isNaN(gn)||gn<=0)&&(gnow-gts)>=TOPUP_MS){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(gnow));setCredits(FREE_CREDITS);}
      else{setCredits(isNaN(gn)?FREE_CREDITS:Math.max(0,gn));}}
  };
  const pickLang=(code)=>{setLang(code);ls.set("untangle_lang",code);utrack("language_selected",{lang:code});setVw(auth==="in"?"dash":"home");};

  useEffect(()=>{
    if(!lang)return;
    fetch("/api/suggestions?lang="+lang)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);})
      .catch(()=>{});
  },[lang]);


  // Reset share state when switching entries
  useEffect(()=>{setShareId(null);setShareOpen(false);setShareCopied(false);},[activeId]);

  const callAPI=async(messages,maxTokens=1000)=>{
    const {key,provider}=getCredential();
    if(provider==="openrouter"){
      const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(key),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:maxTokens,messages})});
      if(!r.ok)throw new Error("fail");
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const text=(d.choices||[]).map(ch=>ch.message?.content||"").join("");
      const u=d.usage||{};
      return{text,inputTokens:u.prompt_tokens||0,outputTokens:u.completion_tokens||0};
    }else{
      const r=await fetch(ANTHROPIC_URL,{method:"POST",headers:buildHeaders(key),body:JSON.stringify({model:MODEL_ANTHROPIC,max_tokens:maxTokens,messages})});
      if(!r.ok)throw new Error("fail");
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const text=(d.content||[]).map(b=>b.text||"").join("");
      const u=d.usage||{};
      return{text,inputTokens:u.input_tokens||0,outputTokens:u.output_tokens||0};
    }
  };

  const prompt=(ui)=>`You are a friendly, humorous coach. You are the AI behind Untangle.lol.\nRespond ENTIRELY in ${t.label}.\nGoal: "${ui}"\nPRINCIPLES: Wellbeing, honesty, sustainability.\nSTYLE: doable today/this week, casual, emoji in title, specific, 3-5 steps.\nAlso set "altruistic":true if the goal is primarily about helping or benefiting OTHER people OR building community — this includes volunteering, caregiving, charity, supporting others in need, starting a club or group, organizing community events, neighborhood initiatives, or any goal whose main beneficiary is a group of people beyond just yourself — otherwise false.\nJSON only, no markdown:\n{"titel":"Summary","altruistic":false,"stappen":[{"nummer":1,"actie":"Emoji + title","toelichting":"1-2 sentences"}]}`;

  const promptWoop=(w)=>`You are a friendly, humorous coach. You are the AI behind Untangle.lol.\nRespond ENTIRELY in ${t.label}.\nThe user has completed a WOOP exercise:\n- Wish: "${w.wish}"\n- Outcome: "${w.outcome}"\n- Obstacle: "${w.obstacle}"\n- Plan (if-then): "${w.plan}"\nPRINCIPLES: Wellbeing, honesty, sustainability.\nSTYLE: doable today/this week, casual, emoji in title, specific, 3-5 action steps. The last step MUST be the user's if-then plan turned into a concrete action.\nAlso set "altruistic":true if the wish is primarily about helping or benefiting OTHER people — otherwise false.\nJSON only, no markdown:\n{"titel":"Summary emoji","altruistic":false,"stappen":[{"nummer":1,"actie":"Emoji + title","toelichting":"1-2 sentences"}]}`;

  const deductCredit=()=>{
    const key=activeCreditsKey();
    setCredits(prev=>{const next=Math.max(0,prev-1);ls.set(key,String(next));return next;});
  };

  const submit=async()=>{
    if(!inp.trim()||busy)return;
    // Honeypot — bots fill hidden fields
    if(honeypot)return;
    const {valid}=getCredential();
    if(!valid){
      if(credits<=0){setVw("no_credits");return;}
    }
    setBusy(true);setErr(null);setSteps(null);setVw("loading");setLoadingAltruistic(false);
    utrack("goal_submitted",{lang,mode:valid?"byok":"free"});
    try{
      let tx,inputTokens,outputTokens;
      if(valid){
        const r=await callAPI([{role:"user",content:prompt(inp.trim())}],1000);
        tx=r.text;inputTokens=r.inputTokens;outputTokens=r.outputTokens;
      }else{
        const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt(inp.trim())}],lang})});
        if(!r.ok)throw new Error("proxy fail");
        const d=await r.json();if(d.error)throw new Error(d.error);
        tx=d.text;inputTokens=d.inputTokens||0;outputTokens=d.outputTokens||0;
      }
      const ps=JSON.parse(tx.replace(/```json\s?|```/g,"").trim());
      if(!ps.titel||!ps.stappen)throw new Error("bad");
      const isAltruistic=ps.altruistic===true;
      if(isAltruistic)setLoadingAltruistic(true);
      setSteps(ps);
      if(!valid)deductCredit();
      setUsage(prev=>{const next={calls:prev.calls+1,inputTokens:prev.inputTokens+inputTokens,outputTokens:prev.outputTokens+outputTokens,costUsd:prev.costUsd+calcCost(inputTokens,outputTokens)};ls.set(KEYS.usage,JSON.stringify(next));return next;});
      const trimmed=inp.trim();
      setRecents(prev=>{const next=[trimmed,...prev.filter(r=>r!==trimmed)].slice(0,5);ls.set(recentsKey(lang),JSON.stringify(next));return next;});
      fetch("/api/suggestions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text:trimmed})})
        .then(r=>r.ok?r.json():null)
        .then(()=>fetch("/api/suggestions?lang="+lang).then(r=>r.ok?r.json():null).then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);}))
        .catch(()=>{});
      const comp=ps.stappen.map(()=>false);
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:inp.trim(),resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        window.history.replaceState(null,'','/?id='+entry.id);
        // Show altruism popup after a short delay so result view renders first
        if(isAltruistic){setTimeout(()=>setAltruismPopup(true),600);}
        utrack("goal_result",{lang,isAltruistic,steps:ps.stappen?.length||0});
      };
      if(isAltruistic){setTimeout(navigate,1800);}else{navigate();}
    }catch(e){setErr(t.err);setVw(auth==="in"?"new_goal":"home");}finally{setBusy(false);}
  };

  const submitWoop=async()=>{
    if(!woopData.wish.trim()||!woopData.outcome.trim()||!woopData.obstacle.trim()||!woopData.plan.trim()||busy)return;
    if(honeypot)return;
    const {valid}=getCredential();
    if(!valid){
      if(credits<=0){setVw("no_credits");return;}
    }
    setBusy(true);setErr(null);setSteps(null);setVw("loading");setLoadingAltruistic(false);
    utrack("woop_submitted",{lang,mode:valid?"byok":"free"});
    try{
      let tx,inputTokens,outputTokens;
      const msgContent=promptWoop(woopData);
      if(valid){
        const r=await callAPI([{role:"user",content:msgContent}],1200);
        tx=r.text;inputTokens=r.inputTokens;outputTokens=r.outputTokens;
      }else{
        const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:msgContent}],lang})});
        if(!r.ok)throw new Error("proxy fail");
        const d=await r.json();if(d.error)throw new Error(d.error);
        tx=d.text;inputTokens=d.inputTokens||0;outputTokens=d.outputTokens||0;
      }
      const ps=JSON.parse(tx.replace(/```json\s?|```/g,"").trim());
      if(!ps.titel||!ps.stappen)throw new Error("bad");
      const isAltruistic=ps.altruistic===true;
      if(isAltruistic)setLoadingAltruistic(true);
      setSteps(ps);
      if(!valid)deductCredit();
      setUsage(prev=>{const next={calls:prev.calls+1,inputTokens:prev.inputTokens+inputTokens,outputTokens:prev.outputTokens+outputTokens,costUsd:prev.costUsd+calcCost(inputTokens,outputTokens)};ls.set(KEYS.usage,JSON.stringify(next));return next;});
      const trimmedWish=woopData.wish.trim();
      fetch("/api/suggestions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text:trimmedWish})})
        .then(()=>fetch("/api/suggestions?lang="+lang).then(r=>r.ok?r.json():null).then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);}))
        .catch(()=>{});
      const comp=ps.stappen.map(()=>false);
      const woop={wish:woopData.wish.trim(),outcome:woopData.outcome.trim(),obstacle:woopData.obstacle.trim(),plan:woopData.plan.trim()};
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:woop.wish,resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false,woop};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        window.history.replaceState(null,'','/?id='+entry.id);
        if(isAltruistic){setTimeout(()=>setAltruismPopup(true),600);}
        utrack("woop_result",{lang,isAltruistic,steps:ps.stappen?.length||0});
      };
      // Reset woop state for next use
      setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);
      if(isAltruistic){setTimeout(navigate,1800);}else{navigate();}
    }catch(e){setErr(t.err);setVw("woop_input");}finally{setBusy(false);}
  };

  const toggleStep=(idx)=>{
    setLocalComp(prev=>{
      const next=[...prev];next[idx]=!next[idx];
      const allDone=next.every(Boolean)&&next.length>0;
      if(allDone){
        utrack("goal_completed",{lang});
        setCelebOpen(true);
        const fire=(opts)=>confetti({particleCount:80,spread:70,origin:{y:0.6},...opts});
        setTimeout(()=>fire({colors:["#facc15","#a3e635","#38bdf8","#f472b6","#fb923c"]}),0);
        setTimeout(()=>fire({colors:["#facc15","#a3e635","#38bdf8"],angle:60,origin:{x:0,y:0.65}}),200);
        setTimeout(()=>fire({colors:["#f472b6","#fb923c","#c084fc"],angle:120,origin:{x:1,y:0.65}}),400);
      }
      // Save updated completion state only (bonus awarded on goHome)
      const updateHist=(ph)=>ph.map(h=>h.id!==activeId?h:{...h,completed:next});
      if(activeId&&auth==="in"){setHist(ph=>{const nh=updateHist(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
      else if(activeId){setHist(ph=>{const nh=updateHist(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      return next;
    });
  };

  const loadRevenue=async(cursor)=>{
    setRevenueBusy(true);setRevenueErr(null);
    try{
      const url="/api/stripe/income"+(cursor?"?starting_after="+cursor:"");
      const res=await fetch(url);
      const json=await res.json();
      if(!res.ok)throw new Error(json.error||"Error");
      setRevenueTxns(p=>cursor?[...p,...json.data]:json.data);
      setRevenueHasMore(json.has_more);
      setRevenueCursor(json.next_cursor);
    }catch(e){setRevenueErr(e.message);}
    setRevenueBusy(false);
  };

  // Stripe top-up
  const startTopUp=async(tier='popular',customCredits)=>{
    setTopUpBusy(tier);
    utrack("topup_started",{tier});
    try{
      const ref=clientRef||ls.get(KEYS.clientRef);
      const r=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientRef:ref,tier,...(tier==="custom"?{customCredits}:{})})});
      const d=await r.json();
      if(d.url){window.location.href=d.url;}
      else{setTopUpMsg("error");}
    }catch{setTopUpMsg("error");}
    setTopUpBusy(false);
  };

  // Mollie top-up
  const startMollieTopUp=async(tier='popular',customCredits)=>{
    setMollieBusy(tier);
    utrack("topup_started_mollie",{tier});
    try{
      const ref=clientRef||ls.get(KEYS.clientRef);
      const r=await fetch("/api/mollie/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientRef:ref,tier,...(tier==="custom"?{customCredits}:{})})});
      const d=await r.json();
      if(d.url){window.location.href=d.url;}
      else{setTopUpMsg("error");}
    }catch{setTopUpMsg("error");}
    setMollieBusy(false);
  };

  const openEntry=(entry)=>{setSteps(entry.resultaat);setActiveId(entry.id);setLocalComp(entry.completed||entry.resultaat.stappen.map(()=>false));setShareOpen(false);setVw("result");window.history.replaceState(null,'','/?id='+entry.id);};
  const del=(id)=>{const nh=hist.filter(h=>h.id!==id);setHist(nh);if(auth==="in")ls.set(eKey(userRef.current),JSON.stringify(nh));else ls.set(KEYS.guestHist,JSON.stringify(nh));};
  const clrAll=()=>{setHist([]);if(auth==="in")ls.set(eKey(userRef.current),"[]");else ls.set(KEYS.guestHist,"[]");};
  const goHome=()=>{
    setInp("");setSteps(null);setErr(null);setActiveId(null);setLocalComp([]);setShareOpen(false);setVw(auth==="in"?"dash":"home");
  };
  const prog=(e)=>{const tt=e.resultaat?.stappen?.length||0;const dn=(e.completed||[]).filter(Boolean).length;return{dn,tt,pct:tt>0?Math.round(dn/tt*100):0};};

  const delRecent=(text)=>{
    setRecents(prev=>{const next=prev.filter(r=>r!==text);ls.set(recentsKey(lang),JSON.stringify(next));return next;});
  };
  const delGlobal=(text)=>{
    setGlobalSugg(prev=>prev.filter(s=>s!==text));
    fetch("/api/suggestions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text})}).catch(()=>{});
  };

  const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const computeSuggPicks=()=>{
    const localSet=new Set(recents.map(r=>r.toLowerCase()));
    const np=shuffle((t.phSugg||[]).filter(s=>!localSet.has(s.toLowerCase())&&!dismissedAlts.includes(s)));
    const ap=shuffle((t.altruisticSugg||[]).filter(s=>!localSet.has(s.toLowerCase())&&!dismissedAlts.includes(s)));
    const count=2+Math.floor(Math.random()*3);
    const nc=Math.min(Math.ceil(count/2),np.length);
    const ac=Math.min(count-nc,ap.length);
    const picks=[];
    for(let i=0;i<Math.max(nc,ac);i++){
      if(i<nc)picks.push({text:np[i],kind:"normal"});
      if(i<ac)picks.push({text:ap[i],kind:"alt"});
    }
    return picks;
  };

  useEffect(()=>{setSuggPicks(computeSuggPicks());},[t,recents,dismissedAlts]);// eslint-disable-line react-hooks/exhaustive-deps

  const SuggChips=()=>{
    const hasSuggs=(t.phSugg||[]).length>0||(t.altruisticSugg||[]).length>0;
    if(recents.length===0&&!hasSuggs)return null;
    const pick=(text)=>{setInp(text);};
    const chipRow={display:"flex",alignItems:"center",width:"100%",overflow:"hidden"};
    const delBtn=(onClick)=><button onClick={(e)=>{e.stopPropagation();onClick();}} style={{flexShrink:0,background:"none",border:"none",padding:"10px 14px",color:c.tm,cursor:"pointer",fontSize:16,opacity:0.5,lineHeight:1}} title="Remove">×</button>;
    return(
      <div style={{marginTop:10,border:"1px solid "+c.cb,borderRadius:10,overflow:"hidden"}}>
        <div style={{background:c.sb,borderBottom:"1px solid "+c.cb,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,fontWeight:600,color:c.tf,display:"inline-flex",alignItems:"center",gap:5}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>{t.suggLabel||"Pick a suggestion"}</span>
          <button onClick={()=>{setDiceAnim(true);setTimeout(()=>setDiceAnim(false),600);setSuggFading(true);setTimeout(()=>{setSuggPicks(computeSuggPicks());setSuggKey(k=>k+1);setSuggFading(false);},150);}} style={{background:"none",border:"none",cursor:"pointer",opacity:0.7,padding:"0 2px",lineHeight:1,color:c.tf,display:"inline-flex",alignItems:"center",justifyContent:"center"}} title="Randomize"><span className={diceAnim?"dice-roll":""}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg></span></button>
        </div>
        <div key={suggKey} className={suggFading?"sugg-fading":"sugg-list"} style={{display:"flex",flexDirection:"column",gap:0}}>
          {recents.map((r,i)=>(
            <div key={"l"+i} style={{...chipRow,borderTop:i>0?"1px solid "+c.cb:"none",background:c.ab}}>
              <button onClick={()=>pick(r)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:c.ac,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</button>
              {delBtn(()=>delRecent(r))}
            </div>
          ))}
          {suggPicks.map((s,i)=>(
            <div key={"m"+i} style={{...chipRow,borderTop:(recents.length>0||i>0)?"1px solid "+c.cb:"none",background:s.kind==="alt"?"rgba(251,191,36,0.06)":"transparent"}}>
              <button onClick={()=>pick(s.text)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:s.kind==="alt"?c.ac:c.tm,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                {s.kind==="alt"
                  ?<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  :<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                }
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.text}</span>
              </button>
              {delBtn(()=>setDismissedAlts(d=>[...d,s.text]))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Build plain-text share message from current steps
  const buildShareText=(ps,url)=>{
    if(!ps)return'';
    const link=url||'https://untangle.lol';
    const lines=[t.shareMsg||'Check out my action plan on untangle.lol:','',ps.titel,''];
    (ps.stappen||[]).forEach((s,i)=>{lines.push((i+1)+'. '+s.actie);lines.push('   '+s.toelichting);lines.push('');});
    lines.push(link);
    return lines.join('\n').trim();
  };

  // Award altruism bonus — only when the user actually shares (not just opens the panel)
  const claimAltruismBonus=()=>{
    const entry=hist.find(h=>h.id===activeId);
    if(!entry?.isAltruistic||entry?.altruismBonusClaimed||!canEarnAltruismBonus)return;
    addCredits(ALTRUISM_BONUS_CREDITS);
    ls.set(KEYS.altruismBonusTs,String(Date.now()));
    utrack("altruism_bonus_earned",{credits:ALTRUISM_BONUS_CREDITS,trigger:"share"});
    const markClaimed=(ph)=>ph.map(h=>h.id===activeId?{...h,altruismBonusClaimed:true}:h);
    if(auth==="in"){setHist(ph=>{const nh=markClaimed(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
    else{setHist(ph=>{const nh=markClaimed(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
    setTimeout(()=>setAltruismBonusPopup(true),800);
  };

  const doShare=async(ps)=>{
    // Lazily create a permalink on first share
    let sid=shareId;
    if(!sid&&!shareLoading){
      setShareLoading(true);
      try{
        const r=await fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({steps:ps,lang})});
        if(r.ok){const d=await r.json();sid=d.id;setShareId(d.id);}
      }catch{}
      setShareLoading(false);
    }
    const url=sid?`https://untangle.lol/s/${sid}`:'https://untangle.lol';
    const text=buildShareText(ps,url);
    if(navigator.share){
      try{
        await navigator.share({title:ps.titel,text,url});
        claimAltruismBonus(); // native share succeeded = actually shared
        utrack('share_native');
        return;
      }catch(e){if(e.name==='AbortError')return;}
    }
    // Non-native: open panel — bonus claimed when user clicks a share option or copies
    setShareOpen(o=>!o);
    setShareCopied(false);
    utrack('share_open');
  };

  const copyShareText=(text)=>{
    claimAltruismBonus(); // copying the link/text counts as sharing
    if(navigator.clipboard){
      navigator.clipboard.writeText(text).catch(()=>{});
    }else{
      const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch{}document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(()=>setShareCopied(false),2000);
    utrack('share_copy');
  };

  // Honeypot field — visually hidden, bots fill it
  const HoneypotField=()=>(
    <div style={{position:"absolute",left:"-9999px",top:"-9999px",width:1,height:1,overflow:"hidden"}} aria-hidden="true">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/>
    </div>
  );

  const sx={
    pg:{minHeight:"100dvh",height:"100dvh",background:c.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"12px 20px",paddingTop:"calc(48px + env(safe-area-inset-top))",paddingBottom:"calc(120px + env(safe-area-inset-bottom))",fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",transition:"background 0.4s",overflowY:"auto"},
    w:{width:"100%",maxWidth:540,flex:1,display:"flex",flexDirection:"column",justifyContent:"center"},
    cd:{background:c.card,borderRadius:16,padding:24,border:"1px solid "+c.cb,boxShadow:c.sh,transition:"all 0.3s"},
    ip:{width:"100%",background:c.ib,border:"2px solid "+c.ibr,borderRadius:10,padding:"13px 16px",color:c.tx,fontSize:16,outline:"none",boxSizing:"border-box"},
    bo:{width:"100%",marginTop:14,padding:"13px 20px",background:c.ag,color:c.bt,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",transition:"filter 0.15s,opacity 0.15s",letterSpacing:"-0.01em"},
    bd:{width:"100%",marginTop:14,padding:"13px 20px",background:c.am,color:c.tm,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"not-allowed",opacity:0.55,letterSpacing:"-0.01em"},
    bg:{width:"100%",marginTop:12,padding:"12px 20px",background:c.ghb,color:c.tm,border:"1px solid "+c.ghr,borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer",transition:"background 0.15s,border-color 0.15s,color 0.15s",letterSpacing:"-0.01em"},
    note:{fontSize:12,color:c.tf,marginTop:8,textAlign:"center"},
    err:{marginTop:10,padding:"10px 14px",background:c.eb,borderRadius:8,color:c.et,fontSize:13},
    stripe:{width:"100%",marginTop:10,padding:"13px 20px",background:"linear-gradient(135deg,#6772e5,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
    mollie:{width:"100%",marginTop:8,padding:"13px 20px",background:"linear-gradient(135deg,#ff6640,#e84c20)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
  };

  const Bar=()=>{
    const {key:_bk}=getCredential();
    const showCred=!_bk&&credits!==undefined;
    const lowCred=showCred&&credits<=3;
    return(
    <div className="nb" dir={dir} style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",paddingTop:"calc(8px + env(safe-area-inset-top))",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+c.cb}}>
      <button onClick={goHome} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <span className="nb-ico" style={{filter:"drop-shadow(0 0 8px "+c.ac+")",lineHeight:1,display:"flex",alignItems:"center",color:c.ac}}><svg width="26" height="16" viewBox="0 0 52 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{display:"block"}}><path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/></svg></span>
        <span className="nb-logo" style={{fontSize:14,fontWeight:800,letterSpacing:"-0.03em",color:c.tx,lineHeight:1}}>untangle</span>
        <span className="nb-tld" style={{fontSize:9,fontWeight:500,letterSpacing:"0.15em",color:c.tf,textTransform:"uppercase",lineHeight:1}}>.lol</span>
      </button>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {showCred&&(
          <button onClick={()=>setVw("no_credits")} style={{display:"flex",alignItems:"center",gap:4,background:lowCred?"rgba(239,68,68,0.1)":c.ab,border:"1px solid "+(lowCred?"rgba(239,68,68,0.35)":c.abr),borderRadius:20,padding:"3px 10px 3px 7px",cursor:"pointer",color:lowCred?"#ef4444":c.ac,transition:"background 0.15s,border-color 0.15s",flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style={{fontSize:12,fontWeight:700,lineHeight:1}}>{credits}</span>
          </button>
        )}
        <button onClick={()=>setVw("lang")} title={t.lSel} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:8,padding:"5px 8px",cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",gap:4,flexShrink:0,color:c.tm,transition:"background 0.15s,border-color 0.15s,color 0.15s"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span style={{fontSize:11,fontWeight:600,letterSpacing:"0.03em"}}>{(lang||"en").toUpperCase()}</span></button>
        <TTog mode={tm} set={chTm} c={c}/>
        <span className="nb-dy"><DyTog on={dy} set={chDy} c={c} label={t.dyslexia||"Dyslexia-friendly font"}/></span>
        {!user&&auth!=="in"&&(
          <button onClick={()=>setVw("manage_auth")} style={{background:c.ab,border:"1px solid "+c.abr,borderRadius:8,padding:"5px 12px",cursor:"pointer",color:c.ac,fontSize:12,fontWeight:700,letterSpacing:"0.01em",fontFamily:"inherit",flexShrink:0,transition:"background 0.15s",whiteSpace:"nowrap"}}><span className="nb-login-full">{t.signIn||"Log in"}</span><span className="nb-login-short" style={{display:"none"}}>Log in</span></button>
        )}
        {user&&(
          <div style={{position:"relative"}}>
            <button onClick={()=>setAvatarMenu(v=>!v)} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {user.picture
                ?<img src={user.picture} alt={user.name||""} referrerPolicy="no-referrer" style={{width:26,height:26,borderRadius:"50%",border:"1px solid "+c.cb,flexShrink:0}}/>
                :<div style={{width:26,height:26,borderRadius:"50%",background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",color:c.ac}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              }
            </button>
            {avatarMenu&&(
              <>
                <div onClick={()=>setAvatarMenu(false)} style={{position:"fixed",inset:0,zIndex:149}}/>
                <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:150,background:rt==="dark"?"rgba(15,23,42,0.98)":"rgba(255,255,255,0.98)",border:"1px solid "+c.cb,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.18)",backdropFilter:"blur(12px)",minWidth:160,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
                  <button onClick={()=>{setAvatarMenu(false);setVw("no_credits");}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"none",border:"none",borderBottom:"1px solid "+c.cb,cursor:"pointer",color:c.tx,fontSize:13,fontWeight:500,textAlign:"left",fontFamily:"inherit"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0,color:c.ac}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {t.topUp||"Buy questions"}
                  </button>
                  <button onClick={()=>{setAvatarMenu(false);setVw("uitleg");}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"none",border:"none",borderBottom:"1px solid "+c.cb,cursor:"pointer",color:c.tx,fontSize:13,fontWeight:500,textAlign:"left",fontFamily:"inherit"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0,color:c.tm}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    {t.howToUse||"How it works"}
                  </button>
                  <button onClick={()=>{setAvatarMenu(false);logout();}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:13,fontWeight:500,textAlign:"left",fontFamily:"inherit"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    {t.signOut||t.out||"Log out"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );};

  const BottomBar=()=>{
    return(
    <div className="bb" dir={dir} style={{position:"fixed",bottom:0,left:0,right:0,paddingBottom:"env(safe-area-inset-bottom)",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderTop:"1px solid "+c.cb,display:"flex",flexDirection:"column",alignItems:"center",zIndex:100}}>
      {topUpMsg==="pending"&&<div style={{padding:"6px 20px 0"}}><span style={{fontSize:11,color:c.tm,animation:"pulse 1s infinite"}}>{t.topUpPending}</span></div>}
      <div style={{display:"flex",gap:14,justifyContent:"center",paddingTop:8,paddingBottom:5,alignItems:"center"}}>
        <button onClick={()=>setVw("terms")} style={{fontSize:10,color:c.tf,textDecoration:"none",transition:"opacity 0.15s",opacity:0.7,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>{t.terms||"Terms"}</button>
        <button onClick={()=>setVw("privacy")} style={{fontSize:10,color:c.tf,textDecoration:"none",transition:"opacity 0.15s",opacity:0.7,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>{t.privacy||"Privacy"}</button>
        <button onClick={()=>setVw("donate")} style={{fontSize:10,color:c.ac,textDecoration:"none",fontWeight:600,transition:"opacity 0.15s",display:"inline-flex",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{display:"block",flexShrink:0}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{t.donate||"Donate"}</button>
        <a href="https://stats.fabrikage.nl/share/AE078t90MeCuVl4I" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none",transition:"opacity 0.15s",opacity:0.7}}>{t.stats||"Stats"}</a>
        <button onClick={()=>setVw("feedback")} style={{fontSize:10,color:c.tf,textDecoration:"none",background:"none",border:"none",padding:0,cursor:"pointer",opacity:0.7,transition:"opacity 0.15s",fontFamily:"inherit"}}>{t.fbTitle||"Feedback"}</button>
      </div>
      <div style={{paddingBottom:8}}><a href="https://bachsoftware.nl" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none",opacity:0.38,letterSpacing:"0.01em"}}>{t.madeBy||"Made possible by Bach Software"}</a></div>
    </div>
  );};

  const Err=()=>err?(<div style={sx.err}>{err}</div>):null;


  if(!ready)return (<div style={{minHeight:"100dvh",background:c.bg}}><style>{GS}</style></div>);

  return(<>
    {/* ── Persistent top bar ── */}
    {ready&&<Bar/>}
    {/* ── Feedback widget (fixed, bottom-right, above bottom bar) ── */}
    {ready&&<FeedbackWidget c={c} rt={rt} t={t}/>}

    {/* ── Altruism Announcement Popup ── */}
    {altruismPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12,color:"#f59e0b"}}><svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 10px"}}>{t.altruismPopupTitle}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{canEarnAltruismBonus?t.altruismPopupMsg:t.altruismPopupMsgRepeat}</p>
          <button onClick={()=>{setAltruismPopup(false);if(steps)doShare(steps);}} style={{...sx.bo,marginTop:0,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>{t.altruismPopupBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Altruism Bonus Earned Popup ── */}
    {altruismBonusPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12,animation:"pop 0.5s ease",color:c.gr}}><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.gr,margin:"0 0 10px"}}>{t.altruismBonusTitle}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.altruismBonusMsg}</p>
          <div style={{fontSize:32,fontWeight:800,color:c.gr,margin:"0 0 16px"}}>+{ALTRUISM_BONUS_CREDITS}</div>
          <button onClick={()=>setAltruismBonusPopup(false)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.altruismBonusBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Top-up Success Popup ── */}
    {topUpPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12,animation:"pop 0.5s ease",color:c.gr}}><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.gr,margin:"0 0 10px"}}>{t.topUpPopupTitle}</h2>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,margin:"0 0 16px"}}>
            <span style={{fontSize:36,fontWeight:800,color:c.gr}}>+{topUpPopup.credits}</span>
            <span style={{fontSize:16,color:c.tm,fontWeight:500}}>{t.cred}</span>
          </div>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.topUpPopupMsg}</p>
          <button onClick={()=>setTopUpPopup(null)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.topUpPopupBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Celebration Popup ── */}
    {celebOpen&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12,animation:"pop 0.5s ease",color:c.ac}}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></div>
          <h2 style={{fontSize:22,fontWeight:800,color:c.gr,margin:"0 0 10px"}}>{t.celebTitle}</h2>
          <p style={{fontSize:15,color:c.tm,lineHeight:1.6,margin:"0 0 24px"}}>{t.celebMsg}</p>
          <button onClick={()=>setCelebOpen(false)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.celebBtn}</button>
        </div>
      </Modal>
    )}

    {vw==="lang"&&(
      <div style={{...sx.pg,direction:"ltr"}}><div className="uw" style={sx.w}>
        <p style={{color:c.tm,fontSize:15,fontWeight:600,textAlign:"center",marginBottom:20}}>{t.chooseLang}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>pickLang(l.code)} style={{...sx.cd,padding:"16px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.abr;e.currentTarget.style.transform="scale(1.02)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=c.cb;e.currentTarget.style.transform="scale(1)";}}>
              <span style={{width:36,height:36,borderRadius:8,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:c.ac,letterSpacing:"0.03em"}}>{l.code.toUpperCase()}</span><span style={{color:c.tx,fontSize:15,fontWeight:500}}>{l.label}</span>
            </button>))}
        </div>
        {auth!=="in"&&(
          <div style={{marginTop:20,textAlign:"center"}}>
            <p style={{fontSize:12,color:c.tf,marginBottom:10}}>{t.signInSub}</p>
            <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"10px 20px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:14,fontWeight:600,color:c.tx,textDecoration:"none",boxShadow:c.sh}}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              {t.signIn}
            </a>
          </div>
        )}
        <p style={{fontSize:11,color:c.tf,textAlign:"center",marginTop:24,lineHeight:1.5}}>
          {t.analyticsNote}{" "}
          <button onClick={()=>setVw("privacy")} style={{color:c.tf,textDecoration:"underline",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit",fontSize:"inherit"}}>{t.privacy}</button>
        </p>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="byok"&&(
      <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:0}}>{t.byokH1}</h1></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{...sx.cd,padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:c.tx,marginBottom:6}}>{t.byokAnthTitle}</div>
            <div style={{fontSize:12,color:c.tm,lineHeight:1.5,marginBottom:8}}>{t.byokAnthDesc} <code style={{background:c.cb,borderRadius:4,padding:"1px 5px",color:c.ac,fontSize:11}}>sk-ant-</code></div>
            <ol style={{margin:0,padding:"0 0 0 16px",fontSize:12,color:c.tm,lineHeight:1.8}}>
              <li>{t.byokAnthS1}</li><li>{t.byokAnthS2}</li><li>{t.byokAnthS3}</li>
            </ol>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,fontSize:12,color:c.ac,fontWeight:600}}>{t.byokAnthLink}</a>
          </div>
          <div style={{...sx.cd,padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:c.tx,marginBottom:6}}>{t.byokOrTitle}</div>
            <div style={{fontSize:12,color:c.tm,lineHeight:1.5,marginBottom:8}}>{t.byokOrDesc} <code style={{background:c.cb,borderRadius:4,padding:"1px 5px",color:c.ac,fontSize:11}}>sk-or-</code></div>
            <ol style={{margin:0,padding:"0 0 0 16px",fontSize:12,color:c.tm,lineHeight:1.8}}>
              <li>{t.byokOrS1}</li><li>{t.byokOrS2}</li><li>{t.byokOrS3}</li>
            </ol>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,fontSize:12,color:c.ac,fontWeight:600}}>{t.byokOrLink}</a>
          </div>
        </div>
        <div style={sx.cd}>
          <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveApiKey()} placeholder={t.byokPh} style={sx.ip} autoFocus/>
          {apiKeyErr&&<div style={sx.err}>{apiKeyErr}</div>}
          <p style={sx.note}>{t.byokNote}</p>
          <button onClick={saveApiKey} disabled={busy||!apiKeyInput.trim()} style={!apiKeyInput.trim()||busy?sx.bd:sx.bo}>{busy?t.checking:t.byokSave}</button>
          <button onClick={()=>setVw(lang?"home":"lang")} style={sx.bg}>{t.back}</button>
        </div>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="no_credits"&&(()=>{
      const TIERS=[
        {id:"starter",credits:10,price:"€2.50", perQ:"€0.25",label:t.tierStarter||"Starter",popular:false},
        {id:"popular",credits:25,price:"€6.25", perQ:"€0.25",label:t.tierPopular||"Popular",popular:true},
        {id:"power",  credits:50,price:"€12.50",perQ:"€0.25",label:t.tierPower||"Power",popular:false},
      ];
      const safeQty=Math.max(50,Math.floor(customQty)||50);
      const customPrice="€"+(safeQty*0.25).toFixed(2);
      const busy=topUpBusy||mollieBusy;
      // Login wall
      if(auth!=="in") return (
        <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
          <div style={{...sx.cd,textAlign:"center",padding:"40px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{width:56,height:56,borderRadius:16,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",color:c.ac}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 6px"}}>{t.payLoginRequired||"Sign in to buy questions"}</h2>
              <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:0}}>{t.payLoginDesc||"Create a free account to purchase questions and keep them across devices."}</p>
            </div>
            <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"12px 24px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:14,fontWeight:600,color:c.tx,textDecoration:"none",marginTop:4}}>
              <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              {t.signIn}
            </a>
            <button onClick={()=>setVw("home")} style={{...sx.bg,marginTop:0}}>{t.back}</button>
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
      return (
        <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
          <div style={{paddingBottom:24}}>
            {/* Header */}
            <div style={{textAlign:"center",padding:"28px 16px 20px"}}>
              <h1 style={{fontSize:22,fontWeight:800,color:c.tx,margin:"0 0 6px",letterSpacing:"-0.03em"}}>{t.payTitle||"Get more questions"}</h1>
              <p style={{fontSize:13,color:c.tm,margin:0}}>{t.paySubtitle||"Each question generates a complete AI action plan"}</p>
            </div>
            {/* Tier cards */}
            <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 0 4px"}}>
              {TIERS.map(tier=>(
                <div key={tier.id} style={{position:"relative",borderRadius:14,border:"2px solid "+(tier.popular?c.abr:c.cb),background:tier.popular?c.ab:c.card,padding:"18px 20px",overflow:"hidden",transition:"border-color 0.15s"}}>
                  {tier.popular&&<div style={{position:"absolute",top:0,right:0,background:c.ac,color:rt==="dark"?"#0f172a":"#fff",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 10px",borderRadius:"0 12px 0 8px"}}>{t.tierBadge||"Most popular"}</div>}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:tier.popular?c.ac:c.tf,marginBottom:3}}>{tier.label}</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                        <span style={{fontSize:32,fontWeight:800,color:c.tx,letterSpacing:"-0.04em",lineHeight:1}}>{tier.credits}</span>
                        <span style={{fontSize:13,color:c.tm,fontWeight:500}}>{t.cred||"questions"}</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:26,fontWeight:800,color:tier.popular?c.ac:c.tx,letterSpacing:"-0.03em",lineHeight:1}}>{tier.price}</div>
                      <div style={{fontSize:11,color:c.tf,marginTop:3}}>{tier.perQ} {t.perQ||"/ question"}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:STRIPE_ENABLED?"1fr 1fr":"1fr",gap:8}}>
                    {STRIPE_ENABLED&&<button onClick={()=>startTopUp(tier.id)} disabled={!!busy} style={{padding:"10px 8px",background:topUpBusy===tier.id?"rgba(103,114,229,0.8)":"linear-gradient(135deg,#6772e5,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:busy&&topUpBusy!==tier.id?0.5:1,transition:"opacity 0.15s"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      {topUpBusy===tier.id?"...":"Card"}
                    </button>}
                    <button onClick={()=>startMollieTopUp(tier.id)} disabled={!!busy} style={{padding:"10px 8px",background:mollieBusy===tier.id?"rgba(232,76,32,0.8)":"linear-gradient(135deg,#ff6640,#e84c20)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:busy&&mollieBusy!==tier.id?0.5:1,transition:"opacity 0.15s"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      {mollieBusy===tier.id?"...":"iDEAL"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Custom tier */}
            <div style={{borderRadius:14,border:"2px solid "+c.cb,background:c.card,padding:"18px 20px"}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:c.tf,marginBottom:10}}>{t.tierCustom||"Custom"}</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:12,color:c.tm,display:"block",marginBottom:4}}>{t.tierCustomLabel||"Number of questions (min. 50)"}</label>
                  <input type="number" min="50" step="5" value={customQty} onChange={e=>setCustomQty(Math.max(50,parseInt(e.target.value)||50))} style={{width:"100%",boxSizing:"border-box",background:c.sb,border:"1px solid "+c.cb,borderRadius:8,padding:"9px 12px",fontSize:16,fontWeight:700,color:c.tx,outline:"none"}}/>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:26,fontWeight:800,color:c.tx,letterSpacing:"-0.03em",lineHeight:1}}>{customPrice}</div>
                  <div style={{fontSize:11,color:c.tf,marginTop:3}}>€0.25 {t.perQ||"/ question"}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:STRIPE_ENABLED?"1fr 1fr":"1fr",gap:8}}>
                {STRIPE_ENABLED&&<button onClick={()=>startTopUp("custom",safeQty)} disabled={!!busy} style={{padding:"10px 8px",background:topUpBusy==="custom"?"rgba(103,114,229,0.8)":"linear-gradient(135deg,#6772e5,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:busy&&topUpBusy!=="custom"?0.5:1,transition:"opacity 0.15s"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  {topUpBusy==="custom"?"...":"Card"}
                </button>}
                <button onClick={()=>startMollieTopUp("custom",safeQty)} disabled={!!busy} style={{padding:"10px 8px",background:mollieBusy==="custom"?"rgba(232,76,32,0.8)":"linear-gradient(135deg,#ff6640,#e84c20)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:busy&&mollieBusy!=="custom"?0.5:1,transition:"opacity 0.15s"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  {mollieBusy==="custom"?"...":"iDEAL"}
                </button>
              </div>
            </div>
            <p style={{textAlign:"center",fontSize:11,color:c.tf,margin:"12px 0 0"}}>🔒 {STRIPE_ENABLED?(t.paySecure||"Secure payment via Stripe & Mollie"):"Secure payment via Mollie"}</p>
            <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={{...sx.bg,marginTop:12}}>{t.back}</button>
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {vw==="manage_auth"&&(()=>{
      const {key}=getCredential();
      return(
        <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
          <div style={{textAlign:"center",marginBottom:24}}><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:0}}>{t.settingsTitle||"Account & questions"}</h1></div>
          <div style={sx.cd}>
            {/* Google profile card or sign-in */}
            {auth==="in"&&user?(
              <div style={{padding:"16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:12,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                {user.picture&&<img src={user.picture} alt={user.name||""} referrerPolicy="no-referrer" style={{width:44,height:44,borderRadius:"50%",border:"1px solid "+c.cb,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
                  <div style={{fontSize:12,color:c.tm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
                </div>
                <button onClick={logout} style={{background:"none",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"6px 10px",color:"#ef4444",fontSize:12,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>{t.signOut||t.out}</button>
              </div>
            ):(
              <div style={{padding:"14px 16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:12,marginBottom:12,textAlign:"center"}}>
                <p style={{fontSize:12,color:c.tf,margin:"0 0 10px"}}>{t.signInSub}</p>
                <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"10px 18px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:13,fontWeight:600,color:c.tx,textDecoration:"none"}}>
                  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  {t.signIn}
                </a>
              </div>
            )}
            {/* Credits balance */}
            {!key&&<div style={{padding:"16px",background:c.hp,border:"1px solid "+c.hpr,borderRadius:12,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontSize:13,color:c.tm,fontWeight:500,marginBottom:4}}>{t.cred||"questions"}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:36,fontWeight:800,color:credits<=3?"#ef4444":c.ac,lineHeight:1}}>{credits}</span><span style={{fontSize:13,color:credits<=3?"#ef4444":c.tm,fontWeight:500}}>{t.remaining||"remaining"}</span></div>
              </div>
              <button onClick={()=>setVw("no_credits")} style={{...sx.stripe,width:"auto",marginTop:0,padding:"10px 16px",fontSize:13,flexShrink:0}}>
                {t.topUp||"Buy questions"} →
              </button>
            </div>}
            {/* API key card hidden — BYOK temporarily disabled
            {key&&<div style={{padding:"14px 16px",background:c.ab,borderRadius:10,marginBottom:12}}>
              <div style={{fontSize:13,color:c.tm,marginBottom:4}}>{t.apiKeyBadge} · <span style={{fontWeight:600,color:c.ac}}>{providerLabel}</span></div>
              <div style={{fontSize:14,fontWeight:500,color:c.ac,fontFamily:"monospace"}}>{key.slice(0,14)}…</div>
            </div>} */}
{/* BYOK buttons hidden — temporarily disabled
            <button onClick={()=>setVw("byok")} style={sx.bo}>{t.apiKeyBadge}</button>
            <button onClick={removeAuth} style={{...sx.bg,color:"#ef4444",borderColor:"rgba(239,68,68,0.3)",marginTop:12}}>{t.rmKey}</button>
            */}
            <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {vw==="loading"&&(<div dir={dir} style={sx.pg}><div className="uw" style={sx.w}><div style={sx.cd}><Loader c={c} lp={t.lp}/>{loadingAltruistic&&<div style={{marginTop:16,padding:"10px 16px",borderRadius:12,background:c.am,border:`1px solid ${c.abr}`,color:c.ac,fontSize:14,fontWeight:600,textAlign:"center",animation:"fadeIn 0.5s ease forwards",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{display:"block",flexShrink:0}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{t.altruismLoadingMsg}</div>}</div><BottomBar/><style>{GS}</style></div></div>)}

    {(vw==="home"||vw==="new_goal")&&auth!=="in"&&(
      <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
        <div style={{textAlign:"center",marginTop:48,marginBottom:16}}><h1 style={{fontSize:26,fontWeight:700,color:c.tx,margin:0}}>{t.hero}</h1><HeroSubtitle phrases={t.heroS} paused={!!inp} style={{color:c.tm,fontSize:14,marginTop:4,animation:"heroFade 3s ease forwards",minHeight:"1.4em"}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:"block",flexShrink:0,color:c.gt}}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 3.5C8 3.5 9.5 6 9.5 9C9.5 12 8 14 6 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M16 3.5C16 3.5 14.5 6 14.5 9C14.5 12 16 14 18 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M2.5 9.5H21.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M3 15H21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7 20.5C8.5 18 10 17 12 17C14 17 15.5 18 17 20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="eth-txt" style={{fontSize:12,color:c.gt,fontWeight:500}}>{t.eth}</span>
        </div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <label style={{display:"block",fontSize:13,fontWeight:400,color:c.tm,marginBottom:8,textAlign:"center"}}>{t.heroLabel||t.hero}</label>
          <div className={"ta-glow"+(taFocused?" ta-glow-focused":"")} style={{"--ta-tc":rt==="dark"?"rgba(255,255,255,0.12)":"rgba(180,120,0,0.25)","--ta-border-color":rt==="dark"?"#2d4a6e":"#d1d5db","position":"relative"}}>            <textarea value={inp} onChange={e=>setInp(e.target.value)} onFocus={()=>setTaFocused(true)} onBlur={()=>{setTaFocused(false);setTaClearConfirm(false);}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={t.ph} rows={4} autoFocus style={{...sx.ip,resize:"none",lineHeight:1.6,background:rt==="dark"?"#162032":"#ffffff",border:"none",paddingRight:inp.trim()?"36px":undefined}}/>
            {inp.trim()&&<button onMouseDown={e=>{e.preventDefault();handleTaClear();}} title={t.rmTip} style={{position:"absolute",top:"50%",right:8,transform:"translateY(-50%)",zIndex:2,background:taClearConfirm?"rgba(239,68,68,0.12)":"transparent",border:"1px solid "+(taClearConfirm?"rgba(239,68,68,0.35)":"transparent"),borderRadius:6,color:taClearConfirm?"#ef4444":c.tf,fontSize:taClearConfirm?11:16,fontWeight:600,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.18s",lineHeight:1,opacity:taFocused||taClearConfirm?1:0.4}}>{taClearConfirm?(t.taClrConfirm||"clear?"):"×"}</button>}
          </div>
          {SuggChips()}
          {canEarnAltruismBonus&&<div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"flex-start",gap:8}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0,marginTop:2}}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg><span className="altruism-txt" style={{fontSize:14,color:c.ac}}>{t.altruismTeaser}</span></div>}
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>{t.woop||"Try WOOP"}</button>
          <Err/>
        </div>
        {auth!=="in"&&(
          <div style={{marginTop:20,textAlign:"center"}}>
            <p style={{fontSize:12,color:c.tf,marginBottom:12}}>{t.signInSub}</p>
            <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"13px 28px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:13,fontWeight:600,color:c.tx,textDecoration:"none",boxShadow:c.sh}}>
              <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              {t.signIn}
            </a>
          </div>
        )}
        {hist.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
          {hist.map((h,i)=>{const p=prog(h);return(
            <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2,display:"flex",alignItems:"center",gap:4}}>{p.pct>=100&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>}<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.resultaat?.titel||h.behoefte}</span></div>
                  <div style={{fontSize:12,color:c.tf,display:"flex",alignItems:"center",gap:3}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&<svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style={{display:"block",marginLeft:2}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
              </div>
              <PBar done={p.dn} total={p.tt} c={c}/>
            </div>);})}
          {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
        </div>}
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="dash"&&(
      <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
        <div style={{textAlign:"center",marginTop:20,marginBottom:20}}><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:0}}>{user?.name?(t.dWName||"Welcome back, {name}!").replace("{name}",user.name.split(" ")[0]):t.dW}</h1><p style={{color:c.tm,fontSize:13,marginTop:2}}>{t.dS}</p></div>
        <button onClick={()=>setVw("new_goal")} style={{...sx.bo,marginTop:0,marginBottom:16}}>{t.nG}</button>
        {hist.length===0?(<div style={{...sx.cd,textAlign:"center",padding:40}}><div style={{marginBottom:10,display:"flex",justifyContent:"center",color:c.ac,filter:"drop-shadow(0 0 8px "+c.ac+")"}}><svg width="40" height="24" viewBox="0 0 52 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/></svg></div><p style={{color:c.tf,margin:0}}>{t.noG}</p></div>):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>{hist.map((h,i)=>{const p=prog(h);return(
            <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2,display:"flex",alignItems:"center",gap:4}}>{p.pct>=100&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>}<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.resultaat?.titel||h.behoefte}</span></div>
                  <div style={{fontSize:12,color:c.tf,display:"flex",alignItems:"center",gap:3}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&<svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style={{display:"block",marginLeft:2}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
              </div>
              <PBar done={p.dn} total={p.tt} c={c}/>
            </div>);})}
            {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
          </div>
        )}
        <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="new_goal"&&auth==="in"&&(
      <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>
        <div style={{textAlign:"center",marginTop:48,marginBottom:16}}><h1 style={{fontSize:22,fontWeight:700,color:c.tx,margin:0}}>{t.hero}</h1><HeroSubtitle phrases={t.heroS} paused={!!inp} style={{color:c.tm,fontSize:13,marginTop:2,animation:"heroFade 3s ease forwards",minHeight:"1.3em"}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:"block",flexShrink:0,color:c.gt}}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 3.5C8 3.5 9.5 6 9.5 9C9.5 12 8 14 6 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M16 3.5C16 3.5 14.5 6 14.5 9C14.5 12 16 14 18 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M2.5 9.5H21.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M3 15H21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7 20.5C8.5 18 10 17 12 17C14 17 15.5 18 17 20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="eth-txt" style={{fontSize:12,color:c.gt,fontWeight:500}}>{t.eth}</span>
        </div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <label style={{display:"block",fontSize:13,fontWeight:400,color:c.tm,marginBottom:8,textAlign:"center"}}>{t.heroLabel||t.hero}</label>
          <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={t.ph} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6}}/>
          {SuggChips()}
          {canEarnAltruismBonus&&<div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"flex-start",gap:8}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0,marginTop:2}}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg><span className="altruism-txt" style={{fontSize:14,color:c.ac}}>{t.altruismTeaser}</span></div>}
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>{t.woop||"Try WOOP"}</button>
          <Err/>
        </div>
        <button onClick={()=>setVw("dash")} style={sx.bg}>{t.back}</button>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {(vw==="result"||vw==="save_prompt")&&steps&&(()=>{
      const dn=localComp.filter(Boolean).length;const tt=steps.stappen.length;const all=tt>0&&dn===tt;
      const ae=hist.find(h=>h.id===activeId);
      const isAlt=ae?.isAltruistic&&!ae?.altruismBonusClaimed;
      return(
        <>
        <div style={{position:"fixed",top:"calc(48px + env(safe-area-inset-top))",left:0,right:0,zIndex:99,background:c.bg,borderBottom:"1px solid "+c.cb,padding:"10px 20px"}}>
          <div style={{maxWidth:540,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:c.tm}}>{t.prog}</span><span style={{fontSize:13,color:all?c.gr:c.ac,fontWeight:600}}>{dn} {t.sOf} {tt}</span></div>
            <PBar done={dn} total={tt} c={c}/>
          </div>
        </div>
        <div dir={dir} style={{...sx.pg,paddingTop:"calc(104px + env(safe-area-inset-top))"}}>
        <div className="uw" style={sx.w}>
          <div style={{animation:"fadeIn 0.4s ease"}}>
            {/* Altruistic goal progress indicator */}
            {ae?.isAltruistic&&!ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",display:"flex",alignItems:"center",gap:8}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" style={{display:"block",flexShrink:0}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span style={{fontSize:12,color:c.ac,fontWeight:500,flex:1}}>{t.altruismPopupMsg}</span>
                <button onClick={()=>doShare(steps)} style={{flexShrink:0,padding:"5px 10px",background:"rgba(245,158,11,0.2)",border:"1px solid rgba(245,158,11,0.5)",borderRadius:6,fontSize:12,fontWeight:700,color:"#d97706",cursor:"pointer",whiteSpace:"nowrap"}}>
                  {t.share} →
                </button>
              </div>
            )}
            {ae?.isAltruistic&&ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr,display:"flex",alignItems:"center",gap:8}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.gr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                <span style={{fontSize:12,color:c.gr,fontWeight:600}}>{t.altruismBonusTitle}</span>
              </div>
            )}
            <div style={sx.cd}>
              <h2 style={{fontSize:17,fontWeight:600,color:all?c.gr:c.ac,margin:"0 0 6px",display:"flex",alignItems:"center",gap:6}}>{all&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>}{steps.titel}</h2>
              {ae?.timestamp&&<div style={{fontSize:12,color:c.tf,marginBottom:10}}>{fmtDate(ae.timestamp,ae.timezone||zone,ae.lang||lang)}</div>}
              {all&&<div style={{textAlign:"center",padding:"10px 0 16px",fontSize:14,color:c.gr,fontWeight:600,animation:"pop 0.4s ease"}}>{t.allD}</div>}
              {/* WOOP summary card — collapsible, shown when entry was created via WOOP */}
              {ae?.woop&&(()=>{
                const wLabels=t.woopLabels||["Wish","Outcome","Obstacle","Plan"];
                const wKeys=["wish","outcome","obstacle","plan"];
                const wIcons=[
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{display:"block"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>,
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                ];
                return(
                  <details style={{marginBottom:14,borderRadius:10,border:"1px solid "+c.abr,overflow:"hidden"}}>
                    <summary style={{padding:"10px 14px",cursor:"pointer",background:c.ab,color:c.ac,fontSize:13,fontWeight:600,listStyle:"none",display:"flex",alignItems:"center",gap:6,userSelect:"none"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>{t.woopSummaryTitle||"Your WOOP"}
                    </summary>
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8,background:c.sb}}>
                      {wKeys.map((k,i)=>ae.woop[k]&&(
                        <div key={k} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                          <span style={{flexShrink:0,marginTop:2,color:c.ac,display:"flex"}}>{wIcons[i]}</span>
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:c.tm,marginBottom:1,textTransform:"uppercase",letterSpacing:"0.05em"}}>{wLabels[i]}</div>
                            <div style={{fontSize:13,color:c.tx,lineHeight:1.5}}>{ae.woop[k]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })()}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {steps.stappen.map((s,i)=>(
                  <CheckItem key={i} done={localComp[i]||false} label={s.actie} desc={s.toelichting} onToggle={activeId?()=>toggleStep(i):undefined} c={c}/>
                ))}
              </div>
            </div>
            <button onClick={goHome} style={sx.bg}>{t.resB}</button>
            {ae?.isAltruistic&&!ae?.altruismBonusClaimed&&(
              <p style={{textAlign:"center",fontSize:12,color:"#d97706",fontWeight:600,margin:"14px 0 4px",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {t.altruismShareCta||"Share this plan and earn +2 free questions"}
              </p>
            )}
            <button onClick={()=>doShare(steps)} style={{...sx.bg,marginTop:ae?.isAltruistic&&!ae?.altruismBonusClaimed?4:8,...(ae?.isAltruistic&&!ae?.altruismBonusClaimed?{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.45)",color:"#d97706"}:{}),display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              {t.share||'Share'}
            </button>
            {shareOpen&&(()=>{
              const _shareUrl=shareId?`https://untangle.lol/s/${shareId}`:'https://untangle.lol';
              const _text=buildShareText(steps,_shareUrl);
              const _enc=encodeURIComponent(_text);
              const _url=encodeURIComponent(_shareUrl);
              return(
                <div style={{marginTop:8,padding:'14px 16px',background:c.sb,border:'1px solid '+c.sr,borderRadius:12}}>
                  {shareId&&(
                    <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8,background:c.card,border:'1px solid '+c.cb,borderRadius:10,padding:'8px 12px'}}>
                      <span style={{flex:1,fontSize:12,color:c.tx,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{_shareUrl}</span>
                      <button onClick={()=>copyShareText(_shareUrl)}
                        style={{flexShrink:0,padding:'5px 10px',borderRadius:8,border:'none',background:shareCopied?c.gr:c.ac,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',transition:'background 0.2s'}}>
                        {shareCopied?(t.shareCopied||'Copied!'):(t.shareCopy||'Copy')}
                      </button>
                    </div>
                  )}
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:8}}>
                    {[
                      {id:'whatsapp',label:'WhatsApp',bg:'#25D366',href:'https://wa.me/?text='+_enc},
                      {id:'telegram',label:'Telegram',bg:'#229ED9',href:'https://t.me/share/url?url='+_url+'&text='+_enc},
                      {id:'x',label:'X',bg:'#000',href:'https://x.com/intent/tweet?text='+_enc},
                      {id:'facebook',label:'Facebook',bg:'#1877F2',href:'https://www.facebook.com/sharer/sharer.php?u='+_url+'&quote='+_enc},
                      {id:'viber',label:'Viber',bg:'#7360F2',href:'viber://forward?text='+_enc},
                      {id:'signal',label:'Signal',bg:'#3A76F0',href:'https://signal.me/#p/?message='+_enc},
                    ].map(p=>(
                      <a key={p.id} href={p.href} target="_blank" rel="noreferrer"
                        onClick={()=>{claimAltruismBonus();utrack('share_platform',{platform:p.id});}}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none',minWidth:48}}>
                        <div style={{width:42,height:42,borderRadius:10,background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18}}>
                          {p.id==='whatsapp'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>}
                          {p.id==='telegram'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                          {p.id==='x'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                          {p.id==='facebook'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                          {p.id==='viber'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                          {p.id==='signal'&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                        </div>
                        <span style={{fontSize:9,color:c.tm,textAlign:'center'}}>{p.label}</span>
                      </a>
                    ))}
                    {!shareId&&(
                      <button onClick={()=>copyShareText(_text)}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',minWidth:48,padding:0}}>
                        <div style={{width:42,height:42,borderRadius:10,background:shareCopied?c.gr:c.ghb,border:'1px solid '+(shareCopied?c.gr:c.ghr),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'background 0.2s'}}>
                          {shareCopied?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                        </div>
                        <span style={{fontSize:9,color:shareCopied?c.gr:c.tm,textAlign:'center'}}>{shareCopied?(t.shareCopied||'Copied!'):(t.shareCopy||'Copy')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
             })()}
          </div>
        <BottomBar/><style>{GS}</style></div></div>
        </>
      );
    })()}

    {vw==="woop_input"&&(()=>{
      const labels=t.woopLabels||["Wish","Outcome","Obstacle","Plan"];
      const hints=t.woopHints||["","","",""];
      const phs=t.woopPh||["","","",""];
      const curKey=woopKeys[woopStep];
      const curVal=woopData[curKey]||"";
      const isLast=woopStep===3;
      const allFilled=woopData.wish.trim()&&woopData.outcome.trim()&&woopData.obstacle.trim()&&woopData.plan.trim();
      const STEP_NUMS=["I","II","III","IV"];
      const WOOP_ICONS=[
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{display:"block"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      ];
      return(
        <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}>

          {/* Header */}
          <div style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
              <h1 style={{fontSize:18,fontWeight:800,color:c.tx,margin:0,letterSpacing:"-0.03em"}}>{t.woopTitle||"WOOP"}</h1>
              <a href="https://woopmylife.org/en/science" target="_blank" rel="noopener noreferrer" style={{color:c.ac,fontSize:10,textDecoration:"none",opacity:0.75,letterSpacing:"0.05em",fontWeight:600}}>{t.woopLink||"science ↗"}</a>
            </div>
            <p style={{color:c.tf,fontSize:12,margin:0,lineHeight:1.5}}>{t.woopSub||""}</p>
          </div>

          {/* Chapter-style progress bar */}
          <div style={{display:"flex",gap:4,marginBottom:20,alignItems:"stretch"}}>
            {[0,1,2,3].map(i=>{
              const done=i<woopStep;
              const active=i===woopStep;
              return(
                <button key={i} onClick={()=>setWoopStep(i)} style={{flex:active?2:done?1:1,height:36,borderRadius:8,border:"1px solid "+(active?c.abr:done?c.gbr:c.cb),background:active?c.ab:done?c.gb:"transparent",cursor:"pointer",padding:"0 8px",display:"flex",alignItems:"center",justifyContent:active?"space-between":"center",gap:4,transition:"all 0.25s ease",overflow:"hidden",minWidth:0}}>
                  <span style={{fontSize:9,fontWeight:800,color:active?c.ac:done?c.gr:c.tf,letterSpacing:"0.08em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{active?labels[i].toUpperCase():done?"✓":""}</span>
                  {active&&<span style={{fontSize:16,fontWeight:900,color:c.ac,opacity:0.35,fontVariantNumeric:"tabular-nums",lineHeight:1,flexShrink:0}}>{STEP_NUMS[i]}</span>}
                </button>
              );
            })}
          </div>

          {/* Main card */}
          <div style={{...sx.cd,position:"relative",overflow:"hidden",animation:"fadeIn 0.3s ease"}}>
            {/* Ghost numeral */}
            <div style={{position:"absolute",top:-8,right:8,fontSize:96,fontWeight:900,color:c.ac,opacity:0.045,lineHeight:1,pointerEvents:"none",userSelect:"none",letterSpacing:"-0.05em"}}>{STEP_NUMS[woopStep]}</div>

            {/* Step header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative"}}>
              <div style={{width:32,height:32,borderRadius:8,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",color:c.ac,flexShrink:0}}>{WOOP_ICONS[woopStep]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:c.tx,letterSpacing:"-0.02em"}}>{labels[woopStep]}</div>
                <div style={{fontSize:11,color:c.tm,lineHeight:1.4,marginTop:1}}>{woopStep===3?(hints[3]||"").replace(/\[obstacle\]|\[obstakel\]|\[Hindernis\]|\[obstacle\]|\[obstáculo\]|\[障碍\]|\[बाधा\]|\[obstáculo\]|\[العقبة\]|\[engel\]|\[障害\]|\[hambatan\]|\[engel\]|\[engel\]/gi,woopData.obstacle||"...").replace(/\[action\]|\[actie\]|\[Aktion\]|\[action\]|\[acción\]|\[行动\]|\[कार्य\]|\[ação\]|\[الإجراء\]|\[eylem\]|\[行動\]|\[tindakan\]|\[действие\]|\[কর্ম\]|\[hatua\]/gi,woopData.plan||"..."):hints[woopStep]}</div>
              </div>
            </div>

            <HoneypotField/>
            <textarea
              key={woopStep}
              value={curVal}
              onChange={e=>setWoopData(d=>({...d,[curKey]:e.target.value}))}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(curVal.trim()){if(isLast){if(allFilled)submitWoop();}else{setWoopStep(s=>s+1);}}}}}
              placeholder={phs[woopStep]}
              rows={4}
              style={{...sx.ip,resize:"none",lineHeight:1.6}}
              autoFocus
            />
            {err&&<div style={sx.err}>{err}</div>}

            <div style={{display:"flex",gap:8,marginTop:12,width:"100%"}}>
              {woopStep>0&&(
                <button onClick={()=>{setErr(null);setWoopStep(s=>s-1);}} style={{...sx.bg,marginTop:0,width:"auto",flex:"0 0 auto",padding:"13px 14px"}}>
                  {BACK_SVG}
                </button>
              )}
              {!isLast?(
                <button onClick={()=>{if(curVal.trim())setWoopStep(s=>s+1);}} disabled={!curVal.trim()} style={curVal.trim()?{...sx.bo,marginTop:0,flex:1}:{...sx.bd,marginTop:0,flex:1}}>
                  {labels[woopStep+1]} →
                </button>
              ):(
                <button onClick={submitWoop} disabled={busy||!allFilled} style={busy||!allFilled?{...sx.bd,marginTop:0,flex:1}:{...sx.bo,marginTop:0,flex:1}}>
                  {t.woopGo||"Create my plan →"}
                </button>
              )}
            </div>
          </div>

          {/* Completed steps summary */}
          {woopStep>0&&(
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
              {woopKeys.slice(0,woopStep).map((k,i)=>woopData[k]&&(
                <div key={k} onClick={()=>setWoopStep(i)} style={{padding:"8px 12px",borderRadius:8,background:c.gb,border:"1px solid "+c.gbr,display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}}>
                  <span style={{color:c.gr,flexShrink:0,marginTop:1}}>{WOOP_ICONS[i]}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:c.gr,marginBottom:1,letterSpacing:"0.05em"}}>{labels[i].toUpperCase()}</div>
                    <div style={{fontSize:12,color:c.tm,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{woopData[k]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={()=>{setErr(null);setVw(auth==="in"?"new_goal":"home");}} style={{...sx.bg,marginTop:10}}><span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>{BACK_SVG}{t.back||"Back"}</span></button>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}


    {vw==="feedback"&&(
      <><FeedbackPage c={c} sx={sx} t={t} dir={dir} onBack={()=>setVw(auth==="in"?"dash":"home")}/><BottomBar/><style>{GS}</style></>
    )}

    {vw==="terms"&&(
      <><LegalView type="terms" lang={lang} c={c} sx={sx} t={t} dir={dir} onBack={()=>setVw(auth==="in"?"dash":"home")} onSwitch={()=>setVw("privacy")}/><BottomBar/><style>{GS}</style></>
    )}

    {vw==="privacy"&&(
      <><LegalView type="privacy" lang={lang} c={c} sx={sx} t={t} dir={dir} onBack={()=>setVw(auth==="in"?"dash":"home")} onSwitch={()=>setVw("terms")}/><BottomBar/><style>{GS}</style></>
    )}

    {vw==="donate"&&(
      <><DonateView lang={lang} c={c} sx={sx} t={t} dir={dir} onBack={()=>setVw(auth==="in"?"dash":"home")}/><BottomBar/><style>{GS}</style></>
    )}

    {vw==="uitleg"&&(
      <><HowItWorksView lang={lang} c={c} sx={sx} t={t} dir={dir} onBack={()=>setVw(auth==="in"?"dash":"home")} onStart={()=>setVw(auth==="in"?"new_goal":"home")}/><BottomBar/><style>{GS}</style></>
    )}

    {!["lang","byok","no_credits","manage_auth","loading","home","new_goal","dash","result","save_prompt","woop_input","feedback","terms","privacy","donate","uitleg"].includes(vw)&&(
      <div dir={dir} style={sx.pg}><div className="uw" style={sx.w}><div style={{textAlign:"center",padding:40}}><button onClick={()=>setVw("lang")} style={sx.bo}>Start</button></div><BottomBar/><style>{GS}</style></div></div>
    )}
  </>);
}
