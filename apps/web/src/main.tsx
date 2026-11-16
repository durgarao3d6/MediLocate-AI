import React, { useEffect, useRef, useState } from "react";
import { searchCached } from "./local-search";
import { loadCatalog, saveCatalog, clearCatalog } from "./offline-store";
import { parseRackPayload, rackPayload } from "./rack-code";
import { createRoot } from "react-dom/client";
import "./style.css";

type Location = {rack:string;shelf:string};
type Medicine = {id:string;name:string;strength:string|null;quantity:number;unit:string;locations:Location[];synced_at:string};
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App(){
  const [query,setQuery]=useState("");
  const [items,setItems]=useState<Medicine[]>([]);
  const [busy,setBusy]=useState(false);
  const catalog=useRef<Medicine[]>([]);
  const [message,setMessage]=useState("");
  const [savedAt,setSavedAt]=useState<string|null>(null);
  const [offline,setOffline]=useState(false);
  async function syncCatalog(){
    const response=await fetch(API+"/api/v1/catalog/snapshot");
    if(!response.ok)throw new Error("Offline snapshot sync failed");
    const payload: {items:Medicine[];truncated:boolean}=await response.json();
    if(payload.truncated)throw new Error("Catalog exceeds offline snapshot limit; cache not replaced");
    const saved=await saveCatalog(payload.items);
    catalog.current=payload.items;
    setSavedAt(saved);
  }
  async function search(q=query){
    setBusy(true);
    try {
      const response=await fetch(API+"/api/v1/medicines?q="+encodeURIComponent(q));
      if(!response.ok) throw new Error("Unable to load medicines");
      const records: Medicine[]=await response.json();
      if (!q.trim()) { await syncCatalog(); }
      setOffline(false);
      setItems(records);
      setMessage("");
    }catch(error){
      if(catalog.current.length){
        setItems(searchCached(catalog.current,q));
        setOffline(true);
        setMessage("Network unavailable: showing this session’s last fetched catalog. Stock and locations may be stale.");
      }else setMessage(String(error));
    }
    finally{setBusy(false);}
  }
  useEffect(()=>{
    let active=true;
    void loadCatalog().then(({items,savedAt})=>{
      if(!active)return;
      catalog.current=items;
      setSavedAt(savedAt);
      if(items.length)setItems(searchCached(items,""));
    }).catch(()=>{}).finally(()=>{if(active)void search("");});
    return ()=>{active=false;};
  },[]);
  async function refreshOffline(){
    setBusy(true);
    try{await syncCatalog();setOffline(false);setItems(searchCached(catalog.current,query));setMessage("Offline catalog synchronized.");}
    catch(error){setMessage(String(error));}
    finally{setBusy(false);}
  }
  async function clearOffline(){
    await clearCatalog();
    catalog.current=[];setSavedAt(null);setItems([]);
    setMessage("Offline catalog cleared from this device.");
  }
  async function importRackCode(id:string){
    const raw=prompt("Paste scanned rack QR content (MEDILOCATE:RACK:...:SHELF:...)");
    if(!raw)return;
    const loc=parseRackPayload(raw);
    if(!loc){setMessage("Unrecognized rack code.");return;}
    await saveLocation(id,loc.rack,loc.shelf);
  }
  async function saveLocation(id:string,rack:string,shelf:string){
    try{
      const response=await fetch(API+"/api/v1/medicines/"+id+"/locations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rack,shelf})});
      if(!response.ok)throw new Error("Unable to save location");
      await search("");
      setMessage("Location saved.");
    }catch(error){setMessage(String(error));}
  }
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
    try { rackPayload(rack,shelf); }catch(error){setMessage(String(error));return;}
    await saveLocation(id,rack,shelf);
  }
  return <main>
    <header><div className="brand">✚</div><div><h1>MediLocate AI</h1><p>Find medicines faster</p></div></header>
    <section className="search-card"><label htmlFor="medicine-search">Medicine name</label><div className="search-row"><input id="medicine-search" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void search();}} placeholder="e.g. Dolo 650"/><button onClick={()=>void search()} disabled={busy}>Find</button></div><small>Typo-tolerant search. Always verify medicine and strength.</small></section>
    <section><div className="heading"><h2>Medicines</h2><label className="upload">Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label></div>
      <p className="notice" role="status">{offline?"Offline cached catalog": "Online catalog"} · Last device sync: {savedAt?new Date(savedAt).toLocaleString():"Never"}</p>
      <div className="search-row"><button className="outline" onClick={()=>void refreshOffline()}>Sync offline catalog</button><button className="outline" onClick={()=>void clearOffline()}>Clear offline cache</button></div>
      {message&&<p className="notice" role="status">{message}</p>}
      {busy&&<p>Loading…</p>}
      {!busy&&items.length===0&&<p>No medicines found.</p>}
      {items.map(m=><article key={m.id}><div className="medicine-heading"><div><h3>{m.name}</h3><p>{m.strength||"Strength not specified"} · {m.quantity} {m.unit}</p></div><button className="outline" onClick={()=>void mapLocation(m.id)}>+ Rack</button><button className="outline" onClick={()=>void importRackCode(m.id)}>QR code</button></div>
        {m.locations.length?<div className="rack">{m.locations.map((l,i)=><span key={i}>Rack <b>{l.rack}</b> · Shelf <b>{l.shelf}</b></span>)}</div>:<div className="missing">Rack not mapped yet</div>}
        <small>Inventory snapshot · synced {new Date(m.synced_at).toLocaleDateString()}</small>
      </article>)}
    </section>
    <footer>Local development prototype · No patient data · Not for dispensing decisions</footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
