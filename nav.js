(function(){
  var _B='https://pnewnan.github.io/dnd5e-artifacts/';
  var _N=_B+'nav.json';
  var _T={
    player:['rgba(30,95,95,0.15)','#4aafaf','rgba(30,95,95,0.3)'],
    gm:    ['rgba(122,31,31,0.15)','#c05050','rgba(122,31,31,0.3)'],
    asset: ['rgba(138,106,16,0.15)','#b89030','rgba(138,106,16,0.3)']
  };

  /* Inject panel styles once */
  var _style=document.createElement('style');
  _style.textContent=[
    '#aelNavPanel{position:fixed;top:0;right:0;width:300px;max-width:92vw;height:100vh;',
    'background:#1a1108;border-left:1px solid rgba(180,140,60,0.2);',
    'z-index:9999;transform:translateX(100%);transition:transform 0.28s ease;',
    'display:none;overflow-y:auto;padding:1rem;}',
    '.ael-acc-hdr{display:flex;justify-content:space-between;align-items:center;',
    'padding:0.5rem 0.4rem;cursor:pointer;border-bottom:1px solid rgba(180,140,60,0.1);',
    'margin-bottom:0;user-select:none;transition:background 0.15s;}',
    '.ael-acc-hdr:hover{background:rgba(242,232,200,0.04);}',
    '.ael-acc-title{font-family:"Cinzel",serif;font-size:0.56rem;letter-spacing:0.25em;',
    'text-transform:uppercase;color:rgba(180,140,60,0.55);}',
    '.ael-acc-chev{font-size:0.5rem;color:rgba(180,140,60,0.35);',
    'transition:transform 0.2s ease;line-height:1;}',
    '.ael-acc-hdr.open .ael-acc-chev{transform:rotate(180deg);}',
    '.ael-acc-body{overflow:hidden;max-height:0;transition:max-height 0.25s ease;}',
    '.ael-acc-body.open{max-height:1200px;}',
    '.ael-acc-entries{padding:0.35rem 0 0.4rem;display:flex;flex-direction:column;gap:0.2rem;}'
  ].join('');
  document.head.appendChild(_style);

  window.aelNavOpen=function(){
    var p=document.getElementById('aelNavPanel');
    p.style.display='block';
    requestAnimationFrame(function(){p.style.transform='translateX(0)';});
    if(!p.dataset.loaded){p.dataset.loaded='1';_load(p);}
  };

  window.aelNavClose=function(){
    var p=document.getElementById('aelNavPanel');
    p.style.transform='translateX(100%)';
    setTimeout(function(){p.style.display='none';},290);
  };

  function _load(p){
    p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;'
      +'margin-bottom:1rem;padding-bottom:0.8rem;border-bottom:1px solid rgba(180,140,60,0.25);">'
      +'<span style="font-family:\'Cinzel\',serif;font-size:0.6rem;letter-spacing:0.3em;'
      +'text-transform:uppercase;color:rgba(180,140,60,0.6);">All Pages</span>'
      +'<span onclick="aelNavClose()" style="cursor:pointer;color:rgba(242,232,200,0.5);'
      +'font-size:1.1rem;line-height:1;">&#x2715;</span>'
      +'</div>'
      +'<div id="aelNavContent" style="font-size:0.8rem;color:rgba(242,232,200,0.4);'
      +'font-style:italic;font-family:\'IM Fell English\',serif;">Loading…</div>';
    fetch(_N).then(function(r){return r.json();}).then(_render).catch(function(){
      document.getElementById('aelNavContent').textContent='Navigation unavailable.';
    });
  }

  function _render(data){
    var html='';
    data.sections.forEach(function(sec,i){
      var id='ael'+i;
      html+='<div style="margin-bottom:0.4rem;">'
        +'<div class="ael-acc-hdr open" id="'+id+'h" onclick="_aelToggle('+i+')">'
        +'<span class="ael-acc-title">'+sec.title+'</span>'
        +'<span class="ael-acc-chev">▲</span>'
        +'</div>'
        +'<div class="ael-acc-body open" id="'+id+'b">'
        +'<div class="ael-acc-entries">';
      sec.entries.forEach(function(e){
        var t=_T[e.type]||_T.player;
        var tgt=e.type==='asset'?' target="_blank"':'';
        html+='<a href="'+_B+e.href+'"'+tgt
          +' style="display:block;padding:0.42rem 0.5rem;border:1px solid rgba(180,140,60,0.1);'
          +'border-left:3px solid '+t[1]+';background:rgba(242,232,200,0.02);'
          +'text-decoration:none;transition:background 0.15s;"'
          +' onmouseover="this.style.background=\'rgba(242,232,200,0.06)\'"'
          +' onmouseout="this.style.background=\'rgba(242,232,200,0.02)\'">'
          +'<span style="font-family:\'Cinzel\',serif;font-size:0.48rem;letter-spacing:0.1em;'
          +'text-transform:uppercase;padding:0.05rem 0.25rem;border-radius:2px;'
          +'background:'+t[0]+';color:'+t[1]+';border:1px solid '+t[2]+';">'+e.type+'</span>'
          +'<span style="display:block;font-family:\'Cinzel\',serif;font-size:0.72rem;'
          +'font-weight:600;color:rgba(242,232,200,0.88);margin-top:0.18rem;">'+e.name+'</span>'
          +'<span style="display:block;font-family:\'IM Fell English\',serif;font-style:italic;'
          +'font-size:0.68rem;color:rgba(242,232,200,0.38);margin-top:0.06rem;line-height:1.3;">'
          +e.desc+'</span>'
          +'</a>';
      });
      html+='</div></div></div>';
    });
    document.getElementById('aelNavContent').innerHTML=html;
  }

  window._aelToggle=function(i){
    var h=document.getElementById('ael'+i+'h');
    var b=document.getElementById('ael'+i+'b');
    if(b.classList.contains('open')){
      b.classList.remove('open');h.classList.remove('open');
    }else{
      b.classList.add('open');h.classList.add('open');
    }
  };
})();
