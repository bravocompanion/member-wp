import { Topbar } from '@/components/topbar'
import { getReports } from '@/lib/data'
export const metadata={title:'Pelaporan'}
export default async function ReportsPage(){const rows:any[]=await getReports();return <><Topbar title="Pelaporan" subtitle="Checklist kewajiban berdasarkan masa dan tahun"/><div className="content"><div className="tableCard"><table className="dataTable"><thead><tr><th>Wajib Pajak</th><th>Jenis</th><th>Masa</th><th>Status</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><strong>{x.taxpayer_name}</strong></td><td>{x.tax_type}</td><td>{x.period}</td><td><span className="badge">{x.status}</span></td></tr>)}</tbody></table></div></div></>}
