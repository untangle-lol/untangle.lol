import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ANTHROPIC   = "claude-sonnet-4-6";
const MODEL_OPENROUTER  = "anthropic/claude-sonnet-4-6";
// Pricing per 1M tokens (USD) — claude-sonnet-4-6
const PRICE = { input: 3.00, output: 15.00 };
function calcCost(inp,out){ return (inp/1e6)*PRICE.input + (out/1e6)*PRICE.output; }
function fmtCost(usd){ return usd<0.001?"<$0.001":"$"+usd.toFixed(4); }

// ─── localStorage helpers (replaces window.storage) ─────────────────────────
const ls = {
  get: (k)       => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v)    => { try { localStorage.setItem(k, v); }        catch {} },
  del: (k)       => { try { localStorage.removeItem(k); }        catch {} },
};

const KEYS = {
  theme:    "untangle_theme",
  session:  "untangle_session",
  apiKey:   "untangle_apikey",
  recents:  "untangle_recents",
  guestHist:"untangle_guest_hist",
  usage:    "untangle_usage",
};

function eKey(email) { return "untangle_hist_" + email.toLowerCase().replace(/[^a-z0-9]/g,"_"); }

// ─── Auth helpers ─────────────────────────────────────────────────────────────
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
// ─── Languages ───────────────────────────────────────────────────────────────
const LANGS = [
  {code:"nl",label:"Nederlands",flag:"🇳🇱",ph:"Bijv. 'Ik wil beter slapen' of 'Ik wil leren gitaarspelen' 🎸",hero:"Wat wil je bereiken?",heroS:"Typ het maar in.",go:"Laten we beginnen →",back:"← Terug",out:"Uitloggen",clr:"🗑️ Alles wissen",nG:"➕ Nieuw doel",noG:"Nog geen doelen. Tijd om te beginnen!",prog:"voortgang",allD:"🎉 Alles afgerond!",sOf:"van",eth:"🌍 Advies met respect voor mens, planeet en welzijn",err:"Oeps, probeer het nog eens!",resB:"← Terug naar overzicht",dW:"Welkom terug",dS:"Hier zijn je doelen.",byok:"Voer je API-sleutel in",sso:"Inloggen met Claude",byokL:"API-sleutel (Anthropic of OpenRouter)",byokPh:"sk-ant-... of sk-or-...",byokSave:"Opslaan & beginnen",byokNote:"Je sleutel wordt lokaal opgeslagen. Nooit gedeeld. Ondersteunt Anthropic (sk-ant-) en OpenRouter (sk-or-).",ssoNote:"Vereist OAuth-app bij Anthropic.",chAuth:"Authenticatie wijzigen",rmKey:"Sleutel verwijderen",lSel:"Taal",emL:"E-mailadres",emPh:"jouw@email.nl",svPro:"Wil je dit opslaan?",svD:"Log in om je stappenplan te bewaren.",skip:"Nee, doorgaan",has:"Ik heb al een account",sendM:"Stuur magic link ✉️",chk:"Check je inbox!",magOn:"Magic link onderweg naar",sim:"Simulatie. Klik hieronder 😉",opM:"Open magic link →",welcome:"Welkom!",sub:"Vul je e-mail in voor een magic link."},
  {code:"en",label:"English",flag:"🇬🇧",ph:"E.g. 'I want to sleep better' or 'I want to learn guitar' 🎸",hero:"What do you want to achieve?",heroS:"Just type it in. No question is too weird.",go:"Let's begin →",back:"← Back",out:"Log out",clr:"🗑️ Clear all",nG:"➕ New goal",noG:"No goals yet. Time to begin!",prog:"progress",allD:"🎉 All done!",sOf:"of",eth:"🌍 Advice with respect for people, planet & wellbeing",err:"Oops, try again!",resB:"← Back to overview",dW:"Welcome back",dS:"Here are your goals.",byok:"Enter your API key",sso:"Sign in with Claude",byokL:"API Key (Anthropic or OpenRouter)",byokPh:"sk-ant-... or sk-or-...",byokSave:"Save & continue",byokNote:"Stored locally only, never shared. Supports Anthropic (sk-ant-) and OpenRouter (sk-or-).",ssoNote:"Requires an OAuth app registered with Anthropic.",chAuth:"Change auth",rmKey:"Remove key",lSel:"Language",emL:"Email",emPh:"you@email.com",svPro:"Save this?",svD:"Log in to keep your plan.",skip:"No, continue",has:"I have an account",sendM:"Send magic link ✉️",chk:"Check your inbox!",magOn:"Magic link on its way to",sim:"Simulation. Click below 😉",opM:"Open magic link →",welcome:"Welcome!",sub:"Enter your email for a magic link."},
  {code:"de",label:"Deutsch",flag:"🇩🇪",ph:"Z.B. 'Besser schlafen' 🎸",hero:"Was willst du erreichen?",heroS:"Einfach tippen.",go:"Los geht's →",back:"← Zurück",out:"Abmelden",clr:"🗑️ Löschen",nG:"➕ Neues Ziel",noG:"Keine Ziele. Zeit anzufangen!",prog:"Fortschritt",allD:"🎉 Geschafft!",sOf:"von",eth:"🌍 Respekt für Mensch & Planet",err:"Ups!",resB:"← Zurück",dW:"Willkommen zurück",dS:"Deine Ziele.",byok:"API-Schlüssel eingeben",sso:"Mit Claude anmelden",byokL:"API-Schlüssel (Anthropic oder OpenRouter)",byokPh:"sk-ant-... oder sk-or-...",byokSave:"Speichern & loslegen",byokNote:"Lokal gespeichert. Nie weitergegeben. Anthropic (sk-ant-) und OpenRouter (sk-or-).",ssoNote:"Erfordert OAuth-App bei Anthropic.",chAuth:"Auth ändern",rmKey:"Schlüssel entfernen",lSel:"Sprache",emL:"E-Mail",emPh:"du@email.de",svPro:"Speichern?",svD:"Anmelden.",skip:"Nein",has:"Habe Konto",sendM:"Senden ✉️",chk:"Check Postfach!",magOn:"Unterwegs an",sim:"Simulation 😉",opM:"Öffnen →",welcome:"Willkommen!",sub:"E-Mail für Magic Link."},
  {code:"fr",label:"Français",flag:"🇫🇷",ph:"Ex. 'Mieux dormir' 🎸",hero:"Que veux-tu accomplir ?",heroS:"Tape-le.",go:"Commençons →",back:"← Retour",out:"Déco",clr:"🗑️ Effacer",nG:"➕ Nouveau",noG:"Pas d'objectifs. On commence !",prog:"progrès",allD:"🎉 Fini !",sOf:"de",eth:"🌍 Conseils respectueux",err:"Oups !",resB:"← Retour",dW:"Re-bonjour",dS:"Tes objectifs.",byok:"Entrer la clé API",sso:"Se connecter avec Claude",byokL:"Clé API (Anthropic ou OpenRouter)",byokPh:"sk-ant-... ou sk-or-...",byokSave:"Enregistrer",byokNote:"Stockée localement. Anthropic (sk-ant-) et OpenRouter (sk-or-).",ssoNote:"Nécessite une app OAuth Anthropic.",chAuth:"Changer auth",rmKey:"Supprimer clé",lSel:"Langue",emL:"Email",emPh:"toi@email.com",svPro:"Sauver ?",svD:"Connecte-toi.",skip:"Non",has:"J'ai un compte",sendM:"Envoyer ✉️",chk:"Vérifie !",magOn:"En route vers",sim:"Simulation 😉",opM:"Ouvrir →",welcome:"Bienvenue !",sub:"Email pour lien magique."},
  {code:"es",label:"Español",flag:"🇪🇸",ph:"Ej. 'Quiero dormir mejor' 🎸",hero:"¿Qué quieres lograr?",heroS:"Solo escríbelo.",go:"Comencemos →",back:"← Volver",out:"Salir",clr:"🗑️ Borrar",nG:"➕ Nueva meta",noG:"Sin metas. ¡Hora de comenzar!",prog:"progreso",allD:"🎉 ¡Listo!",sOf:"de",eth:"🌍 Consejos con respeto",err:"¡Ups!",resB:"← Volver",dW:"Hola de nuevo",dS:"Tus metas.",byok:"Ingresar clave API",sso:"Iniciar con Claude",byokL:"Clave API (Anthropic u OpenRouter)",byokPh:"sk-ant-... o sk-or-...",byokSave:"Guardar",byokNote:"Solo local. Anthropic (sk-ant-) y OpenRouter (sk-or-).",ssoNote:"Requiere app OAuth de Anthropic.",chAuth:"Cambiar auth",rmKey:"Eliminar clave",lSel:"Idioma",emL:"Correo",emPh:"tu@email.com",svPro:"¿Guardar?",svD:"Inicia sesión.",skip:"No",has:"Tengo cuenta",sendM:"Enviar ✉️",chk:"¡Revisa!",magOn:"En camino a",sim:"Simulación 😉",opM:"Abrir →",welcome:"¡Bienvenido!",sub:"Email para enlace mágico."},
];

