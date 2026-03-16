export default function CheckItem({done,label,desc,onToggle,c}){
  return(<div onClick={onToggle} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 14px",borderRadius:12,cursor:onToggle?"pointer":"default",background:done?c.gb:c.sb,border:"1px solid "+(done?c.gbr:c.sr),transition:"all 0.2s",opacity:done?0.75:1,userSelect:"none"}}>
    <div style={{width:28,height:28,minWidth:28,borderRadius:8,background:done?c.gr:c.ckb,border:"2px solid "+(done?c.gr:c.ckr),display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,flexShrink:0,fontSize:16,color:c.cm}}>{done?"✓":""}</div>
    <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:done?c.gr:c.tx,marginBottom:3,textDecoration:done?"line-through":"none"}}>{label}</div><div style={{fontSize:13,color:done?c.dt:c.tm,lineHeight:1.5}}>{desc}</div></div>
  </div>);
}
