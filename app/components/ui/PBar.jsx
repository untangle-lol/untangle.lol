export default function PBar({done,total,c}){
  const p=total>0?(done/total)*100:0;
  return(<div style={{width:"100%",height:6,borderRadius:3,background:c.ghr,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:p>=100?c.gr:c.ac,width:p+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/></div>);
}