const TH = {
  dark:{bg:"linear-gradient(135deg,#0f172a,#1e293b,#0f172a)",card:"rgba(255,255,255,0.05)",cb:"rgba(255,255,255,0.08)",ib:"rgba(255,255,255,0.06)",ibr:"rgba(255,255,255,0.12)",tx:"#f1f5f9",tm:"#94a3b8",tf:"#64748b",ac:"#facc15",ag:"linear-gradient(135deg,#facc15,#eab308)",ab:"rgba(250,204,21,0.15)",abr:"rgba(250,204,21,0.4)",am:"rgba(250,204,21,0.2)",bt:"#0f172a",gr:"#22c55e",gb:"rgba(34,197,94,0.06)",gbr:"rgba(34,197,94,0.12)",gt:"#6ee7a0",eb:"rgba(239,68,68,0.12)",et:"#fca5a5",ghb:"rgba(255,255,255,0.06)",ghr:"rgba(255,255,255,0.1)",ckb:"rgba(255,255,255,0.06)",ckr:"rgba(255,255,255,0.15)",cm:"#0f172a",dt:"#4a6350",sb:"rgba(255,255,255,0.02)",sr:"rgba(255,255,255,0.06)",dm:"#475569",sh:"none"},
  light:{bg:"linear-gradient(135deg,#f8fafc,#e2e8f0,#f8fafc)",card:"rgba(255,255,255,0.9)",cb:"rgba(0,0,0,0.08)",ib:"#fff",ibr:"rgba(0,0,0,0.15)",tx:"#1e293b",tm:"#64748b",tf:"#94a3b8",ac:"#b45309",ag:"linear-gradient(135deg,#f59e0b,#d97706)",ab:"rgba(245,158,11,0.12)",abr:"rgba(245,158,11,0.4)",am:"rgba(245,158,11,0.15)",bt:"#fff",gr:"#16a34a",gb:"rgba(22,163,74,0.06)",gbr:"rgba(22,163,74,0.15)",gt:"#16a34a",eb:"rgba(239,68,68,0.08)",et:"#dc2626",ghb:"rgba(0,0,0,0.03)",ghr:"rgba(0,0,0,0.1)",ckb:"#fff",ckr:"rgba(0,0,0,0.2)",cm:"#fff",dt:"#4d7c56",sb:"rgba(0,0,0,0.015)",sr:"rgba(0,0,0,0.06)",dm:"#94a3b8",sh:"0 1px 3px rgba(0,0,0,0.06)"},
};

