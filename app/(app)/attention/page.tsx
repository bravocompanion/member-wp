import Link from 'next/link'
import { Topbar } from '@/components/topbar'
import { getAttentionItems } from '@/lib/data'
import { Siren } from 'lucide-react'

export default async function AttentionPage(){
  const items:any[]=await getAttentionItems()
  const rank:any={critical:4,high:3,medium:2,low:1}
  items.sort((a,b)=>(rank[b.priority]||0)-(rank[a.priority]||0))
  return <><Topbar title="Attention Center" subtitle="Satu layar untuk seluruh WP yang memerlukan tindakan"/><div className="content">
    <div className="attentionSummary"><strong>{items.length} item aktif</strong><span>Prioritas tertinggi tampil lebih dulu</span></div>
    <div className="attentionList">{items.map(x=><article className={`attentionCard ${x.priority}`} key={x.id}>
      <div className="attentionIcon"><Siren size={18}/></div><div className="attentionBody"><div className="attentionTop"><Link href={`/taxpayers/${x.taxpayer_id}`}>{x.taxpayer_name}</Link><span className={`badge ${x.priority==='critical'?'danger':x.priority==='high'?'warn':''}`}>{x.priority}</span></div><h3>{x.title}</h3><p>{x.description||'—'}</p><div className="attentionMeta"><span>{x.source_type}</span><span>{x.status}</span><span>{x.due_date?`Due ${x.due_date}`:'Tanpa deadline'}</span></div></div>
    </article>)}{!items.length&&<div className="empty">Tidak ada item yang membutuhkan perhatian.</div>}</div>
  </div></>
}
