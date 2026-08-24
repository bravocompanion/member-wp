const url='https://apnbksfkenonbsvqbuok.supabase.co/functions/v1/member-wp-import-once?token=MdvHnNEUEx7igU7XOxR4MDlx8X7Ip6Gc9HZQqQbOZhM'
const r=await fetch(url)
const text=await r.text()
console.log(text)
if(!r.ok) throw new Error(`Import HTTP ${r.status}`)
const x=JSON.parse(text)
if(!x.ok||x.taxpayers!==233||x.credentials!==233||x.issues!==36||x.documents!==40||x.history!==73||x.references!==21||x.duplicateNpwp!==4) throw new Error('Member WP import counts do not match expected workbook totals')
console.log('Member WP one-time import verified.')
