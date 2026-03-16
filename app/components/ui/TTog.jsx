export default function TTog({mode,set,c}){
  const ic={light:"☀️",dark:"🌙",system:"💻"};const nx={light:"dark",dark:"system",system:"light"};
  return(<button onClick={()=>set(nx[mode])} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:c.tm}}>{ic[mode]} {mode}</button>);
}
