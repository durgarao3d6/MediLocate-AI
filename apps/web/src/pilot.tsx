import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {listStores,saveStore,listMedicines,saveMedicines,type PilotMedicine,type PilotStore} from "./pilot-db";
import {parseSpreadsheet,extractPhoto,matchCatalog,type DraftMedicine} from "./pilot-extract";
import "./style.css";

function Pilot(){
 const [stores,setStores]=useState<PilotStore[]>([]);
 const [storeId,setStoreId]=useState("");
 const [storeName,setStoreName]=useState("");
 const [catalog,setCatalog]=useState<PilotMedicine[]>([]);
 const [drafts,setDrafts]=useState<DraftMedicine[]>([]);
 const [stage,setStage]=useState<"onboard"|"catalog"|"prescription"|"results">("onboard");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [rack,setRack]=useState("");
 const [shelf,setShelf]=useState("");
 const [rxText,setRxText]=useState("");
 const [searchMode,setSearchMode]=useState<"text"|"scan">("text");
 const [matches,setMatches]=useState<ReturnType<typeof matchCatalog>>([]);
 useEffect(()=>{void listStores().then(setStores).catch(e=>setMessage(String(e)));},[]);
 async function selectStore(id:string){setStoreId(id);setCatalog(await listMedicines(id));setStage("catalog");setDrafts([]);setMessage("");}
 async function createStore(){const name=storeName.trim();if(!name)return;const store={id:crypto.randomUUID(),name,createdAt:new Date().toISOString()};await saveStore(store);setStores(v=>[...v,store]);await selectStore(store.id);}
 async function upload(file:File,kind:"excel"|"rack"|"rx"){
  setBusy(true);setMessage("");
  try{
   if(kind==="excel"){setDrafts(await parseSpreadsheet(file));setStage("catalog");}
   if(kind==="rack"){const result=await extractPhoto(file);setDrafts(result.drafts.map(d=>({...d,rack,shelf})));setMessage("OCR candidates only: verify every name and rack before saving.");}
   if(kind==="rx"){const result=await extractPhoto(file);setRxText(result.text);setSearchMode("scan");setStage("prescription");setMessage("Verify prescription text manually. Printed English OCR is experimental; handwriting and other languages are not validated.");}
  }catch(e){setMessage(String(e));}finally{setBusy(false);}
 }
 function updateDraft(i:number,field:keyof DraftMedicine,value:string|boolean){setDrafts(items=>items.map((x,j)=>j===i?{...x,[field]:value}:x));}
 async function confirm(){
  const chosen=drafts.filter(d=>d.selected&&d.name.trim()&&d.rack.trim()&&d.shelf.trim());
  if(!chosen.length){setMessage("Select entries and provide a rack and shelf for each.");return;}
  const items=chosen.map(d=>({id:crypto.randomUUID(),name:d.name.trim(),strength:d.strength.trim(),form:d.form.trim(),rack:d.rack.trim(),shelf:d.shelf.trim(),confirmed:true}));
  await saveMedicines(storeId,items);setCatalog(await listMedicines(storeId));setDrafts([]);setMessage("Saved "+items.length+" pharmacist-confirmed locations locally.");
 }
 function findRacks(){const lines=rxText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length){setMessage("Enter a medicine name or review the extracted prescription text before searching.");return;}setMessage("");setMatches(matchCatalog(catalog,lines));setStage("results");}
 return <main>
 <header><div className="brand">✚</div><div><h1>MediLocate AI</h1><p>Shopkeeper pilot · local device data</p></div></header>
 <nav className="search-row"><button className="outline" onClick={()=>setStage("onboard")}>1. Shop</button><button className="outline" disabled={!storeId} onClick={()=>setStage("catalog")}>2. Racks</button><button className="outline" disabled={!storeId} onClick={()=>setStage("prescription")}>3. Find medicines</button></nav>
 {message&&<p className="notice" role="status">{message}</p>}
 {busy&&<p role="status">Processing on this device…</p>}
 {stage==="onboard"&&<section className="search-card"><h2>Start your pharmacy pilot</h2><p>No account or cloud upload required. Choose a local shop profile or create one.</p><div className="search-row"><input aria-label="Shop name" placeholder="Shop name" value={storeName} onChange={e=>setStoreName(e.target.value)}/><button onClick={()=>void createStore()}>Start pilot</button></div>{stores.map(s=><p key={s.id}><button className="outline" onClick={()=>void selectStore(s.id)}>{s.name}</button></p>)}</section>}
 {stage==="catalog"&&<section><h2>Rack inventory · {stores.find(s=>s.id===storeId)?.name}</h2><p>Upload an Excel file with columns: name, strength, form, rack, shelf. Or photograph a rack, then manually confirm OCR candidates.</p>
 <div className="search-row"><label className="upload">Upload Excel (.xlsx)<input type="file" accept=".xlsx" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"excel");e.target.value="";}}/></label><label className="upload">Photograph rack<input type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"rack");e.target.value="";}}/></label></div>
 <div className="search-row"><input aria-label="Default rack" placeholder="Rack (e.g. A3)" value={rack} onChange={e=>setRack(e.target.value)}/><input aria-label="Default shelf" placeholder="Shelf (e.g. 2)" value={shelf} onChange={e=>setShelf(e.target.value)}/><button className="outline" onClick={()=>setDrafts(v=>v.map(x=>({...x,rack,shelf})))}>Apply to drafts</button></div>
 {drafts.length>0&&<><h3>Review {drafts.length} candidates</h3><p>Only selected, confirmed entries with a rack and shelf will be saved.</p>{drafts.map((d,i)=><article key={i}><label><input type="checkbox" checked={d.selected} onChange={e=>updateDraft(i,"selected",e.target.checked)}/> Include</label><div className="search-row">{(["name","strength","form","rack","shelf"] as const).map(field=><input key={field} aria-label={field+" "+(i+1)} placeholder={field} value={d[field]} onChange={e=>updateDraft(i,field,e.target.value)}/>)}</div></article>)}<button onClick={()=>void confirm()}>Confirm and save selected entries</button></>}
 <h3>Confirmed medicines ({catalog.length})</h3>{catalog.slice(0,100).map(m=><article key={m.id}><strong>{m.name}</strong> {m.strength} {m.form}<div className="rack">Rack {m.rack} · Shelf {m.shelf}</div></article>)}
 <button onClick={()=>setStage("prescription")}>Next: find medicines</button></section>}
 {stage==="prescription"&&<section><h2>Find a medicine's rack</h2><p>Choose how to look up a medicine. Both methods search only your confirmed local catalog; they do not suggest substitute medicines.</p>
 <div className="search-row" role="group" aria-label="Search method"><button className={searchMode==="text"?"":"outline"} aria-pressed={searchMode==="text"} onClick={()=>{setSearchMode("text");setMessage("");}}>⌨ Text search</button><button className={searchMode==="scan"?"":"outline"} aria-pressed={searchMode==="scan"} onClick={()=>{setSearchMode("scan");setMessage("");}}>▣ Scan prescription</button></div>
 {searchMode==="text"?<><h3>Search by medicine name</h3><p>Enter one medicine per line, including strength where known. Example: Dolo 650. Matches must correspond to confirmed catalog entries.</p></>:<><h3>Scan a test prescription</h3><p>Use only a synthetic printed English prescription. OCR is experimental; handwriting and multilingual recognition are not validated. Never upload real patient information.</p><label className="upload">Capture or upload prescription image<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"rx");e.target.value="";}}/></label><p>OCR runs in your browser. Carefully correct every extracted medicine name and strength before searching.</p></>}
 <label htmlFor="rx-text">{searchMode==="text"?"Medicine names (one per line)":"Recognized prescription text (review and edit)"}</label><textarea id="rx-text" rows={5} style={{width:"100%"}} placeholder={"Dolo 650\nCetirizine 10 mg"} value={rxText} onChange={e=>setRxText(e.target.value)}/><p>Review name, strength and formulation with a qualified pharmacist. Unmatched entries are flagged, never substituted.</p><button disabled={busy||!rxText.trim()} onClick={findRacks}>Find rack locations</button></section>}
 {stage==="results"&&<section><h2>Medicine rack locations</h2><p>Showing exact matches against your locally confirmed catalog. Multiple matching records require manual verification.</p>{matches.map((result,i)=><article key={i}><h3>{result.query}</h3>{result.matches.length?result.matches.map((m,j)=><div key={j} className="rack"><strong>{m.name}</strong> {m.strength} {m.form} — Rack {m.rack}, Shelf {m.shelf}</div>):<p className="missing">No exact catalog match. Check spelling, strength and formulation with pharmacist.</p>}</article>)}<button className="outline" onClick={()=>setStage("prescription")}>Back to search</button></section>}
 <footer>Local pilot only · OCR suggestions require confirmation · No automatic substitutions or dispensing decisions</footer>
 </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><Pilot/></React.StrictMode>);
