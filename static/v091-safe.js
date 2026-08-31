/* Member WP v0.9.1 — penerjemah DOM aman, tanpa loop mutasi */
(function(){
  V091_EXACT.set('User','Pengguna');
  V091_EXACT.set('Sync','Sinkronisasi');
  V091_EXACT.set('Login','Masuk');
  V091_EXACT.set('Logout','Keluar');
  V091_EXACT.set('Upload','Unggah');
  V091_EXACT.set('Download','Unduh');
  V091_EXACT.set('Cloud','Awan');
  V091_EXACT.set('PIC','Penanggung Jawab');

  const previousSkip=v091ShouldSkip;
  const userDataSelector=[
    '.name',
    '.hero h2',
    '.timelineItem p',
    '.v051-member-name',
    '.v051-deadline-copy',
    '.v051-focus-copy',
    '.v05-focus-main',
    '.task>div>b',
    '.v06-sensitive-value',
    '.v06-secret-value',
    '.v06-vault-value'
  ].join(',');
  v091ShouldSkip=function(node){
    if(previousSkip(node))return true;
    return Boolean(node?.parentElement?.closest(userDataSelector));
  };

  v091TranslateNode=function(root=document.body){
    if(!root)return;
    const translateTextNode=node=>{
      if(v091ShouldSkip(node))return;
      const before=node.nodeValue,after=v091TranslateText(before);
      if(after!==before)node.nodeValue=after;
    };
    const translateAttrs=el=>{
      if(el.hasAttribute?.('placeholder')){const before=el.getAttribute('placeholder'),after=V091_PLACEHOLDERS.get(before)||v091TranslateText(before);if(after!==before)el.setAttribute('placeholder',after)}
      if(el.hasAttribute?.('title')){const before=el.getAttribute('title'),after=v091TranslateText(before);if(after!==before)el.setAttribute('title',after)}
      if(el.hasAttribute?.('aria-label')){const before=el.getAttribute('aria-label'),after=v091TranslateText(before);if(after!==before)el.setAttribute('aria-label',after)}
    };
    if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return}
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
    if(root.nodeType===Node.ELEMENT_NODE)translateAttrs(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes)translateTextNode(node);
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(translateAttrs);
  };

  setTimeout(()=>{
    const db=document.getElementById('v09DbButton');if(db)db.onclick=()=>v09OpenDatabase();
    v091TranslateNode(document.body);
  },320);
})();
