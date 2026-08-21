'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarCheck2, CircleAlert, FolderOpen,
  KeyRound, Upload, ShieldCheck, ClipboardCheck, StickyNote, Siren
} from 'lucide-react'

const items = [
  ['/dashboard','Dashboard',LayoutDashboard],
  ['/taxpayers','Wajib Pajak',Users],
  ['/compliance','Kewajiban',ClipboardCheck],
  ['/attention','Attention',Siren],
  ['/notes','Catatan',StickyNote],
  ['/reports','Pelaporan Lama',CalendarCheck2],
  ['/issues','Kendala',CircleAlert],
  ['/documents','Dokumen',FolderOpen],
  ['/vault','Credential Vault',KeyRound],
  ['/import','Import Data',Upload],
] as const

export function Sidebar() {
  const pathname = usePathname()
  return <aside className="sidebar">
    <div className="brand"><div className="brandMark">M</div><div><strong>Member WP</strong><span>Compliance Control</span></div></div>
    <nav>{items.map(([href,label,Icon]) => {
      const active = pathname === href || pathname.startsWith(href + '/')
      return <Link className={active ? 'navItem active' : 'navItem'} href={href} key={href}><Icon size={18}/><span>{label}</span></Link>
    })}</nav>
    <div className="sidebarFoot"><ShieldCheck size={18}/><div><strong>Private workspace</strong><span>v0.2 · RLS + audit trail</span></div></div>
  </aside>
}
