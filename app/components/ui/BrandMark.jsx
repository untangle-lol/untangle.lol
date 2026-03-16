export default function BrandMark({c,size}){
  const s=size==="large";
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:s?6:2,marginBottom:s?8:4}}>
    <div style={{fontSize:s?44:32,filter:"drop-shadow(0 0 12px "+c.am+")"}}>🪢</div>
    <div style={{fontSize:s?28:20,fontWeight:800,letterSpacing:"-0.03em",color:c.tx,lineHeight:1}}>untangle</div>
    <div style={{fontSize:s?11:9,fontWeight:500,letterSpacing:"0.15em",color:c.tf,textTransform:"uppercase"}}>.lol</div>
  </div>);
}
