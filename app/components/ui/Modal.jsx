export default function Modal({c,children}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}>
      <div style={{background:c.card,borderRadius:20,padding:28,width:"100%",maxWidth:400,border:"1px solid "+c.cb,boxShadow:"0 24px 64px rgba(0,0,0,0.35)",animation:"modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
        {children}
      </div>
    </div>
  );
}
