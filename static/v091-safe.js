/* Member WP v0.9.1 — penerjemah DOM aman, tanpa loop mutasi */
(function(){
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
})();
