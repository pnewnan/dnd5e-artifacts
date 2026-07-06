/* ═══════════════════════════════════════════════════════
   Aelenthor — Arc Page Renderer
   Fetches JSON from window.ARC_DATA_SRC, builds the page,
   wires up accordions, modals, and the nav panel.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Color maps ─────────────────────────────────────── */
  var ACCENT = {
    forest:   '#2a4a1e',
    blood:    '#7a1f1f',
    teal:     '#1e5f5f',
    gold:     '#8a6a10',
    slate:    '#2e3a4a',
    purple:   '#5b2d8e',
    'dc-low': '#2a5c1e',
    'dc-mid': '#7a5000',
    'dc-high':'#7a1f1f'
  };

  var DISC_BORDER = {
    forest:   '#2a4a1e',
    'dc-low': '#2a5c1e',
    'dc-mid': '#7a5000',
    'dc-high':'#7a1f1f',
    'dc-top': '#7a1f1f',
    teal:     '#1e5f5f',
    purple:   '#5b2d8e',
    gold:     '#8a6a10',
    neutral:  '#b89d5e'
  };
  var DISC_BG = {
    forest:   'rgba(42,74,30,0.07)',
    'dc-low': 'rgba(42,92,30,0.07)',
    'dc-mid': 'rgba(122,80,0,0.07)',
    'dc-high':'rgba(122,31,31,0.07)',
    'dc-top': 'rgba(122,31,31,0.09)',
    teal:     'rgba(30,95,95,0.07)',
    purple:   'rgba(91,45,142,0.07)',
    gold:     'rgba(138,106,16,0.07)',
    neutral:  'rgba(180,140,60,0.10)'
  };

  /* ── Helpers ─────────────────────────────────────────── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  // text fields allow inline HTML — used with innerHTML
  function txt(s) { return String(s || ''); }

  function el(tag, attrs, inner) {
    var a = '';
    if (attrs) {
      Object.keys(attrs).forEach(function(k) {
        if (attrs[k] !== undefined && attrs[k] !== null) {
          a += ' ' + k + '="' + String(attrs[k]).replace(/"/g,'&quot;') + '"';
        }
      });
    }
    return '<' + tag + a + '>' + (inner || '') + '</' + tag + '>';
  }

  /* ── Block renderer ──────────────────────────────────── */
  function renderBlocks(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(renderBlock).join('');
  }

  function renderBlock(b) {
    if (!b) return '';
    switch (b.type) {

      case 'two_col':
        return '<div class="two-col">'
          + '<div>' + renderBlocks(b.left)  + '</div>'
          + '<div>' + renderBlocks(b.right) + '</div>'
          + '</div>';

      case 'three_col':
        return '<div class="three-col">'
          + '<div>' + renderBlocks(b.col1) + '</div>'
          + '<div>' + renderBlocks(b.col2) + '</div>'
          + '<div>' + renderBlocks(b.col3) + '</div>'
          + '</div>';

      case 'block_wrap':
        return '<div class="block">' + renderBlocks(b.content) + '</div>';

      case 'heading':
        var lvl = b.level || 2;
        return '<h' + lvl + '>' + txt(b.text) + '</h' + lvl + '>';

      case 'section_head':
        return '<p class="section-head">' + txt(b.text) + '</p>';

      case 'paragraph':
        var style = b.style ? ' style="' + b.style + '"' : '';
        return '<p' + style + '>' + txt(b.text) + '</p>';

      case 'discovery': {
        var variant = b.variant || 'neutral';
        var border  = DISC_BORDER[variant] || DISC_BORDER.neutral;
        var bg      = DISC_BG[variant]     || DISC_BG.neutral;
        var inner   = '';
        if (b.name) inner += '<div class="discovery-name">' + txt(b.name) + '</div>';
        inner += renderBlocks(b.content);
        return '<div class="discovery" style="border-left-color:' + border + ';background:' + bg + '">'
          + inner + '</div>';
      }

      case 'annotation':
        return '<div class="annotation">' + txt(b.text) + '</div>';

      case 'forest_note':
        return '<div class="forest-note">' + txt(b.text) + '</div>';

      case 'gm_block': {
        var label = b.label ? '<div class="gm-block-label">' + txt(b.label) + '</div>' : '';
        return '<div class="gm-block">' + label + renderBlocks(b.content) + '</div>';
      }

      case 'narrative_block':
        return '<div class="narrative-block">' + renderBlocks(b.content) + '</div>';

      case 'list':
        var lis = (b.items || []).map(function(i) { return '<li>' + txt(i) + '</li>'; }).join('');
        return '<ul class="find-list">' + lis + '</ul>';

      case 'prose_list':
        var plis = (b.items || []).map(function(i) { return '<li>' + txt(i) + '</li>'; }).join('');
        return '<ul class="prose-list">' + plis + '</ul>';

      case 'outcome_list':
        var olis = (b.items || []).map(function(i) {
          return '<li class="outcome-item">' + txt(i) + '</li>';
        }).join('');
        return '<ul class="outcome-list">' + olis + '</ul>';

      case 'quote':
        return '<div class="quote">' + txt(b.text) + '</div>';

      case 'divider':
        return '<div class="divider"><span>✦</span></div>';

      case 'journal_entry':
        var cls = b.final ? ' final' : '';
        return '<div class="journal-entry' + cls + '">' + txt(b.text) + '</div>';

      case 'trail_chain': {
        var steps = (b.steps || []);
        var html  = '<div class="trail-chain">';
        steps.forEach(function(s, i) {
          var hasLine = i < steps.length - 1;
          html += '<div class="trail-step">'
            + '<div class="trail-step-left">'
              + '<div class="trail-num">' + s.num + '</div>'
              + (hasLine ? '<div class="trail-line"></div>' : '')
            + '</div>'
            + '<div class="trail-content">'
              + '<div class="trail-label">' + txt(s.label) + '</div>'
              + (s.detail  ? '<div class="trail-detail">'  + txt(s.detail)  + '</div>' : '')
              + (s.secret  ? '<div class="trail-secret">'  + txt(s.secret)  + '</div>' : '')
            + '</div>'
          + '</div>';
        });
        return html + '</div>';
      }

      case 'check_reveal': {
        var cr_body = '';
        if (b.timing) cr_body += '<div class="timing">' + txt(b.timing) + '</div>';
        cr_body += renderBlocks(b.content);
        return '<div class="check-reveal">'
          + '<div class="check-reveal-header">'
            + '<div class="check-num">' + (b.num || '') + '</div>'
            + '<div class="check-label">' + txt(b.label) + '</div>'
          + '</div>'
          + '<div class="check-body">' + cr_body + '</div>'
          + '</div>';
      }

      case 'hold_round':
        return '<div class="hold-round">'
          + '<div class="hold-round-label">' + txt(b.label) + '</div>'
          + (b.mechanic ? '<div class="hold-round-mechanic">' + txt(b.mechanic) + '</div>' : '')
          + (b.feel     ? '<div class="hold-round-feel">'     + txt(b.feel)     + '</div>' : '')
          + '</div>';

      case 'beat_list': {
        var beats = (b.beats || []);
        var bhtml = '<div class="beat-list">';
        beats.forEach(function(bt, i) {
          var dotCls = bt.dot_color ? ' c-' + bt.dot_color : '';
          var hasLine = i < beats.length - 1;
          bhtml += '<div class="beat-item">'
            + '<div class="beat-marker">'
              + '<div class="beat-dot' + dotCls + '"></div>'
              + (hasLine ? '<div class="beat-line"></div>' : '')
            + '</div>'
            + '<div class="beat-content">'
              + (bt.type_tag ? '<div class="beat-type">' + txt(bt.type_tag) + '</div>' : '')
              + '<div class="beat-label">' + txt(bt.label) + '</div>'
              + (bt.detail ? '<p>' + txt(bt.detail) + '</p>' : '')
            + '</div>'
          + '</div>';
        });
        return bhtml + '</div>';
      }

      case 'npc_grid': {
        var cards = (b.cards || []).map(function(c) {
          var ccls = c.color ? ' c-' + c.color : '';
          return '<div class="npc-card' + ccls + '">'
            + '<div class="npc-name">' + txt(c.name) + '</div>'
            + (c.role ? '<div class="npc-role">' + txt(c.role) + '</div>' : '')
            + (c.desc ? '<div class="npc-desc">' + txt(c.desc) + '</div>' : '')
            + (c.note ? '<div class="npc-note">' + txt(c.note) + '</div>' : '')
            + '</div>';
        }).join('');
        return '<div class="npc-grid">' + cards + '</div>';
      }

      case 'layer_stack': {
        var layers = (b.layers || []).map(function(l) {
          return '<div class="layer-box ' + (l.variant || '') + '">'
            + '<div class="layer-label">' + txt(l.label) + '</div>'
            + '<p>' + txt(l.content) + '</p>'
            + '</div>';
        }).join('');
        return '<div class="layer-stack">' + layers + '</div>';
      }

      case 'investigation_box':
        return '<div class="investigation-box">'
          + '<div class="inv-label">' + txt(b.label) + '</div>'
          + '<div class="inv-reveal">' + txt(b.reveal) + '</div>'
          + '</div>';

      case 'truth_block': {
        var partyCol = '<div class="truth-side party">'
          + '<div class="truth-label">' + txt((b.party && b.party.label) || 'Party Perspective') + '</div>'
          + renderBlocks(b.party && b.party.content)
          + '</div>';
        var realCol = '<div class="truth-side real">'
          + '<div class="truth-label">' + txt((b.real && b.real.label) || 'What Actually Happened') + '</div>'
          + renderBlocks(b.real && b.real.content)
          + '</div>';
        return '<div class="truth-block">' + partyCol + realCol + '</div>';
      }

      case 'rel_grid': {
        var rcards = (b.cards || []).map(function(c) {
          var rcls = c.color ? ' c-' + c.color : '';
          return '<div class="rel-card' + rcls + '">'
            + '<div class="rel-name">' + txt(c.name) + '</div>'
            + (c.title ? '<div class="rel-title">' + txt(c.title) + '</div>' : '')
            + '<div class="rel-body">' + txt(c.body) + '</div>'
            + '</div>';
        }).join('');
        return '<div class="rel-grid">' + rcards + '</div>';
      }

      case 'emotional_goal':
        return '<div class="emotional-goal">'
          + (b.label ? '<span class="eg-label">' + txt(b.label) + '</span>' : '')
          + (b.statement ? '<div class="eg-statement">&ldquo;' + txt(b.statement) + '&rdquo;</div>' : '')
          + (b.body ? '<p>' + txt(b.body) + '</p>' : '')
          + renderBlocks(b.content)
          + '</div>';

      case 'phase_strip': {
        var phases = (b.phases || []).map(function(ph) {
          return '<div class="phase-block ' + (ph.variant || '') + '">'
            + '<span class="phase-label">' + txt(ph.label) + '</span>'
            + (ph.title ? '<div class="phase-title">' + txt(ph.title) + '</div>' : '')
            + (ph.note  ? '<div class="phase-note">'  + txt(ph.note)  + '</div>' : '')
            + '</div>';
        }).join('');
        return '<div class="phase-strip">' + phases + '</div>';
      }

      case 'portrait_float': {
        var pcls = b.side === 'left' ? 'portrait-float-left' : 'portrait-float';
        var pwStyle = b.width ? ' style="max-width:' + txt(b.width) + '"' : '';
        return '<div class="' + pcls + '"' + pwStyle + '>'
          + '<img src="' + txt(b.src) + '" alt="' + esc(b.alt || '') + '">'
          + (b.caption ? '<div class="qr-label" style="margin-top:0.3rem;">' + txt(b.caption) + '</div>' : '')
          + '</div>';
      }

      case 'scene_image': {
        return '<div class="scene-image">'
          + '<img src="' + txt(b.src) + '" alt="' + esc(b.alt || '') + '">'
          + (b.caption ? '<div class="scene-caption">' + txt(b.caption) + '</div>' : '')
          + '</div>';
      }

      case 'link_row': {
        var llinks = (b.links || []).map(function(l) {
          return '<a href="' + txt(l.href) + '" class="' + (l.color || '') + '">' + txt(l.text) + '</a>';
        }).join('');
        return '<div class="link-row">' + llinks + '</div>';
      }

      default:
        // Unknown type — skip silently
        return '';
    }
  }

  /* ── Section renderer ────────────────────────────────── */
  function renderSection(sec, idx) {
    var accent = ACCENT[sec.color] || '#b89d5e';
    var isOpen = sec.open || idx === 0;
    return '<div class="accordion">'
      + '<div class="accordion-header' + (isOpen ? ' open' : '') + '" style="--accent:' + accent + '" onclick="arcToggle(this)">'
        + '<div>'
          + '<div class="accordion-title">' + txt(sec.title) + '</div>'
          + (sec.subtitle ? '<div class="accordion-subtitle">' + txt(sec.subtitle) + '</div>' : '')
        + '</div>'
        + '<span class="accordion-arrow">▼</span>'
      + '</div>'
      + '<div class="accordion-body' + (isOpen ? ' open' : '') + '">'
        + renderBlocks(sec.content)
      + '</div>'
    + '</div>';
  }

  /* ── Quick-ref bar ───────────────────────────────────── */
  function renderQuickRef(items) {
    if (!items || !items.length) return '';
    var cells = items.map(function(item) {
      var valCls = item.dead ? ' class="qr-value dead"' : ' class="qr-value"';
      return '<div class="qr-item">'
        + '<span class="qr-label">' + txt(item.label) + '</span>'
        + '<span' + valCls + '>' + txt(item.value) + '</span>'
        + '</div>';
    }).join('');
    return '<div class="quick-ref">' + cells + '</div>';
  }

  /* ── Page render ─────────────────────────────────────── */
  function renderPage(d) {
    var root = document.getElementById('arc-root');
    if (!root) return;

    var html = '';

    // Draft stamp
    if (d.draft) {
      html += '<div class="draft-stamp-overlay"><div class="draft-stamp">Draft</div></div>';
    }

    // Page wrapper
    html += '<div class="page">';

    // Act band
    if (d.meta && d.meta.act_band) {
      html += '<div class="act-band" style="background:' + (ACCENT[d.meta.act_band] || d.meta.act_band) + '"></div>';
    }

    // Title block
    if (d.meta) {
      html += '<div class="page-title">'
        + (d.meta.gm_label ? '<span class="gm-label">' + txt(d.meta.gm_label) + '</span>' : '')
        + '<h1>' + txt(d.meta.title || '') + '</h1>'
        + (d.meta.subtitle ? '<p class="subtitle">' + txt(d.meta.subtitle) + '</p>' : '')
        + (d.meta.level_badge ? '<span class="level-badge">' + txt(d.meta.level_badge) + '</span>' : '')
        + (d.meta.back_link ? '<br><a class="back-link" href="' + txt(d.meta.back_link.href) + '">'
            + '← ' + txt(d.meta.back_link.text) + '</a>' : '')
        + '</div>';
    }

    // Phase strip (before quick-ref if present)
    if (d.phase_strip) {
      html += renderBlock({ type: 'phase_strip', phases: d.phase_strip });
    }

    // Quick ref
    html += renderQuickRef(d.quick_ref);

    // Sections
    (d.sections || []).forEach(function(sec, i) {
      html += renderSection(sec, i);
    });

    // Emotional goal
    if (d.emotional_goal) {
      html += renderBlock(Object.assign({ type: 'emotional_goal' }, d.emotional_goal));
    }

    // Conclusion
    if (d.conclusion) {
      var clis = (d.conclusion.items || []).map(function(i) { return '<li>' + txt(i) + '</li>'; }).join('');
      html += '<div class="conclusion">'
        + '<h3>' + txt(d.conclusion.title || 'GM Summary') + '</h3>'
        + '<ul>' + clis + '</ul>'
        + '</div>';
    }

    // Arc nav
    if (d.arc_nav) {
      var prev = d.arc_nav.prev ? '<a href="' + txt(d.arc_nav.prev.href) + '">← ' + txt(d.arc_nav.prev.text) + '</a>' : '';
      var next = d.arc_nav.next ? '<a href="' + txt(d.arc_nav.next.href) + '">' + txt(d.arc_nav.next.text) + ' →</a>' : '';
      html += '<div class="arc-nav">' + prev + '<span class="spacer"></span>' + next + '</div>';
    }

    html += '</div>'; // .page

    root.innerHTML = html;

    // Set page title
    if (d.meta && d.meta.title) {
      document.title = d.meta.title + ' — Aelenthor';
    }
  }

  /* ── Accordion behavior ──────────────────────────────── */
  window.arcToggle = function (header) {
    header.classList.toggle('open');
    header.nextElementSibling.classList.toggle('open');
  };

  /* ── Modal behavior ──────────────────────────────────── */
  window.arcOpenModal = function (title, meta, bodyHtml) {
    var overlay = document.getElementById('arcModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'arcModalOverlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = '<div class="modal-card" id="arcModalCard">'
        + '<span class="modal-close" id="arcModalClose">✕</span>'
        + '<div class="modal-header"><div class="modal-title" id="arcModalTitle"></div>'
        + '<div class="modal-meta" id="arcModalMeta"></div></div>'
        + '<div class="modal-body" id="arcModalBody"></div>'
        + '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function() { window.arcCloseModal(); });
      overlay.querySelector('.modal-card').addEventListener('click', function(e) { e.stopPropagation(); });
      overlay.querySelector('.modal-close').addEventListener('click', function() { window.arcCloseModal(); });
    }
    overlay.querySelector('#arcModalTitle').textContent = title || '';
    overlay.querySelector('#arcModalMeta').textContent  = meta  || '';
    overlay.querySelector('#arcModalBody').innerHTML    = bodyHtml || '';
    overlay.style.display = 'flex';
    requestAnimationFrame(function() { requestAnimationFrame(function() { overlay.classList.add('active'); }); });
  };

  window.arcCloseModal = function () {
    var overlay = document.getElementById('arcModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(function() { overlay.style.display = 'none'; }, 260);
  };

  /* ── Nav panel integration ───────────────────────────── */
  function injectNavButton() {
    if (document.getElementById('aelNavPanel')) return; // already present
    var panel = document.createElement('div');
    panel.id = 'aelNavPanel';
    panel.style.cssText = 'display:none;position:fixed;inset:0 0 0 auto;z-index:1000;width:min(300px,90vw);background:rgba(8,6,3,0.97);border-left:1px solid rgba(180,140,60,0.3);overflow-y:auto;padding:1.5rem 1.2rem;transform:translateX(100%);transition:transform 0.28s cubic-bezier(0.22,1,0.36,1);';
    var btn = document.createElement('div');
    btn.id = 'aelNavBtn';
    btn.innerHTML = '&#9776; All Pages';
    btn.onclick = function() { if (typeof aelNavOpen === 'function') aelNavOpen(); };
    btn.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-index:1001;font-family:\'Cinzel\',serif;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;background:rgba(13,10,6,0.88);border:1px solid rgba(180,140,60,0.4);padding:0.45rem 0.9rem;color:rgba(242,232,200,0.7);cursor:pointer;user-select:none;';
    btn.onmouseover = function() { btn.style.color = 'rgba(242,232,200,1)'; };
    btn.onmouseout  = function() { btn.style.color = 'rgba(242,232,200,0.7)'; };
    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    var src = window.ARC_DATA_SRC;
    if (!src) {
      document.getElementById('arc-root').innerHTML =
        '<div style="padding:2rem;color:#7a1f1f;font-family:serif;">No ARC_DATA_SRC defined.</div>';
      return;
    }
    fetch(src)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        renderPage(data);
        injectNavButton();
        // Load nav.js after render so it can index the page
        if (!document.querySelector('script[src*="nav.js"]')) {
          var navBase = window.AEL_BASE || (window.location.hostname === 'pnewnan.github.io' ? '/dnd5e-artifacts' : (function(){
            var p = window.location.pathname.split('/').filter(Boolean); p.pop();
            return p.length ? p.map(function(){ return '..'; }).join('/') : '.';
          })()) + '/';
          var s = document.createElement('script');
          s.src = navBase + 'nav.js';
          document.body.appendChild(s);
        }
      })
      .catch(function(err) {
        document.getElementById('arc-root').innerHTML =
          '<div style="padding:2rem;color:#7a1f1f;font-family:serif;">Failed to load ' + src + ': ' + err.message + '</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