const GS=`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.4);opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}`;

function tz(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch{return"UTC"}}
function fmtDate(iso,z,lc){try{return new Date(iso).toLocaleString(lc||undefined,{timeZone:z,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return new Date(iso).toLocaleString()}}
function tAgo(iso,lc){const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(lc==="nl"){if(m<60)return m+" min geleden";if(h<24)return h+" uur geleden";return dy===1?"gisteren":dy+" dagen geleden";}if(m<60)return m+"m ago";if(h<24)return h+"h ago";return dy===1?"yesterday":dy+"d ago";}

const LP=[["🧠","Thinking..."],["☕","Brewing ideas..."],["🔮","Crystal ball warming up..."],["🧙","Casting spells..."],["🤔","Deep thought..."],["🎯","Locking in..."]];

function Loader({c}){
  const [i,setI]=useState(0);const [d,setD]=useState("");const [b,setB]=useState(false);
  useEffect(()=>{let x=0;const a=setInterval(()=>{x=(x+1)%LP.length;setI(x);setB(true);setTimeout(()=>setB(false),400);},2400);const dd=setInterval(()=>setD(p=>p.length>=3?"":p+"."),500);return()=>{clearInterval(a);clearInterval(dd);};},[]);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px"}}><div style={{fontSize:56,transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",transform:b?"scale(1.3) rotate(10deg)":"scale(1)",marginBottom:20}}>{LP[i][0]}</div><div style={{fontSize:16,color:c.tx,fontWeight:500}}>{LP[i][1]}{d}</div><div style={{marginTop:24,display:"flex",gap:8}}>{[0,1,2].map(j=>(<div key={j} style={{width:10,height:10,borderRadius:"50%",background:c.ac,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>))}</div></div>);
}

function PBar({done,total,c}){
  const p=total>0?(done/total)*100:0;
  return(<div style={{width:"100%",height:6,borderRadius:3,background:c.ghr,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:p>=100?c.gr:c.ac,width:p+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/></div>);
}
function TTog({mode,set,c}){
  const ic={light:"☀️",dark:"🌙",system:"💻"};const nx={light:"dark",dark:"system",system:"light"};
  return(<button onClick={()=>set(nx[mode])} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:c.tm}}>{ic[mode]} {mode}</button>);
}
function BrandMark({c,size}){
  const s=size==="large";
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:s?6:2,marginBottom:s?8:4}}>
    <div style={{fontSize:s?44:32,filter:"drop-shadow(0 0 12px "+c.am+")"}}>🪢</div>
    <div style={{fontSize:s?28:20,fontWeight:800,letterSpacing:"-0.03em",color:c.tx,lineHeight:1}}>untangle</div>
    <div style={{fontSize:s?11:9,fontWeight:500,letterSpacing:"0.15em",color:c.tf,textTransform:"uppercase"}}>.lol</div>
  </div>);
}
function CheckItem({done,label,desc,onToggle,c}){
  return(<div onClick={onToggle} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 14px",borderRadius:12,cursor:onToggle?"pointer":"default",background:done?c.gb:c.sb,border:"1px solid "+(done?c.gbr:c.sr),transition:"all 0.2s",opacity:done?0.75:1,userSelect:"none"}}>
    <div style={{width:28,height:28,minWidth:28,borderRadius:8,background:done?c.gr:c.ckb,border:"2px solid "+(done?c.gr:c.ckr),display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,flexShrink:0,fontSize:16,color:c.cm}}>{done?"✓":""}</div>
    <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:done?c.gr:c.tx,marginBottom:3,textDecoration:done?"line-through":"none"}}>{label}</div><div style={{fontSize:13,color:done?c.dt:c.tm,lineHeight:1.5}}>{desc}</div></div>
  </div>);
}

