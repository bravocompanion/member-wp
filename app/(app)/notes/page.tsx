import Link from 'next/link'
import { Topbar } from '@/components/topbar'
import { getTaxpayerNotes } from '@/lib/data'
import { Pin, StickyNote } from 'lucide-react'

export default async function NotesPage(){
  const notes:any[]=await getTaxpayerNotes()
  return <><Topbar title="Catatan WP" subtitle="Timeline pengetahuan operasional yang tidak boleh tercecer"/><div className="content">
    <section className="card"><div className="cardHeader"><div><h2>Timeline Catatan</h2><p>Catatan ter-pin selalu muncul lebih dulu</p></div><StickyNote size={20}/></div>
      <div className="timeline">{notes.map(n=><div className="timelineItem" key={n.id}><div className="timelineDot"/><div className="timelineContent"><div className="timelineHead"><Link href={`/taxpayers/${n.taxpayer_id}`}>{n.taxpayer_name}</Link><span className="badge">{n.category}</span>{n.pinned&&<span className="badge warn"><Pin size={11}/> Pin</span>}</div><p>{n.note_text}</p><small>{n.author||'Staff'} · {new Date(n.created_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</small></div></div>)}{!notes.length&&<div className="empty">Belum ada catatan.</div>}</div>
    </section>
  </div></>
}
