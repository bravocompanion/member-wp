import Link from 'next/link'
import { Topbar } from '@/components/topbar'
import { getComplianceTasks, getComplianceStats } from '@/lib/data'
import { CalendarDays, CalendarRange, CheckCircle2, Settings2 } from 'lucide-react'
import { TaskStatus } from '@/components/task-status'
import { TaskDueDate } from '@/components/task-due-date'
import { isDemoMode } from '@/lib/data'

const labels:any = {
  not_started:'Belum', waiting_documents:'Tunggu Dokumen', in_progress:'Proses', waiting_review:'Review', waiting_client:'Tunggu Client', blocked:'Kendala', completed:'Selesai', not_applicable:'N/A'
}
const cls:any = {completed:'ok',blocked:'danger',waiting_documents:'warn',waiting_client:'warn',not_started:'muted'}

export default async function CompliancePage({searchParams}:{searchParams:Promise<{view?:string}>}){
  const p=await searchParams
  const view=p.view==='annual'?'annual':'monthly'
  const [tasks,stats]=await Promise.all([getComplianceTasks(view),getComplianceStats()])
  const demo=isDemoMode()
  const completion=stats.monthlyTasks ? Math.round((stats.monthlyCompleted/stats.monthlyTasks)*100) : 0
  return <>
    <Topbar title="Kontrol Kewajiban" subtitle="Kewajiban hanya aktif setelah dikonfirmasi admin per WP"/>
    <div className="content">
      <div className="notice" style={{marginBottom:16}}><strong>Kontrol admin:</strong> katalog PPh/PPN/SPT hanyalah pilihan konfigurasi. Sistem tidak menetapkan kewajiban secara otomatis berdasarkan jenis WP.</div>
      <div className="gridStats complianceStats">
        <div className="statCard"><div><div className="label">Profil dikonfigurasi</div><div className="value">{stats.configuredTaxpayers}/{stats.totalTaxpayers}</div><div className="hint">WP sudah memiliki profil</div></div><div className="statIcon"><Settings2 size={19}/></div></div>
        <div className="statCard"><div><div className="label">Task bulanan</div><div className="value">{stats.monthlyTasks}</div><div className="hint">{completion}% selesai</div></div><div className="statIcon"><CalendarDays size={19}/></div></div>
        <div className="statCard"><div><div className="label">Task tahunan</div><div className="value">{stats.annualTasks}</div><div className="hint">Tahun berjalan</div></div><div className="statIcon"><CalendarRange size={19}/></div></div>
        <div className="statCard"><div><div className="label">Selesai bulanan</div><div className="value">{stats.monthlyCompleted}</div><div className="hint">Dari task yang dikonfigurasi</div></div><div className="statIcon"><CheckCircle2 size={19}/></div></div>
      </div>
      <div className="segmented" style={{marginBottom:14}}><Link className={view==='monthly'?'active':''} href="/compliance?view=monthly">Bulanan</Link><Link className={view==='annual'?'active':''} href="/compliance?view=annual">Tahunan</Link></div>
      <section className="card tableCard">
        <div className="cardHeader"><div><h2>{view==='monthly'?'Kewajiban Bulanan':'Kewajiban Tahunan'}</h2><p>{view==='monthly'?'Kontrol per masa pajak / periode kerja':'Kontrol pekerjaan tahunan per WP'}</p></div></div>
        <div className="tableWrap"><table><thead><tr><th>Wajib Pajak</th><th>Kewajiban</th><th>Periode</th><th>Deadline</th><th>Status</th></tr></thead><tbody>
          {(tasks as any[]).map((t:any)=><tr key={t.id}><td><Link className="tableLink" href={`/taxpayers/${t.taxpayer_id}`}>{t.taxpayer_name}</Link></td><td>{t.label}</td><td>{t.period}</td><td><TaskDueDate id={t.id} value={t.due_date} demo={demo}/></td><td><TaskStatus id={t.id} status={t.status} demo={demo}/></td></tr>)}
          {!tasks.length&&<tr><td colSpan={5}><div className="empty">Belum ada task. Buka Wajib Pajak → Profil Kewajiban untuk mulai konfigurasi.</div></td></tr>}
        </tbody></table></div>
      </section>
    </div>
  </>
}
