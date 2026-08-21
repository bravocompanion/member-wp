import { Topbar } from '@/components/topbar'
import { getTaxpayer, isDemoMode } from '@/lib/data'
import { Building2, KeyRound, ClipboardCheck, StickyNote, Siren, Pin } from 'lucide-react'
import { ObligationManager } from '@/components/obligation-manager'
import { NoteForm } from '@/components/note-form'
import { TaskStatus } from '@/components/task-status'

export default async function TaxpayerDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params; const x:any=await getTaxpayer(id); const demo=isDemoMode()
  const obligations=(x.compliance_obligations||[]).filter((o:any)=>o.active!==false)
  const tasks=x.compliance_period_tasks||[]
  const notes=[...(x.taxpayer_notes||[])].sort((a:any,b:any)=>(Number(b.pinned)-Number(a.pinned))||String(b.created_at).localeCompare(String(a.created_at)))
  const attention=(x.attention_items||[]).filter((a:any)=>a.status!=='resolved')
  return <><Topbar title="Detail Wajib Pajak" subtitle="Control center per WP — profil, kewajiban, catatan dan kendala"/><div className="content">
    <div className="detailHero"><div><h2>{x.name}</h2><p className="mono">NPWP {x.npwp||'—'} · NPWP16 {x.npwp16||'—'}</p><div className="detailMeta"><span className="badge">{x.taxpayer_type}</span><span className="badge">{x.status||'active'}</span><span className="badge ok">{obligations.length} kewajiban aktif</span>{attention.length>0&&<span className="badge warn">{attention.length} attention</span>}</div></div><Building2 size={32}/></div>

    <section className="card fullCard"><div className="cardHeader"><div><h2><ClipboardCheck size={18}/> Profil Kewajiban</h2><p>Pilih hanya kewajiban yang sudah diverifikasi admin untuk WP ini.</p></div></div>
      <div className="notice" style={{marginBottom:14}}>Sistem tidak menentukan PPN/PPh/SPT secara otomatis dari kategori Badan/OP. Perubahan profil tercatat di audit log.</div>
      <ObligationManager taxpayerId={x.id} existing={x.compliance_obligations||[]} demo={demo}/>
    </section>

    <div className="detailGrid">
      <section className="card"><h3 className="sectionTitle">Task Periode</h3>{tasks.length?tasks.slice(0,10).map((t:any)=><div className="miniItem" key={t.id}><div><strong>{t.label||t.tax_type||'Kewajiban'}</strong><br/><span>{t.period_month?`${String(t.period_month).padStart(2,'0')}/${t.period_year}`:t.period_year} · {t.due_date?`Due ${t.due_date}`:'Deadline belum ditetapkan'}</span></div><TaskStatus id={t.id} status={t.status} demo={demo}/></div>):<div className="empty">Belum ada task periode. Simpan profil kewajiban untuk membuat task periode berjalan.</div>}</section>

      <section className="card"><h3 className="sectionTitle"><Siren size={15}/> Attention</h3>{attention.length?attention.slice(0,8).map((a:any)=><div className="miniItem" key={a.id}><div><strong>{a.title}</strong><br/><span>{a.description||a.source_type}</span></div><span className={`badge ${a.priority==='critical'?'danger':a.priority==='high'?'warn':''}`}>{a.priority}</span></div>):<div className="empty">Tidak ada attention aktif.</div>}</section>

      <section className="card notesCard"><h3 className="sectionTitle"><StickyNote size={15}/> Catatan</h3><NoteForm taxpayerId={x.id} demo={demo}/><div className="noteMiniList">{notes.slice(0,8).map((n:any)=><div className="noteMini" key={n.id}><div className="noteMiniHead"><span className="badge">{n.category}</span>{n.pinned&&<span className="badge warn"><Pin size={10}/> pin</span>}</div><p>{n.note_text}</p><small>{n.author||'Staff'} · {n.created_at?new Date(n.created_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'—'}</small></div>)}{!notes.length&&<div className="empty">Belum ada catatan.</div>}</div></section>

      <section className="card"><h3 className="sectionTitle">Profil & Kontak</h3><dl className="kv"><dt>Jenis WP</dt><dd>{x.taxpayer_type}</dd><dt>NPWP</dt><dd className="mono">{x.npwp||'—'}</dd><dt>NPWP 16</dt><dd className="mono">{x.npwp16||'—'}</dd><dt>Status</dt><dd>{x.status||'active'}</dd></dl>{(x.contacts||[]).map((c:any)=><div className="miniItem" key={c.id||c.contact_type+c.value}><strong>{c.contact_type||'Kontak'}</strong><span>{c.value}</span></div>)}</section>

      <section className="card"><h3 className="sectionTitle">Dokumen & Kendala</h3><div className="docGrid">{(x.document_requirements||[]).map((d:any)=><div className="docItem" key={d.id||d.document_name}><span>{d.document_name}</span><span className={d.status==='received'?'badge ok':'badge warn'}>{d.status}</span></div>)}</div>{(x.taxpayer_issues||[]).slice(0,5).map((i:any)=><div className="miniItem" key={i.id}><div><strong>{i.title}</strong><br/><span>{i.status}</span></div><span className="badge warn">Issue</span></div>)}</section>

      <section className="card"><h3 className="sectionTitle"><KeyRound size={15}/> Credential metadata</h3><div className="notice" style={{marginBottom:12}}>Nilai credential tidak pernah dimuat oleh halaman ini. Reveal tetap melalui route server khusus dan dicatat ke activity log.</div>{(x.credential_records||[]).map((c:any)=><div className="credential" key={c.id}><div><strong>{c.label||c.kind}</strong><br/><span>{c.kind}</span></div><span className="badge ok">Vault</span></div>)}{!(x.credential_records||[]).length&&<div className="empty">Tidak ada metadata credential yang ditampilkan.</div>}</section>
    </div>
  </div></>
}
