/* Member WP v0.6 safety polish */
v06SensitiveHtml=function(data){
  const rows=Object.entries(data).filter(([k,v])=>!['sourceSheet','sourceRow'].includes(k)&&v!==null&&v!==undefined&&String(v).trim()!=='');
  return `<div class="v06-secret-list">${rows.map(([k,v])=>`<div><span>${esc(v06FieldLabel(k))}</span><code>${esc(v)}</code><button class="linkbtn" onclick="v06Copy(this.previousElementSibling.textContent)">Copy</button></div>`).join('')||'<div class="empty compact">Tidak ada field sensitif tersimpan.</div>'}</div>`;
};
const v06SafeDataView=dataView;
dataView=function(){return v06SafeDataView().replace('Jangan simpan password / EFIN / passphrase / key','Credential Excel disimpan terenkripsi; master passphrase tidak pernah disimpan').replace('Static app bukan credential vault.','Vault lokal memakai AES-GCM untuk credential import.')};
Object.assign(window,{dataView,v06Copy});
