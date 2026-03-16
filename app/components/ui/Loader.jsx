"use client";
import { useState, useEffect } from "react";

const LP=[["🧠","Thinking..."],["☕","Brewing ideas..."],["🔮","Crystal ball warming up..."],["🧙","Casting spells..."],["🤔","Deep thought..."],["🎯","Locking in..."]];

export default function Loader({c,lp}){
  const phrases=lp||LP.map(p=>p.join(" "));
  const [i,setI]=useState(0);const [d,setD]=useState("");const [b,setB]=useState(false);
  useEffect(()=>{let x=0;const a=setInterval(()=>{x=(x+1)%phrases.length;setI(x);setB(true);setTimeout(()=>setB(false),400);},2400);const dd=setInterval(()=>setD(p=>p.length>=3?"":p+"."),500);return()=>{clearInterval(a);clearInterval(dd);};},[]);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px"}}><div style={{fontSize:56,transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",transform:b?"scale(1.3) rotate(10deg)":"scale(1)",marginBottom:20}}>{(phrases[i]||"").split(" ")[0]}</div><div style={{fontSize:16,color:c.tx,fontWeight:500}}>{(phrases[i]||"").split(" ").slice(1).join(" ")}{d}</div><div style={{marginTop:24,display:"flex",gap:8}}>{[0,1,2].map(j=>(<div key={j} style={{width:10,height:10,borderRadius:"50%",background:c.ac,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>))}</div></div>);
}
