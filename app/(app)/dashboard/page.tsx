import Link from 'next/link'
import { Topbar } from '@/components/topbar'
import { getDashboardStats, getComplianceStats, getAttentionItems, getTaxpayerNotes } from '@/lib/data'
import { Users, Building2, UserRound, CircleAlert, ClipboardCheck, Siren, Pin, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage(){
  const [s,c,attention,notes]=await Promise.all([getDashboardStats(),getComplianceStats(),getAttentionItems(),getTaxpayerNotes()])
  const completion=c.monthlyTasks?Math.round((c.monthlyCompleted/c.monthlyTasks)*100):0
  const pinned=(notes as any[]).filter((x:any)=>x.pinned).slice(0,3)
  return <>
    <Topbar title="Dashboard Admin" subtitle="Control center Member WP — kewajiban, catatan dan perhatian"/>
    <div className="content">
      <div className="gridStats">
        <div className="statCard"><div><div className="label">Total WP</div><div className="value">{s.total}</div><div className="hint">{s.badan} Badan · {s.op} OP</div></div><div className="statIcon"><Users size={19}/></div></div>
        <div className="statCard"><div><div className="label">Profil Kewajiban</div><div className="value">{c.configuredTaxpayers}/{c.totalTaxpayers}</div><div className="hint">Sudah dikonfigurasi admin</div></div><div className="statIcon"><ClipboardCheck size={19}/></div></div>
        <div className="statCard"><div><div className="label">Bulanan Selesai</div><div className="value">{completion}%</div><div className="hint">{c.monthlyCompleted}/{c.monthlyTasks} task</div></div><div className="statIcon"><Building2 size={19}/></div></div>
        <div className="statCard"><div><div className="label">Attention</div><div className="value">{c.openAttention}</div><div className="hint">Perlu tindakan admin/staff</div></div><div className="statIcon warn"><Siren size={19}/></div></div>
      </div>

      <div className="twoCol">
        <section className="card">
          <div className="cardHeader"><div><h2>Kontrol Kewajiban Bulanan</h2><p>Hanya task dari profil yang sudah dikonfirmasi</p></div><ClipboardCheck size={20}/></div>
          <div className="progressRow"><span>Progress periode berjalan</span><strong>{completion}%</strong></div>
          <div className="progress"><span style={{width:`${completion}%`}}/></div>
          <div className="metricStrip"><div><b>{c.monthlyTasks}</b><span>Total task</span></div><div><b>{c.monthlyCompleted}</b><span>Selesai</span></div><div><b>{c.annualTasks}</b><span>Tahunan</span></div></div>
          <Link className="textAction" href="/compliance">Buka kontrol kewajiban <ArrowRight size={14}/></Link>
        </section>
        <section className="card">
          <div className="cardHeader"><div><h2>Perlu Perhatian</h2><p>Prioritas tertinggi seluruh WP</p></div><Siren size={20}/></div>
          <div className="miniList">{(attention as any[]).slice(0,5).map((x:any)=><div className="miniItem" key={x.id}><div><strong>{x.taxpayer_name}</strong><br/><span>{x.title}</span></div><span className={`badge ${x.priority==='critical'?'danger':x.priority==='high'?'warn':''}`}>{x.priority}</span></div>)}{!attention.length&&<div className="empty">Tidak ada attention aktif.</div>}</div>
          <Link className="textAction" href="/attention">Buka Attention Center <ArrowRight size={14}/></Link>
        </section>
      </div>

      <div className="twoCol">
        <section className="card">
          <div className="cardHeader"><div><h2>Catatan Penting</h2><p>Pin informasi yang tidak boleh terlewat</p></div><Pin size={20}/></div>
          <div className="miniList">{pinned.map((n:any)=><div className="miniItem" key={n.id}><div><strong>{n.taxpayer_name}</strong><br/><span>{n.note_text}</span></div><span className="badge warn">PIN</span></div>)}{!pinned.length&&<div className="empty">Belum ada catatan ter-pin.</div>}</div>
          <Link className="textAction" href="/notes">Lihat semua catatan <ArrowRight size={14}/></Link>
        </section>
        <section className="card">
          <div className="cardHeader"><div><h2>Data & Kendala</h2><p>Kontrol kualitas master WP</p></div><CircleAlert size={20}/></div>
          <div className="miniList">
            <div className="miniItem"><div><strong>{s.openIssues} kendala sumber</strong><br/><span>Coretax, email, dokumen dan isu lain</span></div><span className="badge warn">Open</span></div>
            <div className="miniItem"><div><strong>{s.duplicates} potensi NPWP ganda</strong><br/><span>Tetap perlu review manual</span></div><span className="badge danger">Audit</span></div>
            <div className="miniItem"><div><strong>Credential sensitif</strong><br/><span>Tetap terpisah dari halaman WP</span></div><span className="badge ok">Vault</span></div>
          </div>
        </section>
      </div>
    </div>
  </>
}
