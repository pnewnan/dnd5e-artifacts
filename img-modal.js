/* ── Aelenthor Image Modal — shared lightbox ── */
(function(){

  /* ── Inject CSS ── */
  var s = document.createElement('style');
  s.textContent = [
    '#aelImgModal{',
      'display:none;position:fixed;inset:0;z-index:5000;',
      'background:rgba(4,2,1,0.93);',
      'align-items:center;justify-content:center;flex-direction:column;',
      'gap:0.9rem;padding:1.5rem;cursor:zoom-out;',
      'opacity:0;transition:opacity 0.22s ease;',
    '}',
    '#aelImgModal.open{display:flex;}',
    '#aelImgModal.fade{opacity:1;}',
    '#aelImgModal img{',
      'max-width:min(90vw,1100px);max-height:82vh;',
      'object-fit:contain;',
      'border:1px solid rgba(180,140,60,0.35);',
      'box-shadow:0 0 0 4px rgba(13,10,6,0.9),0 0 0 6px rgba(180,140,60,0.25),0 20px 60px rgba(0,0,0,0.8);',
      'transform:scale(0.94);transition:transform 0.26s cubic-bezier(0.22,1,0.36,1);',
      'cursor:default;',
    '}',
    '#aelImgModal.fade img{transform:scale(1);}',
    '#aelImgCaption{',
      'font-family:"Cinzel",serif;font-size:0.62rem;letter-spacing:0.2em;text-transform:uppercase;',
      'color:rgba(180,140,60,0.6);text-align:center;max-width:640px;line-height:1.5;',
      'opacity:0;transition:opacity 0.3s ease 0.1s;',
    '}',
    '#aelImgModal.fade #aelImgCaption{opacity:1;}',
    '#aelImgClose{',
      'position:fixed;top:1rem;right:1.2rem;',
      'font-family:"Cinzel",serif;font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;',
      'color:rgba(180,140,60,0.45);cursor:pointer;transition:color 0.15s;',
      'user-select:none;',
    '}',
    '#aelImgClose:hover{color:rgba(180,140,60,0.9);}',
    'img.zoomable{cursor:zoom-in;transition:opacity 0.15s;}',
    'img.zoomable:hover{opacity:0.88;}'
  ].join('');
  document.head.appendChild(s);

  /* ── Inject HTML ── */
  var overlay = document.createElement('div');
  overlay.id = 'aelImgModal';
  overlay.innerHTML =
    '<span id="aelImgClose">✕ close</span>' +
    '<img id="aelImgEl" src="" alt="">' +
    '<div id="aelImgCaption"></div>';
  document.body.appendChild(overlay);

  /* ── Open / close ── */
  window.openImgModal = function(src, caption) {
    var img  = document.getElementById('aelImgEl');
    var cap  = document.getElementById('aelImgCaption');
    img.src  = src;
    img.alt  = caption || '';
    cap.textContent = caption || '';
    overlay.classList.add('open');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ overlay.classList.add('fade'); });
    });
  };

  window.closeImgModal = function() {
    overlay.classList.remove('fade');
    setTimeout(function(){ overlay.classList.remove('open'); }, 230);
  };

  /* ── Close triggers ── */
  overlay.addEventListener('click', function(){ window.closeImgModal(); });
  document.getElementById('aelImgEl').addEventListener('click', function(e){ e.stopPropagation(); });
  document.getElementById('aelImgClose').addEventListener('click', function(e){
    e.stopPropagation();
    window.closeImgModal();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') window.closeImgModal();
  });

  /* ── Auto-wire img.zoomable on load ── */
  function wireZoomable() {
    document.querySelectorAll('img.zoomable').forEach(function(img){
      if (img.dataset.modalWired) return;
      img.dataset.modalWired = '1';
      img.addEventListener('click', function(){
        var caption = img.dataset.caption || img.getAttribute('alt') || '';
        window.openImgModal(img.src, caption);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireZoomable);
  } else {
    wireZoomable();
    /* Also re-run after short delay for dynamically rendered images */
    setTimeout(wireZoomable, 600);
  }

})();
