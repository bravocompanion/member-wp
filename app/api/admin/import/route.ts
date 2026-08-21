import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime='nodejs'
export const dynamic='force-dynamic'

type TaxpayerInput={source_sheet:string;source_row:number;taxpayer_type:'BADAN'|'OP';name:string;npwp?:string|null;npwp16?:string|null;nik?:string|null;kk?:string|null;notes?:string|null;contacts?:{contact_type:string;value:string;is_primary?:boolean}[];credentials?:{kind:string;label:string;secret:string}[]}
type IssueInput={source_sheet:string;source_row:number;taxpayer_name?:string|null;title:string;description?:string|null;required_documents?:string[]}
type FilingInput={taxpayer_name?:string|null;npwp?:string|null;tax_type:string;period_month:number;period_year:number;status?:string}

function eqToken(a:string,b:string){const ah=createHash('sha256').update(a).digest();const bh=createHash('sha256').update(b).digest();return timingSafeEqual(ah,bh)}
function normName(v?:string|null){return (v||'').trim().replace(/\s+/g,' ').toUpperCase()}

export async function POST(req:Request){
  const expected=process.env.ADMIN_IMPORT_TOKEN||''; const supplied=req.headers.get('x-member-wp-import-token')||''
  if(!expected||!supplied||!eqToken(expected,supplied)) return NextResponse.json({error:'Import token tidak valid.'},{status:401})
  const payload=await req.json() as {file_name?:string;source_hash?:string;taxpayers:TaxpayerInput[];issues?:IssueInput[];filings?:FilingInput[];duplicates?:{npwp:string;sources:string[]}[];summary?:Record<string,unknown>}
  if(!Array.isArray(payload.taxpayers)) return NextResponse.json({error:'Payload taxpayers tidak valid.'},{status:400})
  const admin=createAdminClient()
  const {data:batch,error:batchErr}=await admin.from('import_batches').insert({file_name:payload.file_name||'Member WP.xlsx',source_hash:payload.source_hash,status:'running',summary:payload.summary||{}}).select('id').single()
  if(batchErr) return NextResponse.json({error:batchErr.message},{status:500})
  const batchId=batch.id
  const bySource=new Map<string,string>(); const byName=new Map<string,string[]>(); const byNpwp=new Map<string,string[]>()
  let credentialCount=0, contactCount=0, issueCount=0, filingCount=0, docCount=0
  try{
    for(const t of payload.taxpayers){
      const row={source_sheet:t.source_sheet,source_row:t.source_row,taxpayer_type:t.taxpayer_type,name:t.name,npwp:t.npwp||null,npwp16:t.npwp16||null,nik:t.nik||null,kk:t.kk||null,notes:t.notes||null}
      const {data:tp,error}=await admin.from('taxpayers').upsert(row,{onConflict:'source_sheet,source_row'}).select('id,name,npwp').single(); if(error)throw error
      const id=tp.id as string; bySource.set(`${t.source_sheet}:${t.source_row}`,id)
      const nk=normName(t.name);byName.set(nk,[...(byName.get(nk)||[]),id]);if(t.npwp)byNpwp.set(t.npwp,[...(byNpwp.get(t.npwp)||[]),id])
      await admin.from('contacts').delete().eq('taxpayer_id',id)
      if(t.contacts?.length){const {error:e}=await admin.from('contacts').insert(t.contacts.filter(c=>c.value).map(c=>({...c,taxpayer_id:id})));if(e)throw e;contactCount+=t.contacts.length}
      for(const c of t.credentials||[]){if(!c.secret)continue;const {error:e}=await admin.rpc('store_taxpayer_credential',{p_taxpayer_id:id,p_kind:c.kind,p_label:c.label,p_secret:c.secret});if(e)throw e;credentialCount++}
    }

    for(const i of payload.issues||[]){
      const candidates=byName.get(normName(i.taxpayer_name)); const taxpayerId=candidates?.length===1?candidates[0]:null
      const {data:issue,error}=await admin.from('taxpayer_issues').upsert({taxpayer_id:taxpayerId,source_sheet:i.source_sheet,source_row:i.source_row,title:i.title,description:i.description||null,required_documents:i.required_documents||[],status:'open'},{onConflict:'source_sheet,source_row'}).select('id').single();if(error)throw error;issueCount++
      if(taxpayerId&&i.required_documents?.length){for(const d of i.required_documents){const {error:e}=await admin.from('document_requirements').upsert({taxpayer_id:taxpayerId,document_name:d,status:'missing'},{onConflict:'taxpayer_id,document_name'});if(e)throw e;docCount++}}
      if(!taxpayerId){await admin.from('data_quality_flags').insert({flag_type:'unmatched_issue_taxpayer',severity:'warning',details:{source_sheet:i.source_sheet,source_row:i.source_row,name:i.taxpayer_name,title:i.title}})}
    }

    for(const f of payload.filings||[]){
      const ids=f.npwp?byNpwp.get(f.npwp):undefined;const nids=byName.get(normName(f.taxpayer_name));const taxpayerId=ids?.length===1?ids[0]:nids?.length===1?nids[0]:null
      if(!taxpayerId){await admin.from('data_quality_flags').insert({flag_type:'unmatched_filing_taxpayer',severity:'warning',details:{name:f.taxpayer_name,npwp:f.npwp,period_month:f.period_month,period_year:f.period_year}});continue}
      const {error}=await admin.from('filing_tasks').upsert({taxpayer_id:taxpayerId,tax_type:f.tax_type,period_month:f.period_month,period_year:f.period_year,status:f.status||'not_started'},{onConflict:'taxpayer_id,tax_type,period_month,period_year'});if(error)throw error;filingCount++
    }

    await admin.from('data_quality_flags').delete().eq('flag_type','duplicate_npwp_source').is('resolved_at',null)
    for(const d of payload.duplicates||[]){for(const id of byNpwp.get(d.npwp)||[]){await admin.from('data_quality_flags').insert({taxpayer_id:id,flag_type:'duplicate_npwp_source',severity:'critical',details:{npwp:d.npwp,sources:d.sources}})}}

    const result={taxpayers:payload.taxpayers.length,contacts:contactCount,credentials:credentialCount,issues:issueCount,filings:filingCount,document_requirements:docCount,duplicate_groups:payload.duplicates?.length||0}
    await admin.from('import_batches').update({status:'completed',summary:{...(payload.summary||{}),imported:result},completed_at:new Date().toISOString()}).eq('id',batchId)
    return NextResponse.json({ok:true,batch_id:batchId,...result},{headers:{'cache-control':'no-store'}})
  }catch(e:any){await admin.from('import_batches').update({status:'failed',summary:{error:e.message},completed_at:new Date().toISOString()}).eq('id',batchId);return NextResponse.json({error:e.message,batch_id:batchId},{status:500})}
}
