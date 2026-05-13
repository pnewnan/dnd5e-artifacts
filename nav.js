(function(){
  var _B='https://pnewnan.github.io/dnd5e-artifacts/';
  var _N=_B+'nav.json';
  var _T={
    player:['rgba(30,95,95,0.15)','#4aafaf','rgba(30,95,95,0.3)'],
    gm:    ['rgba(122,31,31,0.15)','#c05050','rgba(122,31,31,0.3)'],
    asset: ['rgba(138,106,16,0.15)','#b89030','rgba(138,106,16,0.3)']
  };

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
    p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.8rem;border-bottom:1px solid rgba(180,140,60,0.25);">'
      +'<span style="font-family:\'Cinzel\',serif;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:rgba(180,140,60,0.6);">All Pages</span>'
      +'<span onclick="aelNavClose()" style="cursor:pointer;color:rgba(242,232,200,0.5);font-size:1.1rem;line-height:1;">&#x2715;</span>'
      +'</div><div id="aelNavContent" style="font-size:0.8rem;color:rgba(242,232,200,0.4);font-style:italic;font-family:\'IM Fell English\',serif;">Loading…</div>';
    fetch(_N).then(function(r){return r.json();}).then(_render).catch(function(){
      document.getElementById('aelNavContent').textContent='Navigation unavailable.';
    });
  }

  function _render(data){
    var html='';
    data.sections.forEach(function(sec,i){
      if(i>0)html+='<div style="height:1px;background:rgba(180,140,60,0.15);margin:0.7rem 0;"></div>';
      html+='<div style="font-family:\'Cinzel\',serif;font-size:0.58rem;letter-spacing:0.25em;text-transform:uppercase;color:rgba(180,140,60,0.5);margin-bottom:0.45rem;">'+sec.title+'</div>';
      sec.entries.forEach(function(e){
        var t=_T[e.type]||_T.player;
        var tgt=e.type==='asset'?' target="_blank"':'';
        html+='<a href="'+_B+e.href+'"'+tgt
          +' style="display:block;padding:0.45rem 0.55rem;margin-bottom:0.25rem;border:1px solid rgba(180,140,60,0.12);border-left:3px solid '+t[1]+';background:rgba(242,232,200,0.02);text-decoration:none;transition:background 0.15s;"'
          +' onmouseover="this.style.background=\'rgba(242,232,200,0.06)\'"'
          +' onmouseout="this.style.background=\'rgba(242,232,200,0.02)\'">'
          +'<span style="font-family:\'Cinzel\',serif;font-size:0.5rem;letter-spacing:0.1em;text-transform:uppercase;padding:0.06rem 0.28rem;border-radius:2px;background:'+t[0]+';color:'+t[1]+';border:1px solid '+t[2]+';">'+e.type+'</span>'
          +'<span style="display:block;font-family:\'Cinzel\',serif;font-size:0.74rem;font-weight:600;color:rgba(242,232,200,0.88);margin-top:0.2rem;">'+e.name+'</span>'
          +'<span style="display:block;font-family:\'IM Fell English\',serif;font-style:italic;font-size:0.7rem;color:rgba(242,232,200,0.38);margin-top:0.08rem;line-height:1.3;">'+e.desc+'</span>'
          +'</a>';
      });
    });
    document.getElementById('aelNavContent').innerHTML=html;
  }
})();
