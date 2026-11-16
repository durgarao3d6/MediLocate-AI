import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Location = {rack:string;shelf:string};
type Medicine = {id:string;name:string;strength:string|null;quantity:number;unit:string;locations:Location[];synced_at:string};
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App(){
  const [query,setQuery]=useState("");
  const [items,setItems]=useState<Medicine[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function search(q=query){
    setBusy(true);
    try {
      const response=await fetch(API+"/api/v1/medicines?q="+encodeURIComponent(q));
      if(!response.ok) throw new Error("Unable to load medicines");
      setItems(await response.json());
      setMessage("");
    }catch(error){setMessage(String(error));}
    finally{setBusy(false);}
  }
  useEffect(()=>{void search("");},[]);
  async function upload(file:File){
    const form=new FormData();form.append("file",file);
    setBusy(true);
    try{
      const response=await fetch(API+"/api/v1/imports",{method:"POST",body:form});
      const result=await response.json();
      if(!response.ok) throw new Error(result.detail||"Import failed");
      await search(query);
      setMessage("Imported "+result.imported+" records.");
    }catch(error){setMessage(String(error));}
    finally{setBusy(false);}
  }
  async function mapLocation(id:string){
    const rack=prompt("Rack code, e.g. A3");if(!rack)return;
    const shelf=prompt("Shelf code, e.g. 2");if(!shelf)return;
    try{
      const response=await fetch(API+"/api/v1/medicines/"+id+"/locations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rack,shelf})});
      if(!response.ok)throw new Error("Unable to save location");
      await search(query);
      setMessage("Location saved.");
    }catch(error){setMessage(String(error));}
  }
  return <main>
    <header><div className="brand">✚</div><div><h1>MediLocate AI</h1><p>Find medicines faster</p></div></header>
    <section className="search-card"><label htmlFor="medicine-search">Medicine name</label><div className="search-row"><input id="medicine-search" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void search();}} placeholder="e.g. Dolo 650"/><button onClick={()=>void search()} disabled={busy}>Find</button></div><small>Typo-tolerant search. Always verify medicine and strength.</small></section>
    <section><div className="heading"><h2>Medicines</h2><label className="upload">Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label></div>
      {message&&<p className="notice" role="status">{message}</p>}
      {busy&&<p>Loading…</p>}
      {!busy&&items.length===0&&<p>No medicines found.</p>}
      {items.map(m=><article key={m.id}><div className="medicine-heading"><div><h3>{m.name}</h3><p>{m.strength||"Strength not specified"} · {m.quantity} {m.unit}</p></div><button className="outline" onClick={()=>void mapLocation(m.id)}>+ Rack</button></div>
        {m.locations.length?<div className="rack">{m.locations.map((l,i)=><span key={i}>Rack <b>{l.rack}</b> · Shelf <b>{l.shelf}</b></span>)}</div>:<div className="missing">Rack not mapped yet</div>}
        <small>Inventory snapshot · synced {new Date(m.synced_at).toLocaleDateString()}</small>
      </article>)}
    </section>
    <footer>Local development prototype · No patient data · Not for dispensing decisions</footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
