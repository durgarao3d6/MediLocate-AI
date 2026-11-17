import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {listStores,saveStore,listMedicines,saveMedicines,type PilotMedicine,type PilotStore} from "./pilot-db";
import {parseSpreadsheet,extractPhoto,matchCatalog,type DraftMedicine} from "./pilot-extract";
import "./style.css";

type BillLine={id:string;name:string;strength:string;form:string;quantity:number;price:number};
type DemoBill={id:string;createdAt:string;lines:BillLine[];discount:number;total:number};
const money=(n:number)=>"₹"+n.toFixed(2);
const billKey=(id:string)=>"medilocate-demo-bills:"+id;
function Pilot(){
 const [stores,setStores]=useState<PilotStore[]>([]);
 const [storeId,setStoreId]=useState("");
 const [storeName,setStoreName]=useState("");
 const [catalog,setCatalog]=useState<PilotMedicine[]>([]);
 const [drafts,setDrafts]=useState<DraftMedicine[]>([]);
 const [stage,setStage]=useState<"onboard"|"catalog"|"prescription"|"results"|"billing">("onboard");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [rack,setRack]=useState("");
 const [shelf,setShelf]=useState("");
 const [rxText,setRxText]=useState("");
 const [searchMode,setSearchMode]=useState<"text"|"scan">("text");
 const [matches,setMatches]=useState<ReturnType<typeof matchCatalog>>([]);
 const [billLines,setBillLines]=useState<BillLine[]>([]);
 const [discount,setDiscount]=useState(0);
 const [billHistory,setBillHistory]=useState<DemoBill[]>([]);
 const [printedBill,setPrintedBill]=useState<DemoBill|null>(null);
 const subtotal=billLines.reduce((sum,line)=>sum+line.price*line.quantity,0);
 const total=Math.max(0,subtotal*(1-discount/100));
 useEffect(()=>{void listStores().then(setStores).catch(e=>setMessage(String(e)));},[]);
 async function selectStore(id:string){setStoreId(id);setCatalog(await listMedicines(id));setBillLines([]);setPrintedBill(null);setDiscount(0);try{const saved=JSON.parse(localStorage.getItem(billKey(id))||"[]");setBillHistory(Array.isArray(saved)?saved:[]);}catch{setBillHistory([]);}setStage("catalog");setDrafts([]);setMessage("");}
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
 function addToBill(m:PilotMedicine){setBillLines(lines=>{const found=lines.find(line=>line.id===m.id);return found?lines.map(line=>line.id===m.id?{...line,quantity:line.quantity+1}:line):[...lines,{id:m.id,name:m.name,strength:m.strength,form:m.form,quantity:1,price:0}];});setPrintedBill(null);setMessage("Added to demo bill. Enter a sample unit price and verify the medicine.");}
 function updateBillLine(id:string,field:"price"|"quantity",value:number){setBillLines(lines=>lines.map(line=>line.id===id?{...line,[field]:value}:line));setPrintedBill(null);}
 function saveDemoBill(){if(!billLines.length||billLines.some(line=>!Number.isFinite(line.price)||line.price<=0||!Number.isInteger(line.quantity)||line.quantity<1)){setMessage("Add medicines and enter a positive sample unit price and whole-number quantity for every item.");return;}const bill:DemoBill={id:"DEMO-"+Date.now(),createdAt:new Date().toISOString(),lines:billLines.map(line=>({...line})),discount,total};try{const next=[bill,...billHistory].slice(0,50);localStorage.setItem(billKey(storeId),JSON.stringify(next));setBillHistory(next);setPrintedBill(bill);setBillLines([]);setDiscount(0);setMessage("Demo bill saved locally. Use Print sample receipt to print.");}catch{setMessage("Could not save demo bill in this browser. Check available storage.");}}
 function findRacks(){const lines=rxText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length){setMessage("Enter a medicine name or review the extracted prescription text before searching.");return;}setMessage("");setMatches(matchCatalog(catalog,lines));setStage("results");}
 return <main>
 <header><div className="brand">✚</div><div><h1>MediLocate AI</h1><p>Shopkeeper pilot · local device data</p></div></header>
 <nav className="search-row"><button className="outline" onClick={()=>setStage("onboard")}>1. Shop</button><button className="outline" disabled={!storeId} onClick={()=>setStage("catalog")}>2. Racks</button><button className="outline" disabled={!storeId} onClick={()=>setStage("prescription")}>3. Find medicines</button><button className="outline" disabled={!storeId} onClick={()=>setStage("billing")}>4. Demo billing</button></nav>
 {message&&<p className="notice" role="status">{message}</p>}
 {busy&&<p role="status">Processing on this device…</p>}
 {stage==="onboard"&&<section className="search-card"><h2>Start your pharmacy pilot</h2><p>No account or cloud upload required. Choose a local shop profile or create one.</p><div className="search-row"><input aria-label="Shop name" placeholder="Shop name" value={storeName} onChange={e=>setStoreName(e.target.value)}/><button onClick={()=>void createStore()}>Start pilot</button></div>{stores.map(s=><p key={s.id}><button className="outline" onClick={()=>void selectStore(s.id)}>{s.name}</button></p>)}</section>}
 {stage==="catalog"&&<section><h2>Rack inventory · {stores.find(s=>s.id===storeId)?.name}</h2><p>Upload an Excel file with columns: name, strength, form, rack, shelf. Or photograph a rack, then manually confirm OCR candidates.</p>
 <div className="search-row"><label className="upload">Upload Excel (.xlsx)<input type="file" accept=".xlsx" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"excel");e.target.value="";}}/></label><label className="upload">Photograph rack<input type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"rack");e.target.value="";}}/></label></div>
 <div className="search-row"><input aria-label="Default rack" placeholder="Rack (e.g. A3)" value={rack} onChange={e=>setRack(e.target.value)}/><input aria-label="Default shelf" placeholder="Shelf (e.g. 2)" value={shelf} onChange={e=>setShelf(e.target.value)}/><button className="outline" onClick={()=>setDrafts(v=>v.map(x=>({...x,rack,shelf})))}>Apply to drafts</button></div>
 {drafts.length>0&&<><h3>Review {drafts.length} candidates</h3><p>Only selected, confirmed entries with a rack and shelf will be saved.</p>{drafts.map((d,i)=><article key={i}><label><input type="checkbox" checked={d.selected} onChange={e=>updateDraft(i,"selected",e.target.checked)}/> Include</label><div className="search-row">{(["name","strength","form","rack","shelf"] as const).map(field=><input key={field} aria-label={field+" "+(i+1)} placeholder={field} value={d[field]} onChange={e=>updateDraft(i,field,e.target.value)}/>)}</div></article>)}<button onClick={()=>void confirm()}>Confirm and save selected entries</button></>}
 <h3>Confirmed medicines ({catalog.length})</h3>{catalog.slice(0,100).map(m=><article key={m.id}><strong>{m.name}</strong> {m.strength} {m.form}<div className="rack">Rack {m.rack} · Shelf {m.shelf}</div><button className="outline" onClick={()=>{addToBill(m);setStage("billing");}}>Add to demo bill</button></article>)}
 <button onClick={()=>setStage("prescription")}>Next: find medicines</button></section>}
 {stage==="prescription"&&<section><h2>Find a medicine's rack</h2><p>Choose how to look up a medicine. Both methods search only your confirmed local catalog; they do not suggest substitute medicines.</p>
 <div className="search-row" role="group" aria-label="Search method"><button className={searchMode==="text"?"":"outline"} aria-pressed={searchMode==="text"} onClick={()=>{setSearchMode("text");setMessage("");}}>⌨ Text search</button><button className={searchMode==="scan"?"":"outline"} aria-pressed={searchMode==="scan"} onClick={()=>{setSearchMode("scan");setMessage("");}}>▣ Scan prescription</button></div>
 {searchMode==="text"?<><h3>Search by medicine name</h3><p>Enter one medicine per line, including strength where known. Example: Dolo 650. Matches must correspond to confirmed catalog entries.</p></>:<><h3>Scan a test prescription</h3><p>Use only a synthetic printed English prescription. OCR is experimental; handwriting and multilingual recognition are not validated. Never upload real patient information.</p><label className="upload">Capture or upload prescription image<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,"rx");e.target.value="";}}/></label><p>OCR runs in your browser. Carefully correct every extracted medicine name and strength before searching.</p></>}
 <label htmlFor="rx-text">{searchMode==="text"?"Medicine names (one per line)":"Recognized prescription text (review and edit)"}</label><textarea id="rx-text" rows={5} style={{width:"100%"}} placeholder={"Dolo 650\nCetirizine 10 mg"} value={rxText} onChange={e=>setRxText(e.target.value)}/><p>Review name, strength and formulation with a qualified pharmacist. Unmatched entries are flagged, never substituted.</p><button disabled={busy||!rxText.trim()} onClick={findRacks}>Find rack locations</button></section>}
 {stage==="results"&&<section><h2>Medicine rack locations</h2><p>Showing exact matches against your locally confirmed catalog. Multiple matching records require manual verification.</p>{matches.map((result,i)=><article key={i}><h3>{result.query}</h3>{result.matches.length?result.matches.map((m,j)=><div key={j} className="rack"><strong>{m.name}</strong> {m.strength} {m.form} — Rack {m.rack}, Shelf {m.shelf} <button className="outline" onClick={()=>{const item=catalog.find(x=>x.name===m.name&&x.strength===m.strength&&x.form===m.form&&x.rack===m.rack&&x.shelf===m.shelf);if(item){addToBill(item);setStage("billing");}}}>Add to demo bill</button></div>):<p className="missing">No exact catalog match. Check spelling, strength and formulation with pharmacist.</p>}</article>)}<button className="outline" onClick={()=>setStage("prescription")}>Back to search</button></section>}
 {stage==="billing"&&<section><h2>Demo billing · sample receipts only</h2><p>This is an experimental counter workflow using sample prices. It is not a tax invoice, payment system, or live pharmacy billing solution. Do not use for real sales or patient data.</p>
 <h3>Add confirmed medicines</h3><div className="search-row"><button className="outline" onClick={()=>setStage("prescription")}>Find medicines</button><button className="outline" onClick={()=>setStage("catalog")}>View catalog</button></div>
 {catalog.length===0?<p className="missing">Add and confirm catalog medicines before creating a sample bill.</p>:<div className="billing-picker">{catalog.slice(0,100).map(m=><button key={m.id} className="outline" onClick={()=>addToBill(m)}>+ {m.name} {m.strength} {m.form}</button>)}</div>}
 <h3>Sample bill cart ({billLines.length})</h3>
 {billLines.length===0?<p className="missing">No items yet. Add a confirmed medicine above or from search results.</p>:billLines.map(line=><article key={line.id}><strong>{line.name} {line.strength} {line.form}</strong><div className="search-row"><label>Qty <input type="number" min="1" step="1" aria-label={"Quantity for "+line.name} value={line.quantity} onChange={e=>updateBillLine(line.id,"quantity",Number(e.target.value))}/></label><label>Sample unit price (₹) <input type="number" min="0" step="0.01" aria-label={"Price for "+line.name} value={line.price} onChange={e=>updateBillLine(line.id,"price",Number(e.target.value))}/></label><button className="outline" onClick={()=>setBillLines(lines=>lines.filter(x=>x.id!==line.id))}>Remove</button></div><small>Line total: {money(line.quantity*line.price)}</small></article>)}
 <div className="bill-summary"><label>Sample discount (%) <input type="number" min="0" max="100" step="1" value={discount} onChange={e=>setDiscount(Math.min(100,Math.max(0,Number(e.target.value)||0)))}/></label><p>Subtotal: {money(subtotal)}</p><p>Discount: {money(subtotal-total)}</p><h3>Total: {money(total)}</h3><p><small>Tax, batch, expiry, prescription and legal invoice compliance are not implemented.</small></p><button disabled={!billLines.length} onClick={saveDemoBill}>Save demo bill</button></div>
 <h3>Local demo bill history</h3>{billHistory.length===0?<p>No sample bills saved yet.</p>:billHistory.map(b=><article key={b.id}><strong>{b.id}</strong> · {new Date(b.createdAt).toLocaleString()} · {money(b.total)} <button className="outline" onClick={()=>setPrintedBill(b)}>View sample receipt</button></article>)}
 {printedBill&&<div className="sample-receipt" id="sample-receipt"><h2>SAMPLE RECEIPT — NOT A TAX INVOICE</h2><p>{stores.find(x=>x.id===storeId)?.name} · {printedBill.id}</p><p>{new Date(printedBill.createdAt).toLocaleString()}</p>{printedBill.lines.map(line=><p key={line.id}>{line.name} {line.strength} {line.form} · {line.quantity} × {money(line.price)} = {money(line.quantity*line.price)}</p>)}<p>Discount: {printedBill.discount}%</p><h3>Total: {money(printedBill.total)}</h3><p>DEMO ONLY · Not valid for sales, tax or dispensing.</p><button className="print-hide" onClick={()=>window.print()}>Print sample receipt</button></div>}
 </section>}
 <footer>Local demo only · Sample receipts are not tax invoices · OCR suggestions require confirmation · No automatic substitutions or dispensing decisions</footer>
 </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><Pilot/></React.StrictMode>);
