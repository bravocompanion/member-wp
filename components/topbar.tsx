import { Search, Bell, CircleUserRound } from 'lucide-react'

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="topbar">
    <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    <div className="topbarActions">
      <div className="quickSearch"><Search size={16}/><span>Cari WP / NPWP</span></div>
      <button className="iconBtn" aria-label="Notifikasi"><Bell size={18}/></button>
      <div className="avatar"><CircleUserRound size={24}/></div>
    </div>
  </header>
}