// ─── Auth badge ───────────────────────────────────────────────────────────────
function AuthBadge({c,onManage}){
  const {key}=getCredential();
  return(
    <button onClick={onManage} style={{display:"flex",alignItems:"center",gap:6,background:c.ab,border:"1px solid "+c.abr,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:c.ac}}>
      <span>🔑 API Key</span>
      <span style={{opacity:0.6}}>·</span>
      <span style={{color:c.tf}}>{key?key.slice(0,10)+"…":"set"}</span>
    </button>
  );
}

export default function App(){
  const [sys,setSys]=useState(()=>{try{return window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}catch{return"dark"}});
  useEffect(()=>{try{const q=window.matchMedia("(prefers-color-scheme:dark)");const h=e=>setSys(e.matches?"dark":"light");q.addEventListener("change",h);return()=>q.removeEventListener("change",h);}catch{}},[]);

  const [tm,setTm]=useState("system");
  const [lang,setLang]=useState(null);
  const [auth,setAuth]=useState("out"); // out | in
  const [user,setUser]=useState(null);
  const [em,setEm]=useState("");
  const [inp,setInp]=useState("");
  const [steps,setSteps]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [hist,setHist]=useState([]);
  const [vw,setVw]=useState("splash"); // splash|lang|auth_setup|byok|sso_pending|home|dash|new_goal|loading|result|save_prompt|magic|manage_auth
  const [activeId,setActiveId]=useState(null);
  const [pend,setPend]=useState(null);
  const [localComp,setLocalComp]=useState([]);
  const [apiKeyInput,setApiKeyInput]=useState("");
  const [apiKeyErr,setApiKeyErr]=useState("");
  const [ready,setReady]=useState(false);
  const [recents,setRecents]=useState([]);
  const [usage,setUsage]=useState({calls:0,inputTokens:0,outputTokens:0,costUsd:0});
  const userRef=useRef(null);
  const zone=useMemo(()=>tz(),[]);

  const t=lang?LANGS.find(l=>l.code===lang)||LANGS[1]:LANGS[1];
  const rt=tm==="system"?sys:tm;
  const c=TH[rt];

  const chTm=async(m)=>{setTm(m);ls.set(KEYS.theme,m);};

  // Sync browser theme-color, html/body background with resolved theme
  useEffect(()=>{
    const color=rt==="dark"?"#0f172a":"#f8fafc";
    let tag=document.querySelector("meta[name='theme-color']");
    if(!tag){tag=document.createElement("meta");tag.name="theme-color";document.head.appendChild(tag);}
    tag.content=color;
    document.documentElement.style.background=color;
    document.body.style.background=color;
  },[rt]);

  // Persist history
  const persistHist=useCallback(async(nh)=>{const u=userRef.current;if(u)ls.set(eKey(u),JSON.stringify(nh));},[]);

  // Boot: restore session and theme
  useEffect(()=>{(async()=>{
    const sv=ls.get(KEYS.theme);if(sv)setTm(sv);
    const langSv=ls.get("untangle_lang");if(langSv)setLang(langSv);
    const rv=ls.get(KEYS.recents);if(rv){try{setRecents(JSON.parse(rv));}catch{}}
    const uv=ls.get(KEYS.usage);if(uv){try{setUsage(JSON.parse(uv));}catch{}}

    // Check credentials
    const {valid}=getCredential();
    // Restore session
    const ss=ls.get(KEYS.session);
    if(ss){try{const p=JSON.parse(ss);if(p.email&&p.lang){setUser(p.email);userRef.current=p.email;setLang(p.lang);ls.set("untangle_lang",p.lang);setAuth("in");const hv=ls.get(eKey(p.email));if(hv)setHist(JSON.parse(hv));setVw(valid?"dash":"byok");setReady(true);return;}}catch{}}

    // Restore guest history
    const gh=ls.get(KEYS.guestHist);if(gh){try{setHist(JSON.parse(gh));}catch{}}

    setVw(valid?langSv?"home":"lang":"lang");
    setReady(true);
  })();},[]);

  // Save key flow
  const saveApiKey=async()=>{
    const k=apiKeyInput.trim();
    const provider=keyProvider(k);
    if(!k.startsWith("sk-ant-")&&!k.startsWith("sk-or-")){setApiKeyErr("Key should start with sk-ant- or sk-or-");return;}
    ls.set(KEYS.apiKey,k);
    setApiKeyErr("");setApiKeyInput("");
    // Test key with a tiny call
    setBusy(true);
    try{
      let ok=false;
      if(provider==="openrouter"){
        const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr("Invalid key: "+d.error.message);setBusy(false);return;}
        ok=true;
      }else{
        const r=await fetch(ANTHROPIC_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_ANTHROPIC,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr("Invalid key: "+d.error.message);setBusy(false);return;}
        ok=true;
      }
      if(!ok)throw new Error("fail");
    }catch(e){if(!apiKeyErr){ls.del(KEYS.apiKey);setApiKeyErr("Could not reach API.");}setBusy(false);return;}
    setBusy(false);
    setVw(auth==="in"?"dash":lang?"home":"lang");
  };

  const removeAuth=()=>{ls.del(KEYS.apiKey);setVw("byok");};

  // Magic link login (simulated)
  const login=async(email)=>{
    const u=email.trim().toLowerCase();setUser(u);userRef.current=u;setAuth("in");
    ls.set(KEYS.session,JSON.stringify({email:u,lang}));
    const hv=ls.get(eKey(u));const h=hv?JSON.parse(hv):[];
    if(pend){const nh=[pend,...h];setHist(nh);ls.set(eKey(u),JSON.stringify(nh));setPend(null);setActiveId(pend.id);setLocalComp(pend.completed);setVw("result");}
    else{setHist(h);setVw("dash");}
  };
  const logout=()=>{ls.del(KEYS.session);setAuth("out");setUser(null);userRef.current=null;setEm("");setHist([]);setSteps(null);setInp("");setVw("home");setActiveId(null);setPend(null);setLocalComp([]);};

  const pickLang=(code)=>{setLang(code);ls.set("untangle_lang",code);const {valid}=getCredential();setVw(valid?"home":"byok");};

  // ─── API call helper ──────────────────────────────────────────────────────
  const callAPI=async(messages,maxTokens=1000)=>{
    const {key,provider}=getCredential();
    if(provider==="openrouter"){
      const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(key),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:maxTokens,messages})});
      if(!r.ok)throw new Error("fail");
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const text=(d.choices||[]).map(c=>c.message?.content||"").join("");
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

  const prompt=(ui)=>`You are a friendly, humorous coach. You are the AI behind Untangle.lol.\nRespond ENTIRELY in ${t.label}.\nGoal: "${ui}"\nPRINCIPLES: Wellbeing, honesty, sustainability.\nSTYLE: doable today/this week, casual, emoji in title, specific, 3-5 steps.\nJSON only, no markdown:\n{"titel":"Summary","stappen":[{"nummer":1,"actie":"Emoji + title","toelichting":"1-2 sentences"}]}`;

  const submit=async()=>{
    if(!inp.trim()||busy)return;
    const {valid}=getCredential();
    if(!valid){setVw("byok");return;}
    setBusy(true);setErr(null);setSteps(null);setVw("loading");
    try{
      const tx=await callAPI([{role:"user",content:prompt(inp.trim())}],1000);
      const ps=JSON.parse(tx.replace(/```json\s?|```/g,"").trim());
      if(!ps.titel||!ps.stappen)throw new Error("bad");
      setSteps(ps);
      // Save to recents
      const trimmed=inp.trim();
      setRecents(prev=>{const next=[trimmed,...prev.filter(r=>r!==trimmed)].slice(0,5);ls.set(KEYS.recents,JSON.stringify(next));return next;});
      const comp=ps.stappen.map(()=>false);
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:inp.trim(),resultaat:ps,lang,completed:comp};
      if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
      else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
    }catch(e){setErr(t.err);setVw(auth==="in"?"new_goal":"home");}finally{setBusy(false);}
  };

  const toggleStep=(idx)=>{
    setLocalComp(prev=>{
      const next=[...prev];next[idx]=!next[idx];
      if(activeId&&auth==="in"){setHist(ph=>{const nh=ph.map(h=>h.id!==activeId?h:{...h,completed:next});ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
      else if(activeId){setHist(ph=>{const nh=ph.map(h=>h.id!==activeId?h:{...h,completed:next});ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      return next;
    });
  };

  const openEntry=(entry)=>{setSteps(entry.resultaat);setActiveId(entry.id);setLocalComp(entry.completed||entry.resultaat.stappen.map(()=>false));setVw("result");};
  const del=(id)=>{const nh=hist.filter(h=>h.id!==id);setHist(nh);if(auth==="in")ls.set(eKey(userRef.current),JSON.stringify(nh));else ls.set(KEYS.guestHist,JSON.stringify(nh));};
  const clrAll=()=>{setHist([]);if(auth==="in")ls.set(eKey(userRef.current),"[]");else ls.set(KEYS.guestHist,"[]");};
  const goHome=()=>{setInp("");setSteps(null);setErr(null);setActiveId(null);setLocalComp([]);setVw(auth==="in"?"dash":"home");};
  const prog=(e)=>{const tt=e.resultaat?.stappen?.length||0;const dn=(e.completed||[]).filter(Boolean).length;return{dn,tt,pct:tt>0?Math.round(dn/tt*100):0};};

  // ─── Shared styles ────────────────────────────────────────────────────────
  const sx={
    pg:{minHeight:"100dvh",background:c.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"12px 20px",paddingTop:"calc(12px + env(safe-area-inset-top))",paddingBottom:"calc(20px + env(safe-area-inset-bottom))",fontFamily:"'Inter',-apple-system,sans-serif",transition:"background 0.4s"},
    w:{width:"100%",maxWidth:540,flex:1,display:"flex",flexDirection:"column",justifyContent:"center"},
    cd:{background:c.card,borderRadius:16,padding:24,border:"1px solid "+c.cb,boxShadow:c.sh,transition:"all 0.3s"},
    ip:{width:"100%",background:c.ib,border:"2px solid "+c.ibr,borderRadius:10,padding:"13px 16px",color:c.tx,fontSize:16,outline:"none",boxSizing:"border-box"},
    bo:{width:"100%",marginTop:14,padding:"13px 20px",background:c.ag,color:c.bt,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer"},
    bd:{width:"100%",marginTop:14,padding:"13px 20px",background:c.am,color:c.tm,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"not-allowed"},
    bg:{width:"100%",marginTop:12,padding:"12px 20px",background:c.ghb,color:c.tm,border:"1px solid "+c.ghr,borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer"},
    note:{fontSize:12,color:c.tf,marginTop:8,textAlign:"center"},
    err:{marginTop:10,padding:"10px 14px",background:c.eb,borderRadius:8,color:c.et,fontSize:13},
  };

  const Bar=({showLogin,showAuth=true})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:8}}>
      <button onClick={()=>setVw("lang")} style={{background:"none",border:"none",color:c.tf,fontSize:12,cursor:"pointer",padding:0,flexShrink:0}}>🌍 {t.lSel}</button>
      {showAuth&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
        <AuthBadge c={c} onManage={()=>setVw("manage_auth")}/>
        {!showLogin&&user&&<button onClick={logout} style={{background:"none",border:"none",color:c.tf,fontSize:12,cursor:"pointer"}}>{t.out}</button>}
      </div>}
      <TTog mode={tm} set={chTm} c={c}/>
    </div>
  );

  const Err=()=>err?(<div style={sx.err}>{err}</div>):null;

  if(!ready)return (<div style={{minHeight:"100dvh",background:c.bg}}><style>{GS}</style></div>);

  // ─── LANG SELECT ─────────────────────────────────────────────────────────
  if(vw==="lang")return(
    <div style={{...sx.pg,direction:"ltr"}}><div style={sx.w}>
      <Bar showLogin={false} showAuth={false}/>
      <div style={{textAlign:"center",marginBottom:28}}><BrandMark c={c} size="large"/><p style={{color:c.tm,fontSize:14,marginTop:10}}>Choose your language</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {LANGS.map(l=>(
          <button key={l.code} onClick={()=>pickLang(l.code)} style={{...sx.cd,padding:"16px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c.abr;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=c.cb;e.currentTarget.style.transform="scale(1)";}}>
            <span style={{fontSize:28}}>{l.flag}</span><span style={{color:c.tx,fontSize:15,fontWeight:500}}>{l.label}</span>
          </button>))}
      </div>
    <style>{GS}</style></div></div>
  );

  // ─── BYOK FORM ────────────────────────────────────────────────────────────
  if(vw==="byok")return(
    <div style={sx.pg}><div style={sx.w}>
      <Bar showLogin={false} showAuth={false}/>
      <div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>🔑 {t.byokL}</h1></div>
      <div style={sx.cd}>
        <label style={{fontSize:13,color:c.tm,fontWeight:500,display:"block",marginBottom:8}}>{t.byokL}</label>
        <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveApiKey()} placeholder={t.byokPh} style={sx.ip} autoFocus/>
        {apiKeyErr&&<div style={sx.err}>{apiKeyErr}</div>}
        <p style={sx.note}>{t.byokNote} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{color:c.ac}}>Get a key →</a></p>
        <button onClick={saveApiKey} disabled={busy||!apiKeyInput.trim()} style={!apiKeyInput.trim()||busy?sx.bd:sx.bo}>{busy?"Checking...":t.byokSave}</button>
        <button onClick={()=>setVw(lang?"home":"lang")} style={sx.bg}>{t.back}</button>
      </div>
    <style>{GS}</style></div></div>
  );

  // ─── MANAGE AUTH ──────────────────────────────────────────────────────────
  if(vw==="manage_auth"){
    const {key,provider}=getCredential();
    const providerLabel=provider==="openrouter"?"OpenRouter":"Anthropic";
    return(
      <div style={sx.pg}><div style={sx.w}>
        <Bar showLogin={false} showAuth={false}/>
        <div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.chAuth}</h1></div>
        <div style={sx.cd}>
          {key&&<div style={{padding:"14px 16px",background:c.ab,borderRadius:10,marginBottom:12}}>
            <div style={{fontSize:13,color:c.tm,marginBottom:4}}>API Key · <span style={{fontWeight:600,color:c.ac}}>{providerLabel}</span></div>
            <div style={{fontSize:14,fontWeight:500,color:c.ac,fontFamily:"monospace"}}>{key.slice(0,14)}…</div>
          </div>}
          <button onClick={()=>setVw("byok")} style={sx.bo}>🔑 {t.byok}</button>
          <button onClick={removeAuth} style={{...sx.bg,color:"#ef4444",borderColor:"rgba(239,68,68,0.3)",marginTop:12}}>{t.rmKey}</button>
          <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
        </div>
      <style>{GS}</style></div></div>
    );
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if(vw==="loading")return(<div style={sx.pg}><div style={sx.w}><Bar showLogin={false} showAuth={false}/><div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/></div><div style={sx.cd}><Loader c={c}/></div><style>{GS}</style></div></div>);

  // ─── HOME (guest) ─────────────────────────────────────────────────────────
  if((vw==="home"||vw==="new_goal")&&auth!=="in")return(
    <div style={sx.pg}><div style={sx.w}><Bar showLogin={false}/>
      <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c} size="large"/><h1 style={{fontSize:26,fontWeight:700,color:c.tx,margin:"10px 0 0"}}>{t.hero}</h1><p style={{color:c.tm,fontSize:14,marginTop:4}}>{t.heroS}</p></div>
      <div style={sx.cd}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={t.ph} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6}}/>
        {recents.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{recents.map((r,i)=>(<button key={i} onClick={()=>setInp(r)} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:20,padding:"4px 12px",fontSize:12,color:c.tm,cursor:"pointer",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</button>))}</div>}
        <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button><Err/>
      </div>
      <div style={{textAlign:"center",marginTop:14,padding:"10px 16px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr}}><span style={{fontSize:12,color:c.gt}}>{t.eth}</span></div>
      {hist.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
        {hist.map((h,i)=>{const p=prog(h);return(
          <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
            onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.pct>=100?"✅ ":""}{h.resultaat?.titel||h.behoefte}</div>
                <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
            </div>
            <PBar done={p.dn} total={p.tt} c={c}/>
          </div>);})}
        {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
      </div>}
    <style>{GS}</style></div></div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  if(vw==="dash")return(
    <div style={sx.pg}><div style={sx.w}><Bar showLogin={false}/>
      <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"6px 0 0"}}>{t.dW} 👋</h1><p style={{color:c.tm,fontSize:13,marginTop:2}}>{t.dS}</p></div>
      <button onClick={()=>setVw("new_goal")} style={{...sx.bo,marginTop:0,marginBottom:16}}>{t.nG}</button>
      {hist.length===0?(<div style={{...sx.cd,textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:10}}>🪢</div><p style={{color:c.tf,margin:0}}>{t.noG}</p></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{hist.map((h,i)=>{const p=prog(h);return(
          <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
            onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.pct>=100?"✅ ":""}{h.resultaat?.titel||h.behoefte}</div>
                <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
            </div>
            <PBar done={p.dn} total={p.tt} c={c}/>
          </div>);})}
          {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
        </div>
      )}<style>{GS}</style></div></div>
  );

  // ─── NEW GOAL (logged in) ─────────────────────────────────────────────────
  if(vw==="new_goal"&&auth==="in")return(
    <div style={sx.pg}><div style={sx.w}><Bar showLogin={false}/>
      <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:22,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.hero}</h1><p style={{color:c.tm,fontSize:13,marginTop:2}}>{t.heroS}</p></div>
      <div style={sx.cd}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={t.ph} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6}}/>
        {recents.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{recents.map((r,i)=>(<button key={i} onClick={()=>setInp(r)} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:20,padding:"4px 12px",fontSize:12,color:c.tm,cursor:"pointer",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</button>))}</div>}
        <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button><Err/>
      </div>
      <button onClick={()=>setVw("dash")} style={sx.bg}>{t.back}</button>
    <style>{GS}</style></div></div>
  );

  // ─── RESULT ───────────────────────────────────────────────────────────────
  if((vw==="result"||vw==="save_prompt")&&steps){
    const dn=localComp.filter(Boolean).length;const tt=steps.stappen.length;const all=tt>0&&dn===tt;
    const ae=hist.find(h=>h.id===activeId)||pend;
    return(
      <div style={sx.pg}><div style={sx.w}>
        {auth==="in"?<Bar showLogin={false}/>:<Bar showLogin={false} showAuth={false}/>}
        <div style={{animation:"fadeIn 0.4s ease"}}>
          <div style={sx.cd}>
            <h2 style={{fontSize:17,fontWeight:600,color:all?c.gr:c.ac,margin:"0 0 6px"}}>{all?"✅ ":""}{steps.titel}</h2>
            {ae?.timestamp&&<div style={{fontSize:12,color:c.tf,marginBottom:10}}>{fmtDate(ae.timestamp,ae.timezone||zone,ae.lang||lang)}</div>}
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:c.tm}}>{t.prog}</span><span style={{fontSize:13,color:all?c.gr:c.ac,fontWeight:600}}>{dn} {t.sOf} {tt}</span></div>
              <PBar done={dn} total={tt} c={c}/>
            </div>
            {all&&<div style={{textAlign:"center",padding:"10px 0 16px",fontSize:14,color:c.gr,fontWeight:600,animation:"pop 0.4s ease"}}>{t.allD}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {steps.stappen.map((s,i)=>(
                <CheckItem key={i} done={localComp[i]||false} label={s.actie} desc={s.toelichting} onToggle={activeId?()=>toggleStep(i):undefined} c={c}/>
              ))}
            </div>
          </div>
          <button onClick={goHome} style={sx.bg}>{t.resB}</button>
        </div>
      <style>{GS}</style></div></div>
    );
  }

  // Fallback
  return(<div style={sx.pg}><div style={sx.w}><div style={{textAlign:"center",padding:40}}><BrandMark c={c} size="large"/><button onClick={()=>setVw("lang")} style={sx.bo}>Start</button></div><style>{GS}</style></div></div>);
}
