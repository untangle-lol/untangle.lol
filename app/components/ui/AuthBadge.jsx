import { getCredential } from "../../../lib/config";

export default function AuthBadge({c,onManage,t}){
  const {key}=getCredential();
  const unset=t?.apiKeyUnset||"set";
  return(
    <button onClick={onManage} style={{display:"flex",alignItems:"center",gap:6,background:c.ab,border:"1px solid "+c.abr,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:c.ac,whiteSpace:"nowrap"}}>
      <span>{t?.apiKeyBadge||"🔑 API Key"}</span>
      <span style={{opacity:0.5}}>·</span>
      <span style={{color:c.tf}}>{key?key.slice(0,10)+"…":unset}</span>
    </button>
  );
}
