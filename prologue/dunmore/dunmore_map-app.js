/**
 * Dunmore Town Map — Interactive Engine
 * ======================================
 * ENGINE ONLY — no campaign content lives here.
 * All town data (districts, locations, phases) is in dunmore_town-data.json.
 *
 * PHASE ORDERING:
 * Phases are compared by their index in town.phases array.
 * A location with unlockPhase:"explored" appears when the selected phase index
 * >= the index of "explored". Details accumulate: at "explored", all "initial"
 * AND "explored" descriptions are shown.
 *
 * DISTRICT OVERLAYS:
 * Each district has a "polygon" array of [x,y] pairs (0–100 percentage space).
 * These are rendered as translucent SVG polygons over the map image.
 *
 * EDITING GUIDE:
 * - Move a marker:        change x/y in the JSON
 * - Add a location:       add to locations[] in the JSON
 * - Add a district:       add to districts[] with a polygon in the JSON
 * - Add a phase:          add to town.phases[] and to each location's detailsByPhase
 * - Add a secret:         add to location.secrets[] with unlockPhase
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let data = null;
  let currentPhaseId = null;
  let currentMode = 'day';
  let selectedId = null;

  // ── Color map (CSS variable name → hex, for SVG which can't use CSS vars) ──
  const COLOR_MAP = {
    blood:    '#7a1f1f',
    teal:     '#1e5f5f',
    gold:     '#8a6a10',
    purple:   '#5b2d8e',
    slate:    '#2e3a4a',
    amber:    '#9a5e10',
    rose:     '#7a2050',
    indigo:   '#3a2888',
    olive:    '#566010',
    rust:     '#8a3818',
    stone:    '#4a3c2c',
    charcoal: '#383838',
    crimson:  '#9e2828',
    moss:     '#285a20',
    cerulean: '#1a406e',
    navy:     '#1c2858'
  };

  // ── Phase helpers ──────────────────────────────────────────────────────────

  function phaseIndex(phaseId) {
    if (!data) return -1;
    return data.town.phases.findIndex(p => p.id === phaseId);
  }

  function isVisible(location) {
    return phaseIndex(location.unlockPhase) <= phaseIndex(currentPhaseId);
  }

  /** Accumulates detail objects from all phases up to and including current. */
  function getAccumulatedDetails(location) {
    const idx = phaseIndex(currentPhaseId);
    return data.town.phases
      .filter((p, i) => i <= idx)
      .map(p => location.detailsByPhase[p.id])
      .filter(Boolean);
  }

  /** Returns the most recent visibleName for the current phase. */
  function getVisibleName(location) {
    const idx = phaseIndex(currentPhaseId);
    let name = location.name;
    for (let i = 0; i <= idx; i++) {
      const d = location.detailsByPhase[data.town.phases[i].id];
      if (d && d.visibleName) name = d.visibleName;
    }
    return name;
  }

  function districtColor(districtId) {
    const d = data.districts.find(d => d.id === districtId);
    return d ? `var(--${d.color})` : 'var(--faded)';
  }

  function districtHex(districtId) {
    const d = data.districts.find(d => d.id === districtId);
    return d ? (COLOR_MAP[d.color] || '#888') : '#888';
  }

  // ── District overlays (SVG) ────────────────────────────────────────────────

  /**
   * Renders translucent SVG polygon overlays for each district.
   * Polygons are defined in the JSON as [[x,y],...] percentage pairs.
   * SVG uses viewBox="0 0 100 100" so coordinates map directly to percentages.
   */
  function renderDistrictOverlays() {
    const mapArea = document.querySelector('.map-area');
    if (!mapArea) return;

    // Remove any existing overlay
    const existing = document.getElementById('district-svg');
    if (existing) existing.remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'district-svg';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'z-index:2',
      'pointer-events:none'
    ].join(';');

    data.districts.forEach(district => {
      if (!district.polygon || district.polygon.length < 3) return;

      const hex = COLOR_MAP[district.color] || '#888888';
      const points = district.polygon.map(p => `${p[0]},${p[1]}`).join(' ');

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', points);
      poly.setAttribute('fill', hex);
      poly.setAttribute('fill-opacity', '0.14');
      poly.setAttribute('stroke', hex);
      poly.setAttribute('stroke-width', '0.35');
      poly.setAttribute('stroke-opacity', '0.45');
      poly.style.pointerEvents = 'all';
      poly.style.cursor = 'default';
      poly.dataset.districtId = district.id;

      // Hover: slightly more opaque, show district name tooltip
      poly.addEventListener('mouseenter', (e) => {
        poly.setAttribute('fill-opacity', '0.24');
        showDistrictTip(district.name, e);
      });
      poly.addEventListener('mousemove', (e) => showDistrictTip(district.name, e));
      poly.addEventListener('mouseleave', () => {
        poly.setAttribute('fill-opacity', '0.14');
        hideDistrictTip();
      });

      svg.appendChild(poly);
    });

    // Insert behind markers but above the map image
    const markers = document.getElementById('map-markers');
    mapArea.insertBefore(svg, markers);
  }

  function showDistrictTip(name, e) {
    let tip = document.getElementById('district-tip');
    if (!tip) return;
    const rect = document.querySelector('.map-area').getBoundingClientRect();
    tip.textContent = name;
    tip.style.left = (e.clientX - rect.left + 10) + 'px';
    tip.style.top  = (e.clientY - rect.top  - 28) + 'px';
    tip.style.display = 'block';
  }

  function hideDistrictTip() {
    const tip = document.getElementById('district-tip');
    if (tip) tip.style.display = 'none';
  }

  // ── Marker rendering ───────────────────────────────────────────────────────

  function renderMarkers() {
    const container = document.getElementById('map-markers');
    if (!container) return;
    container.innerHTML = '';

    data.locations.filter(isVisible).forEach(loc => {
      const marker = document.createElement('div');
      marker.className = 'map-marker' + (loc.id === selectedId ? ' selected' : '');
      marker.dataset.id = loc.id;
      marker.style.left = loc.x + '%';
      marker.style.top  = loc.y + '%';
      marker.style.background = loc.id === selectedId
        ? 'var(--gold)'
        : districtColor(loc.districtId);

      marker.textContent = loc.number;

      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      tooltip.textContent = getVisibleName(loc);
      marker.appendChild(tooltip);

      marker.addEventListener('click', () => selectLocation(loc.id));
      container.appendChild(marker);
    });
  }

  // ── Legend rendering ───────────────────────────────────────────────────────

  function renderLegend() {
    const container = document.getElementById('legend-list');
    if (!container) return;
    container.innerHTML = '';

    const visible = data.locations.filter(isVisible);
    if (visible.length === 0) {
      container.innerHTML = '<p class="legend-empty">No locations known at this stage.</p>';
      return;
    }

    data.districts.forEach(district => {
      const locs = visible.filter(l => l.districtId === district.id);
      if (locs.length === 0) return;

      const group = document.createElement('div');
      group.className = 'legend-group';

      const header = document.createElement('div');
      header.className = 'legend-district';
      header.style.color = `var(--${district.color})`;
      header.textContent = district.name;
      group.appendChild(header);

      locs.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'legend-item' + (loc.id === selectedId ? ' selected' : '');
        item.dataset.id = loc.id;
        item.innerHTML = `
          <span class="legend-num" style="background:${districtColor(loc.districtId)}">${loc.number}</span>
          <span class="legend-name">${getVisibleName(loc)}</span>
          <span class="legend-type">${loc.type}</span>
        `;
        item.addEventListener('click', () => selectLocation(loc.id));
        group.appendChild(item);
      });

      container.appendChild(group);
    });
  }

  // ── Detail panel ───────────────────────────────────────────────────────────

  function renderDetail(locationId) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;

    if (!locationId) {
      panel.innerHTML = '<p class="detail-empty">Click a marker or legend entry to view details.</p>';
      return;
    }

    const loc = data.locations.find(l => l.id === locationId);
    if (!loc) return;

    const district  = data.districts.find(d => d.id === loc.districtId);
    const details   = getAccumulatedDetails(loc);
    const name      = getVisibleName(loc);
    const curIdx    = phaseIndex(currentPhaseId);
    const secrets   = (loc.secrets || []).filter(s => phaseIndex(s.unlockPhase) <= curIdx);
    const descs     = details.map(d => d.description).filter(Boolean);
    const color     = districtColor(loc.districtId);

    panel.innerHTML = `
      <div class="detail-header">
        <div class="detail-name">${name}</div>
        <div class="detail-meta">
          <span class="detail-badge" style="border-color:${color};color:${color}">${loc.type}</span>
          <span class="detail-district">${district ? district.name : ''}</span>
        </div>
      </div>
      <div class="detail-body">
        ${descs.map((d, i) => `<p${i > 0 ? ' class="detail-later"' : ''}>${d}</p>`).join('')}
        ${loc.notableNpcs && loc.notableNpcs.length ? `
          <div class="detail-npcs">
            <span class="detail-label">Notable:</span> ${loc.notableNpcs.join(', ')}
          </div>` : ''}
        ${secrets.length ? `
          <div class="detail-secrets">
            <div class="detail-label secret-label">▸ Secret${secrets.length > 1 ? 's' : ''}</div>
            ${secrets.map(s => `<p class="secret-text">${s.text}</p>`).join('')}
          </div>` : ''}
      </div>`;
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function selectLocation(locationId) {
    selectedId = locationId === selectedId ? null : locationId;
    renderMarkers();
    renderLegend();
    renderDetail(selectedId);
    if (selectedId) {
      const el = document.querySelector(`.legend-item[data-id="${selectedId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ── Phase selector ─────────────────────────────────────────────────────────

  function buildPhaseSelector() {
    const select = document.getElementById('phase-select');
    if (!select) return;
    select.innerHTML = '';
    data.town.phases.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      select.appendChild(opt);
    });
    select.value = currentPhaseId;
    select.addEventListener('change', () => {
      currentPhaseId = select.value;
      if (selectedId) {
        const loc = data.locations.find(l => l.id === selectedId);
        if (!loc || !isVisible(loc)) selectedId = null;
      }
      renderAll();
    });
  }

  // ── Day/Night toggle ───────────────────────────────────────────────────────

  function setMapMode(mode) {
    currentMode = mode;
    const img = document.getElementById('map-image');
    if (img) img.src = mode === 'day' ? data.town.maps.day : data.town.maps.night;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function buildModeToggle() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMapMode(btn.dataset.mode));
    });
    setMapMode('day');
  }

  // ── Image error fallback ───────────────────────────────────────────────────

  function handleImageError() {
    const img = document.getElementById('map-image');
    const placeholder = document.getElementById('map-placeholder');
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  // ── Full re-render ─────────────────────────────────────────────────────────

  function renderAll() {
    renderDistrictOverlays();
    renderMarkers();
    renderLegend();
    renderDetail(selectedId);
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    fetch('dunmore_town-data.json')
      .then(r => {
        if (!r.ok) throw new Error('Could not load town data: ' + r.status);
        return r.json();
      })
      .then(json => {
        data = json;
        currentPhaseId = data.town.phases[0].id;

        const titleEl = document.getElementById('town-name');
        if (titleEl) titleEl.textContent = data.town.name;

        buildPhaseSelector();
        buildModeToggle();

        const img = document.getElementById('map-image');
        if (img) img.addEventListener('error', handleImageError);

        renderAll();
      })
      .catch(err => {
        console.error(err);
        const panel = document.getElementById('detail-panel');
        if (panel) panel.innerHTML = `<p class="detail-empty" style="color:var(--blood)">
          Error loading map data. Make sure dunmore_town-data.json is in the same folder
          and you're serving via a local server (not file://).
        </p>`;
      });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
