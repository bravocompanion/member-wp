const attentionIds = new Set([23,25,26,34,35,36,37,39,40,41,49,50,52,53,55,57,58,60,62,65])

export const demoTaxpayers = Array.from({length:233},(_,i)=>{
  const id=i+1
  const badan=id<=72
  return {
    id:`demo-${id}`,
    name:badan?`PT. DEMO BADAN ${String(id).padStart(3,'0')}`:`WP OP DEMO ${String(id-72).padStart(3,'0')}`,
    taxpayer_type:badan?'BADAN':'OP',
    npwp:'000••••••••0000',
    status:attentionIds.has(id)?'needs_attention':'active',
  }
})

const name=(id:number)=>demoTaxpayers[id-1].name

export const demoStats = { total:233, badan:72, op:161, openIssues:4, reportingRows:4, duplicates:4 }

export const demoIssues = [
  {id:'i1',taxpayer_name:name(23),title:'Akses sistem perlu diverifikasi',status:'open',required:'KTP, KK, Foto, Email'},
  {id:'i2',taxpayer_name:name(25),title:'Dokumen direktur belum lengkap',status:'open',required:'KTP, KK, Foto'},
  {id:'i3',taxpayer_name:name(41),title:'Perubahan email kontak',status:'open',required:'KTP, KK'},
  {id:'i4',taxpayer_name:name(34),title:'Akses perusahaan perlu dicek',status:'open',required:'KTP, KK, Foto, Email, Akta, AHU'},
]

export const demoReports = [
  {id:'r1',taxpayer_name:name(73),period:'April 2018',tax_type:'E-Filing',status:'not_started'},
  {id:'r2',taxpayer_name:name(74),period:'Mei 2018',tax_type:'E-Filing',status:'not_started'},
  {id:'r3',taxpayer_name:name(75),period:'Juni 2018',tax_type:'E-Filing',status:'not_started'},
  {id:'r4',taxpayer_name:name(76),period:'Juli 2018',tax_type:'E-Filing',status:'not_started'},
]

export const demoVault = [
  {id:'v1',taxpayer_name:name(3),kind:'coretax_key',label:'Coretax Key',updated_at:'Demo'},
  {id:'v2',taxpayer_name:name(3),kind:'efin',label:'EFIN',updated_at:'Demo'},
  {id:'v3',taxpayer_name:name(77),kind:'coretax_passphrase',label:'Coretax Passphrase',updated_at:'Demo'},
]

export const demoComplianceObligations = [
  {id:'o1',taxpayer_id:'demo-1',code:'PPH21',label:'PPh 21',cadence:'monthly',active:true},
  {id:'o2',taxpayer_id:'demo-1',code:'PPH23',label:'PPh 23',cadence:'monthly',active:true},
  {id:'o3',taxpayer_id:'demo-1',code:'PPN',label:'PPN',cadence:'monthly',active:true},
  {id:'o4',taxpayer_id:'demo-1',code:'SPT_TAHUNAN_BADAN',label:'SPT Tahunan Badan',cadence:'annual',active:true},
  {id:'o5',taxpayer_id:'demo-2',code:'PPH25',label:'PPh 25',cadence:'monthly',active:true},
  {id:'o6',taxpayer_id:'demo-2',code:'LAPORAN_KEUANGAN',label:'Laporan Keuangan Tahunan',cadence:'annual',active:true},
  {id:'o7',taxpayer_id:'demo-73',code:'PPH25',label:'PPh 25',cadence:'monthly',active:true},
  {id:'o8',taxpayer_id:'demo-73',code:'SPT_TAHUNAN_OP',label:'SPT Tahunan OP',cadence:'annual',active:true},
]

export const demoComplianceTasks = [
  {id:'ct1',taxpayer_id:'demo-1',taxpayer_name:name(1),label:'PPh 21',cadence:'monthly',period:'Agustus 2026',status:'completed',due_date:'2026-08-20'},
  {id:'ct2',taxpayer_id:'demo-1',taxpayer_name:name(1),label:'PPh 23',cadence:'monthly',period:'Agustus 2026',status:'waiting_review',due_date:'2026-08-20'},
  {id:'ct3',taxpayer_id:'demo-1',taxpayer_name:name(1),label:'PPN',cadence:'monthly',period:'Agustus 2026',status:'waiting_documents',due_date:'2026-08-31'},
  {id:'ct4',taxpayer_id:'demo-2',taxpayer_name:name(2),label:'PPh 25',cadence:'monthly',period:'Agustus 2026',status:'in_progress',due_date:'2026-08-20'},
  {id:'ct5',taxpayer_id:'demo-73',taxpayer_name:name(73),label:'PPh 25',cadence:'monthly',period:'Agustus 2026',status:'not_started',due_date:'2026-08-20'},
  {id:'ct6',taxpayer_id:'demo-1',taxpayer_name:name(1),label:'SPT Tahunan Badan',cadence:'annual',period:'2026',status:'not_started',due_date:null},
  {id:'ct7',taxpayer_id:'demo-2',taxpayer_name:name(2),label:'Laporan Keuangan Tahunan',cadence:'annual',period:'2026',status:'in_progress',due_date:null},
  {id:'ct8',taxpayer_id:'demo-73',taxpayer_name:name(73),label:'SPT Tahunan OP',cadence:'annual',period:'2026',status:'not_started',due_date:null},
]

export const demoNotes = [
  {id:'n1',taxpayer_id:'demo-1',taxpayer_name:name(1),category:'important',note_text:'Jangan finalisasi pelaporan sebelum approval reviewer.',pinned:true,created_at:'2026-08-21T09:20:00+08:00',author:'Admin'},
  {id:'n2',taxpayer_id:'demo-3',taxpayer_name:name(3),category:'coretax',note_text:'Akses sistem perlu dicek kembali sebelum pekerjaan masa berikutnya.',pinned:false,created_at:'2026-08-21T08:45:00+08:00',author:'Admin'},
  {id:'n3',taxpayer_id:'demo-73',taxpayer_name:name(73),category:'client',note_text:'Menunggu konfirmasi data dari wajib pajak.',pinned:false,created_at:'2026-08-20T11:40:00+08:00',author:'Staff'},
]

export const demoAttention = [
  {id:'a1',taxpayer_id:'demo-3',taxpayer_name:name(3),title:'Akses sistem terblokir',description:'Ada kendala yang harus diselesaikan sebelum task dilanjutkan.',priority:'critical',status:'open',source_type:'compliance',due_date:'2026-08-31'},
  {id:'a2',taxpayer_id:'demo-73',taxpayer_name:name(73),title:'PPh 25 belum dimulai',description:'Task masa berjalan masih belum dikerjakan.',priority:'high',status:'open',source_type:'compliance',due_date:'2026-08-20'},
  {id:'a3',taxpayer_id:'demo-1',taxpayer_name:name(1),title:'PPh 23 menunggu review',description:'Pekerjaan membutuhkan reviewer.',priority:'medium',status:'in_progress',source_type:'compliance',due_date:'2026-08-20'},
]

export const demoComplianceStats = {
  configuredTaxpayers:3,totalTaxpayers:233,monthlyTasks:5,monthlyCompleted:1,annualTasks:3,openAttention:3,pinnedNotes:1,
}
