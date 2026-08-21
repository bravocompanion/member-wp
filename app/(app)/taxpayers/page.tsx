import Link from 'next/link'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { Topbar } from '@/components/topbar'
import { getTaxpayers } from '@/lib/data'

export const metadata = { title: 'Wajib Pajak' }
export default async function TaxpayersPage({searchParams}:{searchParams:Promise<{q?:string;type?:string}>}){
  const sp=await searchParams; const q=sp.q||''; const type=sp.type||'ALL'; const rows=await getTaxpayers(q,type)
  return <><Topbar title="Wajib Pajak" subtitle="Master WP Badan dan Orang Pribadi"/><div className="content">
    <div className="tableCard">
      <form className="toolbar"><div className="searchInput"><Search size={17}/><input name="q" defaultValue={q} placeholder="Cari nama, NPWP, NPWP 16..."/></div>
        <select className="select" name="type" defaultValue={type}><option value="ALL">Semua WP</option><option value="BADAN">WP Badan</option><option value="OP">WP OP</option></select>
        <button className="btn secondary"><SlidersHorizontal size={15}/>Terapkan</button><button type="button" className="btn"><Plus size={15}/>Tambah WP</button>
      </form>
      <div className="tableMeta">Menampilkan <strong>{rows.length}</strong> wajib pajak{q || type !== 'ALL' ? ' sesuai filter' : ''}.</div>
      <table className="dataTable"><thead><tr><th>Nama WP</th><th>Jenis</th><th>NPWP</th><th>Status</th><th></th></tr></thead><tbody>
        {rows.map((x:any)=><tr key={x.id}><td className="nameCell"><strong>{x.name}</strong><span>ID: {String(x.id).slice(0,12)}</span></td><td><span className="badge">{x.taxpayer_type}</span></td><td className="mono">{x.npwp||'—'}</td><td><span className={x.status==='active'?'badge ok':'badge warn'}>{x.status==='active'?'Aktif':'Perlu perhatian'}</span></td><td><Link className="btn secondary" href={`/taxpayers/${x.id}`}>Buka</Link></td></tr>)}
      </tbody></table>{rows.length===0&&<div className="empty">Tidak ada WP yang cocok.</div>}
    </div>
  </div></>
}
