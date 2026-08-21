import { createClient } from '@/lib/supabase/server'
import { demoIssues, demoReports, demoStats, demoTaxpayers, demoVault, demoComplianceTasks, demoNotes, demoAttention, demoComplianceObligations, demoComplianceStats } from '@/lib/demo-data'

export function isDemoMode() {
  return process.env.DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL
}

export async function getDashboardStats() {
  if (isDemoMode()) return demoStats
  const supabase = await createClient()
  const [total,badan,op,issues,filings,dupes] = await Promise.all([
    supabase.from('taxpayers').select('*',{count:'exact',head:true}),
    supabase.from('taxpayers').select('*',{count:'exact',head:true}).eq('taxpayer_type','BADAN'),
    supabase.from('taxpayers').select('*',{count:'exact',head:true}).eq('taxpayer_type','OP'),
    supabase.from('taxpayer_issues').select('*',{count:'exact',head:true}).neq('status','resolved'),
    supabase.from('filing_tasks').select('*',{count:'exact',head:true}),
    supabase.from('data_quality_flags').select('*',{count:'exact',head:true}).is('resolved_at',null),
  ])
  return {total:total.count||0,badan:badan.count||0,op:op.count||0,openIssues:issues.count||0,reportingRows:filings.count||0,duplicates:dupes.count||0}
}

export async function getTaxpayers(q?:string,type?:string) {
  if (isDemoMode()) {
    return demoTaxpayers.filter(x => (!type || type==='ALL' || x.taxpayer_type===type) && (!q || `${x.name} ${x.npwp}`.toLowerCase().includes(q.toLowerCase())))
  }
  const supabase = await createClient()
  let query = supabase.from('taxpayers').select('id,name,taxpayer_type,npwp,status,updated_at').order('name').limit(500)
  if (type && type!=='ALL') query = query.eq('taxpayer_type',type)
  if (q) query = query.or(`name.ilike.%${q}%,npwp.ilike.%${q}%,npwp16.ilike.%${q}%`)
  const {data,error} = await query
  if (error) throw error
  return data || []
}

export async function getTaxpayer(id:string) {
  if (isDemoMode()) {
    const base = demoTaxpayers.find(x=>x.id===id) || demoTaxpayers[0]
    return {...base,npwp16:'Tersimpan setelah import',contacts:[{contact_type:'email',value:'Disembunyikan pada mode demo'}],taxpayer_issues:demoIssues.filter((i:any)=>i.taxpayer_name===base.name).slice(0,5),filing_tasks:demoReports.filter((r:any)=>r.taxpayer_name===base.name).slice(0,5),document_requirements:[{document_name:'KTP',status:'missing'},{document_name:'KK',status:'received'},{document_name:'Akta',status:'missing'}],credential_records:demoVault.filter((c:any)=>c.taxpayer_name===base.name).slice(0,5),compliance_obligations:demoComplianceObligations.filter((o:any)=>o.taxpayer_id===base.id),compliance_period_tasks:demoComplianceTasks.filter((t:any)=>t.taxpayer_id===base.id),taxpayer_notes:demoNotes.filter((n:any)=>n.taxpayer_id===base.id),attention_items:demoAttention.filter((a:any)=>a.taxpayer_id===base.id)}
  }
  const supabase = await createClient()
  const {data,error}=await supabase.from('taxpayers').select(`*,contacts(*),taxpayer_issues(*),filing_tasks(*),document_requirements(*),credential_records(id,kind,label,updated_at),compliance_obligations(*),compliance_period_tasks(*),taxpayer_notes(*),attention_items(*)`).eq('id',id).single()
  if(error) throw error
  return data
}

export async function getIssues(){
  if(isDemoMode()) return demoIssues
  const supabase=await createClient()
  const {data,error}=await supabase.from('taxpayer_issues').select('id,title,status,required_documents,taxpayers(name)').order('created_at',{ascending:false}).limit(300)
  if(error) throw error
  return (data||[]).map((x:any)=>({...x,taxpayer_name:x.taxpayers?.name||'—',required:Array.isArray(x.required_documents)?x.required_documents.join(', '):'—'}))
}
export async function getReports(){
  if(isDemoMode()) return demoReports
  const supabase=await createClient()
  const {data,error}=await supabase.from('filing_tasks').select('id,period_month,period_year,tax_type,status,taxpayers(name)').order('period_year',{ascending:false}).order('period_month',{ascending:false}).limit(500)
  if(error) throw error
  return (data||[]).map((x:any)=>({...x,taxpayer_name:x.taxpayers?.name||'—',period:`${String(x.period_month).padStart(2,'0')}/${x.period_year}`}))
}
export async function getVaultMetadata(){
  if(isDemoMode()) return demoVault
  const supabase=await createClient()
  const {data,error}=await supabase.from('credential_records').select('id,kind,label,updated_at,taxpayers(name)').order('updated_at',{ascending:false}).limit(300)
  if(error) throw error
  return (data||[]).map((x:any)=>({...x,taxpayer_name:x.taxpayers?.name||'—'}))
}

