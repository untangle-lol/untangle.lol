"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { LANGS } from "../../lib/i18n";
import { TH, GS } from "../../lib/theme";
import {
  ANTHROPIC_URL, OPENROUTER_URL, MODEL_ANTHROPIC, MODEL_OPENROUTER,
  ALTRUISM_BONUS_CREDITS, FREE_CREDITS,
  calcCost, fmtCost, utrack,
  ls, KEYS, eKey,
  keyProvider, getCredential, buildHeaders,
  genClientRef, tz, fmtDate, tAgo,
} from "../../lib/config";
import Loader from "./ui/Loader";
import PBar from "./ui/PBar";
import TTog from "./ui/TTog";
import BrandMark from "./ui/BrandMark";
import CheckItem from "./ui/CheckItem";
import Modal from "./ui/Modal";
import AuthBadge from "./ui/AuthBadge";

export default function App(){
  const [sys,setSys]=useState(()=>{try{return window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}catch{return"dark"}});
  useEffect(()=>{try{const q=window.matchMedia("(prefers-color-scheme:dark)");const h=e=>setSys(e.matches?"dark":"light");q.addEventListener("change",h);return()=>q.removeEventListener("change",h);}catch{}},[]);

  const [tm,setTm]=useState("system");
  const [lang,setLang]=useState(null);
  const [auth,setAuth]=useState("out");
  const [user,setUser]=useState(null);
  const [inp,setInp]=useState("");
  const setInpPersist=(v)=>{setInp(v);if(lang)ls.set("untangle_inp_"+lang,v);};
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
  // Hero subtitle cycling
  const [heroSIdx,setHeroSIdx]=useState(0);
  // Stripe
  const [topUpBusy,setTopUpBusy]=useState(false);
  const [topUpMsg,setTopUpMsg]=useState(null);
  const [topUpPopup,setTopUpPopup]=useState(null); // { credits: N }
  const [clientRef,setClientRef]=useState(null);
  // Share sheet
  const [shareOpen,setShareOpen]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  // WOOP
  const [woopStep,setWoopStep]=useState(0); // 0=W,1=O,2=O,3=P
  const [woopData,setWoopData]=useState({wish:"",outcome:"",obstacle:"",plan:""});
  const woopKeys=["wish","outcome","obstacle","plan"];
  const [suggOpen,setSuggOpen]=useState(false);
  const [altOffset,setAltOffset]=useState(0);
  const [dismissedAlts,setDismissedAlts]=useState([]);
  const [taFocused,setTaFocused]=useState(false);
  const userRef=useRef(null);
  const zone=useMemo(()=>tz(),[]);

  const t=lang?LANGS.find(l=>l.code===lang)||LANGS[1]:LANGS[1];
  const rt=tm==="system"?sys:tm;
  const c=TH[rt];
  const dir=t.rtl?"rtl":"ltr";

  const chTm=(m)=>{setTm(m);ls.set(KEYS.theme,m);};

  useEffect(()=>{
    const color=rt==="dark"?"#0f172a":"#f8fafc";
    let tag=document.querySelector("meta[name='theme-color']");
    if(!tag){tag=document.createElement("meta");tag.name="theme-color";document.head.appendChild(tag);}
    tag.content=color;
    document.documentElement.style.background=color;
    document.body.style.background=color;
  },[rt]);

  // Restore last typed input for this language
  useEffect(()=>{if(lang){const saved=ls.get("untangle_inp_"+lang);setInp(saved||"");};},[lang]);

  // Boot
  useEffect(()=>{(async()=>{
    const sv=ls.get(KEYS.theme);if(sv)setTm(sv);
    const langSv=ls.get("untangle_lang");if(langSv)setLang(langSv);
    const rv=ls.get(KEYS.recents);if(rv){try{setRecents(JSON.parse(rv));}catch{}}
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
    // Check for URL flags from Google OAuth redirect
    const params=new URLSearchParams(window.location.search);
    const signedIn=params.get("signed_in")==="1";
    const authErr=params.get("auth_error")==="1";
    const topupSuccess=params.get("topup")==="success";
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
        const hv=ls.get(eKey(email));if(hv){try{setHist(JSON.parse(hv));}catch{}}
        if(signedIn)utrack("sign_in");
        if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
        setVw("dash");setReady(true);return;
      }
    }catch{}
    const gh=ls.get(KEYS.guestHist);if(gh){try{setHist(JSON.parse(gh));}catch{}}
    if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
    setVw(langSv?"home":"lang");
    setReady(true);
  })();},[]);

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

  const addCredits=(n)=>{
    setCredits(prev=>{const next=prev+n;ls.set(KEYS.credits,String(next));return next;});
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
  };
  const pickLang=(code)=>{setLang(code);ls.set("untangle_lang",code);utrack("language_selected",{lang:code});setVw("home");};

  useEffect(()=>{
    if(!lang)return;
    fetch("/api/suggestions?lang="+lang)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);})
      .catch(()=>{});
  },[lang]);

  // Pre-fill textarea with last used goal when navigating to home/new_goal
  useEffect(()=>{
    if((vw==="home"||vw==="new_goal")&&!inp&&recents[0]){
      setInp(recents[0]);
    }
  },[vw]);

  // Cycle heroS phrases when textarea is empty
  useEffect(()=>{
    if(inp)return;
    const phrases=t.heroS;
    if(!phrases||phrases.length<=1)return;
    const id=setInterval(()=>setHeroSIdx(i=>(i+1)%phrases.length),3000);
    return()=>clearInterval(id);
  },[inp,t]);

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
    setCredits(prev=>{const next=Math.max(0,prev-1);ls.set(KEYS.credits,String(next));return next;});
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
    ls.del("untangle_inp_"+lang);
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
      setRecents(prev=>{const next=[trimmed,...prev.filter(r=>r!==trimmed)].slice(0,5);ls.set(KEYS.recents,JSON.stringify(next));return next;});
      fetch("/api/suggestions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text:trimmed})})
        .then(r=>r.ok?r.json():null)
        .then(()=>fetch("/api/suggestions?lang="+lang).then(r=>r.ok?r.json():null).then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);}))
        .catch(()=>{});
      const comp=ps.stappen.map(()=>false);
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:inp.trim(),resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
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
      const comp=ps.stappen.map(()=>false);
      const woop={wish:woopData.wish.trim(),outcome:woopData.outcome.trim(),obstacle:woopData.obstacle.trim(),plan:woopData.plan.trim()};
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:woop.wish,resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false,woop};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
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
      if(allDone)utrack("goal_completed",{lang});
      // Save updated completion state only (bonus awarded on goHome)
      const updateHist=(ph)=>ph.map(h=>h.id!==activeId?h:{...h,completed:next});
      if(activeId&&auth==="in"){setHist(ph=>{const nh=updateHist(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
      else if(activeId){setHist(ph=>{const nh=updateHist(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      return next;
    });
  };

  // Stripe top-up
  const startTopUp=async()=>{
    if(topUpBusy)return;
    setTopUpBusy(true);
    utrack("topup_started");
    try{
      const ref=clientRef||ls.get(KEYS.clientRef);
      const r=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientRef:ref})});
      const d=await r.json();
      if(d.url){window.location.href=d.url;}
      else{setTopUpMsg("error");}
    }catch{setTopUpMsg("error");}
    setTopUpBusy(false);
  };

  const openEntry=(entry)=>{setSteps(entry.resultaat);setActiveId(entry.id);setLocalComp(entry.completed||entry.resultaat.stappen.map(()=>false));setShareOpen(false);setVw("result");};
  const del=(id)=>{const nh=hist.filter(h=>h.id!==id);setHist(nh);if(auth==="in")ls.set(eKey(userRef.current),JSON.stringify(nh));else ls.set(KEYS.guestHist,JSON.stringify(nh));};
  const clrAll=()=>{setHist([]);if(auth==="in")ls.set(eKey(userRef.current),"[]");else ls.set(KEYS.guestHist,"[]");};
  const goHome=()=>{
    // Check if returning from a completed altruistic goal that hasn't been rewarded yet
    if(activeId){
      const entry=hist.find(h=>h.id===activeId);
      const allDone=localComp.length>0&&localComp.every(Boolean);
      if(entry&&entry.isAltruistic&&!entry.altruismBonusClaimed&&allDone){
        const lastBonus=parseInt(ls.get(KEYS.altruismBonusTs)||"0",10);
        const canClaim=(Date.now()-lastBonus)>=24*60*60*1000;
        if(canClaim){
          addCredits(ALTRUISM_BONUS_CREDITS);
          ls.set(KEYS.altruismBonusTs,String(Date.now()));
          utrack("altruism_bonus_earned",{credits:ALTRUISM_BONUS_CREDITS});
          setTimeout(()=>setAltruismBonusPopup(true),300);
        }
        const markClaimed=(ph)=>ph.map(h=>h.id===activeId?{...h,altruismBonusClaimed:true}:h);
        if(auth==="in"){setHist(ph=>{const nh=markClaimed(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
        else{setHist(ph=>{const nh=markClaimed(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      }
    }
    setInp("");setSteps(null);setErr(null);setActiveId(null);setLocalComp([]);setShareOpen(false);setVw(auth==="in"?"dash":"home");
  };
  const prog=(e)=>{const tt=e.resultaat?.stappen?.length||0;const dn=(e.completed||[]).filter(Boolean).length;return{dn,tt,pct:tt>0?Math.round(dn/tt*100):0};};

  const delRecent=(text)=>{
    setRecents(prev=>{const next=prev.filter(r=>r!==text);ls.set(KEYS.recents,JSON.stringify(next));return next;});
  };
  const delGlobal=(text)=>{
    setGlobalSugg(prev=>prev.filter(s=>s!==text));
    fetch("/api/suggestions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text})}).catch(()=>{});
  };

  const SuggChips=()=>{
    const localSet=new Set(recents.map(r=>r.toLowerCase()));
    const globals=globalSugg.filter(s=>!localSet.has(s.toLowerCase())).slice(0,4);
    const altPool=(t.altruisticSugg||[]).filter(s=>!localSet.has(s.toLowerCase())&&!dismissedAlts.includes(s));
    // Cycle 2 altruistic picks using altOffset so each open shows different ones
    const altPick=altPool.length===0?[]:altPool.length<=2?altPool:[altPool[altOffset%altPool.length],altPool[(altOffset+1)%altPool.length]];
    const interleaved=[];
    let gi=0,ai=0;
    while((gi<globals.length||ai<altPick.length)&&interleaved.length<4){
      if(gi<globals.length)interleaved.push({text:globals[gi++],kind:"global"});
      if(ai<altPick.length&&interleaved.length<4)interleaved.push({text:altPick[ai++],kind:"alt"});
    }
    if(recents.length===0&&interleaved.length===0)return null;
    const pick=(text)=>{setInp(text);setSuggOpen(false);};
    const toggle=()=>{setSuggOpen(o=>{if(!o)setAltOffset(n=>n+2);return!o;});};
    const chipRow={display:"flex",alignItems:"center",width:"100%",overflow:"hidden"};
    const delBtn=(onClick)=><button onClick={(e)=>{e.stopPropagation();onClick();}} style={{flexShrink:0,background:"none",border:"none",padding:"10px 14px",color:c.tm,cursor:"pointer",fontSize:16,opacity:0.5,lineHeight:1}} title="Remove">×</button>;
    return(
      <div style={{marginTop:10,border:"1px solid "+c.cb,borderRadius:10,overflow:"hidden"}}>
        <button onClick={toggle} style={{width:"100%",background:c.sb,border:"none",borderBottom:suggOpen?"1px solid "+c.cb:"none",padding:"8px 12px",textAlign:"left",fontSize:12,fontWeight:600,color:c.tf,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>{t.suggLabel||"💡 Pick a suggestion"}</span>
          <span style={{fontSize:10,opacity:0.6}}>{suggOpen?"▲":"▼"}</span>
        </button>
        {suggOpen&&<div style={{display:"flex",flexDirection:"column",gap:0}}>
          {recents.map((r,i)=>(
            <div key={"l"+i} style={{...chipRow,borderTop:i>0?"1px solid "+c.cb:"none",background:c.ab}}>
              <button onClick={()=>pick(r)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:c.ac,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</button>
              {delBtn(()=>delRecent(r))}
            </div>
          ))}
          {interleaved.map((s,i)=>(
            <div key={"m"+i} style={{...chipRow,borderTop:(recents.length>0||i>0)?"1px solid "+c.cb:"none",background:s.kind==="alt"?"rgba(251,191,36,0.06)":"transparent"}}>
              <button onClick={()=>pick(s.text)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:s.kind==="alt"?c.ac:c.tm,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.kind==="alt"?"💛 ":"💡 "}{s.text}</button>
              {s.kind==="global"&&delBtn(()=>delGlobal(s.text))}
              {s.kind==="alt"&&delBtn(()=>setDismissedAlts(d=>[...d,s.text]))}
            </div>
          ))}
        </div>}
      </div>
    );
  };

  // Build plain-text share message from current steps
  const buildShareText=(ps)=>{
    if(!ps)return'';
    const lines=[t.shareMsg||'Check out my action plan on untangle.lol:','',ps.titel,''];
    (ps.stappen||[]).forEach((s,i)=>{lines.push((i+1)+'. '+s.actie);lines.push('   '+s.toelichting);lines.push('');});
    lines.push('https://untangle.lol');
    return lines.join('\n').trim();
  };

  const doShare=async(ps)=>{
    const text=buildShareText(ps);
    if(navigator.share){
      try{await navigator.share({title:ps.titel,text});utrack('share_native');return;}catch(e){if(e.name==='AbortError')return;}
    }
    setShareOpen(o=>!o);
    setShareCopied(false);
    utrack('share_open');
  };

  const copyShareText=(text)=>{
    const doIt=()=>{
      if(navigator.clipboard){
        navigator.clipboard.writeText(text).catch(()=>{});
      }else{
        const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch{}document.body.removeChild(ta);
      }
      setShareCopied(true);
      setTimeout(()=>setShareCopied(false),2000);
      utrack('share_copy');
    };
    doIt();
  };

  // Honeypot field — visually hidden, bots fill it
  const HoneypotField=()=>(
    <div style={{position:"absolute",left:"-9999px",top:"-9999px",width:1,height:1,overflow:"hidden"}} aria-hidden="true">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/>
    </div>
  );

  const sx={
    pg:{minHeight:"100dvh",height:"100dvh",background:c.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"12px 20px",paddingTop:"calc(48px + env(safe-area-inset-top))",paddingBottom:"calc(68px + env(safe-area-inset-bottom))",fontFamily:"'Inter',-apple-system,sans-serif",transition:"background 0.4s",overflowY:"auto"},
    w:{width:"100%",maxWidth:540,flex:1,display:"flex",flexDirection:"column",justifyContent:"center"},
    cd:{background:c.card,borderRadius:16,padding:24,border:"1px solid "+c.cb,boxShadow:c.sh,transition:"all 0.3s"},
    ip:{width:"100%",background:c.ib,border:"2px solid "+c.ibr,borderRadius:10,padding:"13px 16px",color:c.tx,fontSize:16,outline:"none",boxSizing:"border-box"},
    bo:{width:"100%",marginTop:14,padding:"13px 20px",background:c.ag,color:c.bt,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer"},
    bd:{width:"100%",marginTop:14,padding:"13px 20px",background:c.am,color:c.tm,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"not-allowed"},
    bg:{width:"100%",marginTop:12,padding:"12px 20px",background:c.ghb,color:c.tm,border:"1px solid "+c.ghr,borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer"},
    note:{fontSize:12,color:c.tf,marginTop:8,textAlign:"center"},
    err:{marginTop:10,padding:"10px 14px",background:c.eb,borderRadius:8,color:c.et,fontSize:13},
    stripe:{width:"100%",marginTop:10,padding:"13px 20px",background:"linear-gradient(135deg,#6772e5,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
  };

  const Bar=()=>(
    <div dir={dir} style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px",paddingTop:"calc(8px + env(safe-area-inset-top))",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+c.cb}}>
      <button onClick={()=>setVw("lang")} style={{background:"none",border:"none",color:c.tf,fontSize:12,cursor:"pointer",padding:0,flexShrink:0}}>🌍 {t.lSel}</button>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {user&&(
          <button onClick={()=>setVw("manage_auth")} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            {user.picture
              ?<img src={user.picture} alt={user.name||""} referrerPolicy="no-referrer" style={{width:26,height:26,borderRadius:"50%",border:"1px solid "+c.cb,flexShrink:0}}/>
              :<div style={{width:26,height:26,borderRadius:"50%",background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>👤</div>
            }
          </button>
        )}
        <TTog mode={tm} set={chTm} c={c}/>
      </div>
    </div>
  );

  const BottomBar=()=>{
    const {key}=getCredential();
    const showCredits=!key&&credits!==undefined;
    const low=showCredits&&credits<=3;
    return(
    <div dir={dir} style={{position:"fixed",bottom:0,left:0,right:0,paddingBottom:"env(safe-area-inset-bottom)",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderTop:"1px solid "+c.cb,display:"flex",flexDirection:"column",alignItems:"center",zIndex:100}}>
      <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",padding:"8px 20px",width:"100%",boxSizing:"border-box",flexWrap:"wrap"}}>
        <AuthBadge c={c} onManage={()=>setVw("manage_auth")} t={t}/>
        {showCredits&&(
          <button onClick={()=>setVw("manage_auth")} style={{display:"flex",alignItems:"center",gap:5,background:low?"rgba(239,68,68,0.1)":c.ab,border:"1px solid "+(low?"rgba(239,68,68,0.35)":c.abr),borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:low?"#ef4444":c.ac,fontWeight:low?700:400,whiteSpace:"nowrap"}}>
            🪙 <span>{credits}</span><span style={{opacity:0.7}}>{" "}{t.cred}</span>
          </button>
        )}
        {topUpMsg==="pending"&&<span style={{fontSize:11,color:c.tm,animation:"pulse 1s infinite"}}>{t.topUpPending}</span>}
      </div>
      <div style={{display:"flex",gap:16,justifyContent:"center",paddingBottom:6}}>
        <a href={"/terms?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.terms||"Terms"}</a>
        <a href={"/privacy?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.privacy||"Privacy"}</a>
        <a href="https://stats.fabrikage.nl/share/AE078t90MeCuVl4I" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.stats||"Stats"}</a>
        <a href="https://bunq.me/BachSoftware" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.ac,textDecoration:"none",fontWeight:500}}>{t.donate||"❤️ Donate"}</a>
      </div>
    </div>
  );};

  const Err=()=>err?(<div style={sx.err}>{err}</div>):null;

  const cyclePh=(()=>{const ps_=t.phSugg||[];const as_=t.altruisticSugg||[];const pool=[];for(let i=0;i<Math.max(ps_.length,as_.length);i++){if(i<ps_.length)pool.push(ps_[i]);if(i<as_.length)pool.push(as_[i]);}return pool.length>0?pool[heroSIdx%pool.length]:t.ph;})();

  if(!ready)return (<div style={{minHeight:"100dvh",background:c.bg}}><style>{GS}</style></div>);

  return(<>
    {/* ── Persistent top bar ── */}
    {ready&&<Bar/>}

    {/* ── Altruism Announcement Popup ── */}
    {altruismPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>💛</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 10px"}}>{t.altruismPopupTitle}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{canEarnAltruismBonus?t.altruismPopupMsg:t.altruismPopupMsgRepeat}</p>
          <button onClick={()=>setAltruismPopup(false)} style={{...sx.bo,marginTop:0,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>{t.altruismPopupBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Altruism Bonus Earned Popup ── */}
    {altruismBonusPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12,animation:"pop 0.5s ease"}}>🎁</div>
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
          <div style={{fontSize:52,marginBottom:12,animation:"pop 0.5s ease"}}>✅</div>
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

    {vw==="lang"&&(
      <div style={{...sx.pg,direction:"ltr"}}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:28}}><BrandMark c={c} size="large"/><p style={{color:c.tm,fontSize:14,marginTop:10}}>{t.chooseLang}</p></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>pickLang(l.code)} style={{...sx.cd,padding:"16px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.abr;e.currentTarget.style.transform="scale(1.02)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=c.cb;e.currentTarget.style.transform="scale(1)";}}>
              <span style={{fontSize:28}}>{l.flag}</span><span style={{color:c.tx,fontSize:15,fontWeight:500}}>{l.label}</span>
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
          <a href={"/privacy?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{color:c.tf,textDecoration:"underline"}}>{t.privacy}</a>
        </p>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="byok"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.byokH1}</h1></div>
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

    {vw==="no_credits"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/></div>
        <div style={{...sx.cd,textAlign:"center",padding:"32px 24px"}}>
          <div style={{fontSize:48,marginBottom:12}}>🪙</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 8px"}}>{t.credOut}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.credOutMsg}</p>
          <button onClick={startTopUp} disabled={topUpBusy} style={sx.stripe}>
            💳 {topUpBusy?"...":t.topUpBtn} <span style={{opacity:0.7,fontSize:12}}>({t.topUpDesc})</span>
          </button>
          <button onClick={()=>setVw("byok")} style={sx.bo}>{t.credByok}</button>
          <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
        </div>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="manage_auth"&&(()=>{
      const {key,provider}=getCredential();
      const providerLabel=provider==="openrouter"?"OpenRouter":"Anthropic";
      const resetUsage=()=>{const z={calls:0,inputTokens:0,outputTokens:0,costUsd:0};setUsage(z);ls.del(KEYS.usage);};
      return(
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.chAuth}</h1></div>
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
            {!key&&<div style={{padding:"16px",background:c.hp,border:"1px solid "+c.hpr,borderRadius:12,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:12,color:c.tm,fontWeight:500,marginBottom:4}}>🪙 {t.credFree}</div>
                  <div style={{fontSize:28,fontWeight:800,color:credits<=3?"#ef4444":c.tx,lineHeight:1}}>{credits}</div>
                  <div style={{fontSize:11,color:c.tf,marginTop:2}}>{t.cred}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:c.tm,marginBottom:8}}>{t.topUpDesc}</div>
                  <button onClick={startTopUp} disabled={topUpBusy} style={{...sx.stripe,width:"auto",marginTop:0,padding:"9px 14px",fontSize:13}}>
                    💳 {topUpBusy?"...":t.topUpBtn}
                  </button>
                </div>
              </div>
            </div>}
            {key&&<div style={{padding:"14px 16px",background:c.ab,borderRadius:10,marginBottom:12}}>
              <div style={{fontSize:13,color:c.tm,marginBottom:4}}>{t.apiKeyBadge} · <span style={{fontWeight:600,color:c.ac}}>{providerLabel}</span></div>
              <div style={{fontSize:14,fontWeight:500,color:c.ac,fontFamily:"monospace"}}>{key.slice(0,14)}…</div>
            </div>}
            {/* Usage stats */}
            <div style={{padding:"14px 16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:10,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:c.tm,marginBottom:10}}>{t.usageStat}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.apiCalls}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c.tx}}>{usage.calls}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.estCost}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c.ac}}>{fmtCost(usage.costUsd)}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.inputTok}</div>
                  <div style={{fontSize:16,fontWeight:600,color:c.tx}}>{usage.inputTokens.toLocaleString()}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.outputTok}</div>
                  <div style={{fontSize:16,fontWeight:600,color:c.tx}}>{usage.outputTokens.toLocaleString()}</div>
                </div>
              </div>
              <button onClick={resetUsage} style={{...sx.bg,marginTop:10,fontSize:12,padding:"8px 14px"}}>{t.resetStats}</button>
            </div>
            <button onClick={()=>setVw("byok")} style={sx.bo}>{t.apiKeyBadge}</button>
            <button onClick={removeAuth} style={{...sx.bg,color:"#ef4444",borderColor:"rgba(239,68,68,0.3)",marginTop:12}}>{t.rmKey}</button>
            <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {vw==="loading"&&(<div dir={dir} style={sx.pg}><div style={sx.w}><div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/></div><div style={sx.cd}><Loader c={c} lp={t.lp}/>{loadingAltruistic&&<div style={{marginTop:16,padding:"10px 16px",borderRadius:12,background:c.am,border:`1px solid ${c.abr}`,color:c.ac,fontSize:14,fontWeight:600,textAlign:"center",animation:"fadeIn 0.5s ease forwards"}}>{t.altruismLoadingMsg}</div>}</div><BottomBar/><style>{GS}</style></div></div>)}

    {(vw==="home"||vw==="new_goal")&&auth!=="in"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c} size="large"/><h1 style={{fontSize:26,fontWeight:700,color:c.tx,margin:"10px 0 0"}}>{t.hero}</h1><p key={heroSIdx} style={{color:c.tm,fontSize:14,marginTop:4,animation:"heroFade 3s ease forwards",minHeight:"1.4em"}}>{(t.heroS||[])[heroSIdx%((t.heroS||[]).length||1)]||""}</p></div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <div style={{marginBottom:12,padding:"8px 12px",borderRadius:10,background:c.ab,border:"1px solid "+c.abr}}><span style={{fontSize:12,color:c.ac}}>{canEarnAltruismBonus?t.altruismTeaser:t.altruismPopupMsgRepeat}</span></div>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
          <div className={"ta-glow"+(taFocused?" ta-glow-focused":"")} style={{"--ta-tc":rt==="dark"?"rgba(255,255,255,0.12)":"rgba(180,120,0,0.25)"}}>            <textarea value={inp} onChange={e=>setInpPersist(e.target.value)} onFocus={()=>setTaFocused(true)} onBlur={()=>setTaFocused(false)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={cyclePh} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6,background:rt==="dark"?"#162032":"#ffffff",border:"none"}}/>
          </div>
          <SuggChips/>
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{t.woop||"🎯 Try WOOP"}</button>
          <Err/>
        </div>
        <div style={{textAlign:"center",marginTop:14,padding:"10px 16px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr}}><span style={{fontSize:12,color:c.gt}}>{t.eth}</span></div>
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
                  <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.pct>=100?"✅ ":""}{h.resultaat?.titel||h.behoefte}</div>
                  <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&" 💛"}</div>
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
      <div dir={dir} style={sx.pg}><div style={sx.w}>
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
                  <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&" 💛"}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
              </div>
              <PBar done={p.dn} total={p.tt} c={c}/>
            </div>);})}
            {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
          </div>
        )}<BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="new_goal"&&auth==="in"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:22,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.hero}</h1><p key={heroSIdx} style={{color:c.tm,fontSize:13,marginTop:2,animation:"heroFade 3s ease forwards",minHeight:"1.3em"}}>{(t.heroS||[])[heroSIdx%((t.heroS||[]).length||1)]||""}</p></div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
          <textarea value={inp} onChange={e=>setInpPersist(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={cyclePh} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6}}/>
          <SuggChips/>
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{t.woop||"🎯 Try WOOP"}</button>
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
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{animation:"fadeIn 0.4s ease"}}>
            {/* Altruistic goal progress indicator */}
            {ae?.isAltruistic&&!ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>💛</span>
                <span style={{fontSize:12,color:c.ac,fontWeight:500}}>{t.altruismPopupMsg}</span>
              </div>
            )}
            {ae?.isAltruistic&&ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🎁</span>
                <span style={{fontSize:12,color:c.gr,fontWeight:600}}>{t.altruismBonusTitle}</span>
              </div>
            )}
            <div style={sx.cd}>
              <h2 style={{fontSize:17,fontWeight:600,color:all?c.gr:c.ac,margin:"0 0 6px"}}>{all?"✅ ":""}{steps.titel}</h2>
              {ae?.timestamp&&<div style={{fontSize:12,color:c.tf,marginBottom:10}}>{fmtDate(ae.timestamp,ae.timezone||zone,ae.lang||lang)}</div>}
              <div style={{marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:c.tm}}>{t.prog}</span><span style={{fontSize:13,color:all?c.gr:c.ac,fontWeight:600}}>{dn} {t.sOf} {tt}</span></div>
                <PBar done={dn} total={tt} c={c}/>
              </div>
              {all&&<div style={{textAlign:"center",padding:"10px 0 16px",fontSize:14,color:c.gr,fontWeight:600,animation:"pop 0.4s ease"}}>{t.allD}</div>}
              {/* WOOP summary card — collapsible, shown when entry was created via WOOP */}
              {ae?.woop&&(()=>{
                const wLabels=t.woopLabels||["Wish","Outcome","Obstacle","Plan"];
                const wKeys=["wish","outcome","obstacle","plan"];
                const wIcons=["🌟","✨","🧱","⚡"];
                return(
                  <details style={{marginBottom:14,borderRadius:10,border:"1px solid "+c.abr,overflow:"hidden"}}>
                    <summary style={{padding:"10px 14px",cursor:"pointer",background:c.ab,color:c.ac,fontSize:13,fontWeight:600,listStyle:"none",display:"flex",alignItems:"center",gap:6,userSelect:"none"}}>
                      🎯 {t.woopSummaryTitle||"Your WOOP"}
                    </summary>
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8,background:c.sb}}>
                      {wKeys.map((k,i)=>ae.woop[k]&&(
                        <div key={k} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                          <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{wIcons[i]}</span>
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
            <button onClick={()=>doShare(steps)} style={{...sx.bg,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              {t.share||'Share'}
            </button>
            {shareOpen&&(()=>{
              const _text=buildShareText(steps);
              const _enc=encodeURIComponent(_text);
              const _url=encodeURIComponent('https://untangle.lol');
              return(
                <div style={{marginTop:8,padding:'14px 16px',background:c.sb,border:'1px solid '+c.sr,borderRadius:12}}>
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
                        onClick={()=>utrack('share_platform',{platform:p.id})}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none',minWidth:48}}>
                        <div style={{width:42,height:42,borderRadius:10,background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18}}>
                          {p.id==='whatsapp'&&'💬'}
                          {p.id==='telegram'&&'✈️'}
                          {p.id==='x'&&'𝕏'}
                          {p.id==='facebook'&&'f'}
                          {p.id==='viber'&&'📳'}
                          {p.id==='signal'&&'🔒'}
                        </div>
                        <span style={{fontSize:9,color:c.tm,textAlign:'center'}}>{p.label}</span>
                      </a>
                    ))}
                    <button onClick={()=>copyShareText(_text)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',minWidth:48,padding:0}}>
                      <div style={{width:42,height:42,borderRadius:10,background:shareCopied?c.gr:c.ghb,border:'1px solid '+(shareCopied?c.gr:c.ghr),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'background 0.2s'}}>
                        {shareCopied?'✓':'📋'}
                      </div>
                      <span style={{fontSize:9,color:shareCopied?c.gr:c.tm,textAlign:'center'}}>{shareCopied?(t.shareCopied||'Copied!'):(t.shareCopy||'Copy')}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        <BottomBar/><style>{GS}</style></div></div>
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
      const WOOP_ICONS=["🌟","✨","🧱","⚡"];
      return(
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <BrandMark c={c}/>
            <h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 2px"}}>{t.woopTitle||"WOOP Method"}</h1>
            <p style={{color:c.tm,fontSize:13,margin:0,lineHeight:1.5,maxWidth:380,marginInline:"auto"}}>{t.woopSub||""}</p>
            <a href="https://woopmylife.org/en/science" target="_blank" rel="noopener noreferrer" style={{color:c.ac,fontSize:12,marginTop:4,display:"inline-block",textDecoration:"none",opacity:0.8}}>{t.woopLink||"Learn about the science"} ↗</a>
          </div>
          {/* Step progress dots */}
          <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
            {[0,1,2,3].map(i=>(
              <button key={i} onClick={()=>setWoopStep(i)} style={{width:i===woopStep?48:10,height:10,borderRadius:5,background:i<woopStep?c.gr:i===woopStep?c.ac:c.ghr,border:"none",cursor:"pointer",transition:"all 0.3s",padding:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {i===woopStep&&<span style={{fontSize:9,fontWeight:700,color:c.bt,whiteSpace:"nowrap",paddingInline:6}}>{(labels[i]||"").toUpperCase()}</span>}
              </button>
            ))}
          </div>
          <div style={{...sx.cd,animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{WOOP_ICONS[woopStep]}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:c.tx}}>{labels[woopStep]}</div>
                <div style={{fontSize:12,color:c.tm,lineHeight:1.4}}>{hints[woopStep]}</div>
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
            <div style={{display:"flex",gap:10,marginTop:14,width:"100%"}}>
              {woopStep>0&&(
                <button onClick={()=>{setErr(null);setWoopStep(s=>s-1);}} style={{...sx.bg,marginTop:0,width:"auto",flex:"0 0 auto",padding:"13px 16px"}}>
                  {t.back||"← Back"}
                </button>
              )}
              {!isLast?(
                <button onClick={()=>{if(curVal.trim())setWoopStep(s=>s+1);}} disabled={!curVal.trim()} style={curVal.trim()?{...sx.bo,marginTop:0,flex:1}:{...sx.bd,marginTop:0,flex:1}}>
                  {labels[woopStep+1]||"Next"} →
                </button>
              ):(
                <button onClick={submitWoop} disabled={busy||!allFilled} style={busy||!allFilled?{...sx.bd,marginTop:0,flex:1}:{...sx.bo,marginTop:0,flex:1}}>
                  {t.woopGo||"Create my plan →"}
                </button>
              )}
            </div>
          </div>
          {/* Summary of completed steps */}
          {woopStep>0&&(
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
              {woopKeys.slice(0,woopStep).map((k,i)=>woopData[k]&&(
                <div key={k} style={{padding:"8px 12px",borderRadius:8,background:c.gb,border:"1px solid "+c.gbr,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{WOOP_ICONS[i]}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:c.gr,marginBottom:2}}>{labels[i]}</div>
                    <div style={{fontSize:12,color:c.tm,lineHeight:1.4}}>{woopData[k]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>{setErr(null);setVw(auth==="in"?"new_goal":"home");}} style={{...sx.bg,marginTop:12}}>{t.back||"← Back"}</button>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {!["lang","byok","no_credits","manage_auth","loading","home","new_goal","dash","result","save_prompt","woop_input"].includes(vw)&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}><div style={{textAlign:"center",padding:40}}><BrandMark c={c} size="large"/><button onClick={()=>setVw("lang")} style={sx.bo}>Start</button></div><BottomBar/><style>{GS}</style></div></div>
    )}
  </>);
}
