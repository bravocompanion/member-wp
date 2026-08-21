import { Topbar } from '@/components/topbar'
import { getIssues } from '@/lib/data'
export const metadata={title:'Kendala'}
export default async function IssuesPage(){const rows:any[]=await getIssues();return <><Topbar title="Kendala" subtitle="Daftar pekerjaan dan hambatan per WP"/><div className="content"><div className="tableCard"><table className="dataTable"><thead><tr><th>Wajib Pajak</th><th>Kendala</th><th>Dokumen diperlukan</th><th>Status</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><strong>{x.taxpayer_name}</strong></td><td>{x.title}</td><td>{x.required||'—'}</td><td><span className="badge warn">{x.status}</span></td></tr>)}</tbody></table></div></div></>}