export async function getComplianceTasks(cadence:'monthly'|'annual'='monthly') {
  if (isDemoMode()) return demoComplianceTasks.filter((x:any)=>x.cadence===cadence)
  const supabase = await createClient()
  const {data,error}=await supabase.from('compliance_period_tasks')
    .select(`id,period_year,period_month,due_date,status,taxpayer_id,taxpayers(name),compliance_obligations(label,cadence)`)
    .order('due_date',{ascending:true,nullsFirst:false}).limit(1000)
  if(error) throw error
  return (data||[]).filter((x:any)=>x.compliance_obligations?.cadence===cadence).map((x:any)=>({
    ...x,
    taxpayer_name:x.taxpayers?.name||'—',
    label:x.compliance_obligations?.label||'Kewajiban',
    cadence:x.compliance_obligations?.cadence||cadence,
    period: cadence==='monthly' ? `${String(x.period_month||'').padStart(2,'0')}/${x.period_year}` : String(x.period_year)
  }))
}

export async function getAttentionItems(){
  if(isDemoMode()) return demoAttention
  const supabase=await createClient()
  const [manualResult,taskResult,issueResult]=await Promise.all([
    supabase.from('attention_items').select('id,title,description,priority,status,source_type,due_date,taxpayer_id,taxpayers(name)').neq('status','resolved').limit(500),
    supabase.from('compliance_period_tasks').select('id,status,due_date,taxpayer_id,taxpayers(name),compliance_obligations(label)').neq('status','completed').neq('status','not_applicable').limit(1000),
    supabase.from('taxpayer_issues').select('id,title,description,status,taxpayer_id,taxpayers(name)').neq('status','resolved').limit(500),
  ])
  if(manualResult.error) throw manualResult.error
  if(taskResult.error) throw taskResult.error
  if(issueResult.error) throw issueResult.error
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const manual=(manualResult.data||[]).map((x:any)=>({...x,taxpayer_name:x.taxpayers?.name||'—'}))
  const taskAttention=(taskResult.data||[]).flatMap((x:any)=>{
    const label=x.compliance_obligations?.label||'Kewajiban'
    let priority:string|undefined, title:string|undefined
    if(x.status==='blocked'){priority='critical';title=`${label} terblokir`}
    else if(x.status==='waiting_documents'){priority='high';title=`Dokumen ${label} belum lengkap`}
    else if(x.status==='waiting_client'){priority='high';title=`Menunggu client — ${label}`}
    else if(x.status==='waiting_review'){priority='medium';title=`${label} menunggu review`}
    else if(x.due_date && x.due_date<today){priority='high';title=`${label} melewati deadline`}
    if(!priority||!title) return []
    return [{id:`task-${x.id}`,taxpayer_id:x.taxpayer_id,taxpayer_name:x.taxpayers?.name||'—',title,description:`Status: ${x.status}`,priority,status:'open',source_type:'compliance',due_date:x.due_date}]
  })
  const issueAttention=(issueResult.data||[]).map((x:any)=>({id:`issue-${x.id}`,taxpayer_id:x.taxpayer_id,taxpayer_name:x.taxpayers?.name||'—',title:x.title,description:x.description||'Kendala WP aktif',priority:'high',status:'open',source_type:'issue',due_date:null}))
  return [...manual,...taskAttention,...issueAttention]
}


export async function getTaxpayerNotes(taxpayerId?:string){
  if(isDemoMode()) return demoNotes.filter((x:any)=>!taxpayerId||x.taxpayer_id===taxpayerId)
  const supabase=await createClient()
  let query=supabase.from('taxpayer_notes')
    .select('id,taxpayer_id,category,note_text,pinned,created_at,taxpayers(name),app_users(display_name)')
    .order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(500)
  if(taxpayerId) query=query.eq('taxpayer_id',taxpayerId)
  const {data,error}=await query
  if(error) throw error
  return (data||[]).map((x:any)=>({...x,taxpayer_name:x.taxpayers?.name||'—',author:x.app_users?.display_name||'Staff'}))
}

export async function getComplianceStats(){
  if(isDemoMode()) return demoComplianceStats
  const supabase=await createClient()
  const [configured,monthly,monthlyCompleted,annual,attention,pinned,totalResult] = await Promise.all([
    supabase.from('compliance_obligations').select('taxpayer_id'),
    supabase.from('compliance_period_tasks').select('id,compliance_obligations!inner(cadence)',{count:'exact',head:true}).eq('compliance_obligations.cadence','monthly'),
    supabase.from('compliance_period_tasks').select('id,compliance_obligations!inner(cadence)',{count:'exact',head:true}).eq('compliance_obligations.cadence','monthly').eq('status','completed'),
    supabase.from('compliance_period_tasks').select('id,compliance_obligations!inner(cadence)',{count:'exact',head:true}).eq('compliance_obligations.cadence','annual'),
    supabase.from('attention_items').select('*',{count:'exact',head:true}).neq('status','resolved'),
    supabase.from('taxpayer_notes').select('*',{count:'exact',head:true}).eq('pinned',true),
    supabase.from('taxpayers').select('*',{count:'exact',head:true}),
  ])
  const uniqueConfigured=new Set((configured.data||[]).map((x:any)=>x.taxpayer_id)).size
  const derivedAttention=await getAttentionItems()
  return {configuredTaxpayers:uniqueConfigured,totalTaxpayers:totalResult.count||0,monthlyTasks:monthly.count||0,monthlyCompleted:monthlyCompleted.count||0,annualTasks:annual.count||0,openAttention:derivedAttention.length,pinnedNotes:pinned.count||0}
}
