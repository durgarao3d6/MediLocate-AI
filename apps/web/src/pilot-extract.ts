import ExcelJS from "exceljs";
import {createWorker} from "tesseract.js";
export type DraftMedicine={name:string;strength:string;form:string;rack:string;shelf:string;selected:boolean};
function str(value:unknown):string {if(value==null)return "";if(typeof value==="object"&&"text" in value)return String((value as {text:string}).text);return String(value).trim();}
export async function parseSpreadsheet(file:File):Promise<DraftMedicine[]>{
 const wb=new ExcelJS.Workbook();await wb.xlsx.load((await file.arrayBuffer()) as Parameters<typeof wb.xlsx.load>[0]);
 const sheet=wb.worksheets[0];if(!sheet)throw new Error("Spreadsheet has no worksheet");
 const rows:string[][]=[];sheet.eachRow((row)=>rows.push((row.values as unknown[]).slice(1).map(str)));
 if(!rows.length)throw new Error("Spreadsheet is empty");
 const headers=rows[0].map(x=>x.toLowerCase().replace(/[^a-z]/g,""));
 const index=(...names:string[])=>headers.findIndex(x=>names.includes(x));
 const name=index("name","medicine","medicinename","product","item");if(name<0)throw new Error("Required Excel column: name or medicine");
 const strength=index("strength","dosage"),form=index("form","formulation"),rack=index("rack","rackno","racknumber"),shelf=index("shelf","shelfno");
 return rows.slice(1).filter(row=>row[name]?.trim()).slice(0,2000).map(row=>({name:row[name],strength:row[strength]||"",form:row[form]||"",rack:row[rack]||"",shelf:row[shelf]||"",selected:true}));
}
export async function extractPhoto(file:File):Promise<{text:string;drafts:DraftMedicine[]}>{
 const worker=await createWorker("eng");
 try{const result=await worker.recognize(file);const text=result.data.text;
 const drafts=text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.length>=3).slice(0,100).map(name=>({name,strength:"",form:"",rack:"",shelf:"",selected:true}));
 return {text,drafts};}finally{await worker.terminate();}
}
export function matchCatalog(catalog:{name:string;strength:string;form:string;rack:string;shelf:string}[],queries:string[]){
 const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
 return queries.filter(Boolean).map(query=>{const q=norm(query);const matches=catalog.filter(m=>norm(m.name)===q||norm(m.name+" "+m.strength)===q);return {query,matches};});
}
