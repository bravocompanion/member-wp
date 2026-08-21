import { Sidebar } from '@/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="appShell"><Sidebar/><main className="mainShell">{children}</main></div>
}
