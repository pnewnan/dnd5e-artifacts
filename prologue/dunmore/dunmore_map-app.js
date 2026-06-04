/**
 * Dunmore Town Map — Interactive Engine
 * ======================================
 * This file is the ENGINE. It contains no campaign content.
 * All town data lives in dunmore_town-data.json.
 *
 * PHASE ORDERING SYSTEM:
 * Phases are compared by their index in town.phases array (not by string value).
 * A location with unlockPhase: "explored" appears when the selected phase has
 * an index >= the index of "explored" in the phases array.
 * Details accumulate: at phase "explored", all details from "initial" AND "explored"
 * are shown. At "fully_explored", all three phase descriptions are shown.
 *
 * HOW TO USE:
 * - To add a location: edit dunmore_town-data.json → locations array
 * - To move a marker: change x/y values in the JSON (x=0 left, x=100 right, y=0 top, y=100 bottom)
 * - To add a phase: add to town.phases in JSON, then add matching keys to each location's detailsByPhase
 * - To add a secret: add to a location's secrets array with the appropriate unlockPhase
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let data = null;
  let currentPhaseId = null;
  let currentMode = 'day';
  let selectedId = null;

  // ── Phase helpers ──────────────────────────────────────────────────────────

  /** Returns the array index of a phase by id. */
  function phaseIndex(phaseId) {
    if (!data) return -1;
    return data.town.phases.findIndex(p => p.id === phaseId);
  }

  /** Returns true if a location should be visible at the current phase. */
  function isVisible(location) {
    return phaseIndex(location.unlockPhase) <= phaseIndex(currentPhaseId);
  }

  /**
   * Returns an array of detail objects for all phases up to and including
   * the current phase. Each object has { visibleName?, description }.
   */
  function getAccumulatedDetails(location) {
    const currentIdx = phaseIndex(currentPhaseId);
    return data.town.phases
      .filter((p, i) => i <= currentIdx)
      .map(p => location.detailsByPhase[p.id])
      .filter(Boolean);
  }

  /**
   * Returns the best visible name for a location at the current phase.
   * Uses the most recent detailsByPhase entry that has a visibleName.
   */
  function getVisibleName(location) {
    const currentIdx = phaseIndex(currentPhaseId);
    let name = location.name;
    for (let i = 0; i <= currentIdx; i++) {
      const phaseData = location.detailsByPhase[data.town.phases[i].id];
      if (phaseData && phaseData.visibleName) name = phaseData.visibleName;
    }
    return name;
  }

  /** Returns the CSS variable name for a district's color. */
  function districtColor(districtId) {
    const district = data.districts.find(d => d.id === districtId);
    return district ? `var(--${district.color})` : 'var(--faded)';
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  /** Clears and re-renders all map markers. */
  function renderMarkers() {
    const container = document.getElementById('map-markers');
    if (!container) return;
    container.innerHTML = '';

    const visible = data.locations.filter(isVisible);

    visible.forEach(loc => {
      const marker = document.createElement('div');
      marker.className = 'map-marker' + (loc.id === selectedId ? ' selected' : '');
      marker.dataset.id = loc.id;
      marker.style.left = loc.x + '%';
      marker.style.top = loc.y + '%';
      marker.style.background = loc.id === selectedId ? 'var(--gold)' : districtColor(loc.districtId);

      marker.textContent = loc.number;

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      tooltip.textContent = getVisibleName(loc);
      marker.appendChild(tooltip);

      marker.addEventListener('click', () => selectLocation(loc.id));
      container.appendChild(marker);
    });
  }

  /** Clears and re-renders the sidebar legend, grouped by district. */
  function renderLegend() {
    const container = document.getElementById('legend-list');
    if (!container) return;
    container.innerHTML = '';

    const visible = data.locations.filter(isVisible);
    if (visible.length === 0) {
      container.innerHTML = '<p class="legend-empty">No locations known at this stage.</p>';
      return;
    }

    // Group by district, preserving district array order
    data.districts.forEach(district => {
      const districtLocs = visible.filter(l => l.districtId === district.id);
      if (districtLocs.length === 0) return;

      const group = document.createElement('div');
      group.className = 'legend-group';

      const header = document.createElement('div');
      header.className = 'legend-district';
      header.style.color = `var(--${district.color})`;
      header.textContent = district.name;
      group.appendChild(header);

      districtLocs.forEach(loc => {
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

  /** Renders the detail panel for the selected location. */
  function renderDetail(locationId) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;

    if (!locationId) {
      panel.innerHTML = '<p class="detail-empty">Click a marker or legend entry to view details.</p>';
      return;
    }

    const loc = data.locations.find(l => l.id === locationId);
    if (!loc) return;

    const district = data.districts.find(d => d.id === loc.districtId);
    const details = getAccumulatedDetails(loc);
    const name = getVisibleName(loc);

    // Visible secrets for current phase
    const currentIdx = phaseIndex(currentPhaseId);
    const secrets = (loc.secrets || []).filter(s => phaseIndex(s.unlockPhase) <= currentIdx);

    // Build description paragraphs from all accumulated phase details
    const descriptions = details.map(d => d.description).filter(Boolean);

    panel.innerHTML = `
      <div class="detail-header">
        <div class="detail-name">${name}</div>
        <div class="detail-meta">
          <span class="detail-badge" style="border-color:${districtColor(loc.districtId)};color:${districtColor(loc.districtId)}">${loc.type}</span>
          <span class="detail-district">${district ? district.name : ''}</span>
        </div>
      </div>
      <div class="detail-body">
        ${descriptions.map((d, i) => `<p${i > 0 ? ' class="detail-later"' : ''}>${d}</p>`).join('')}
        ${loc.notableNpcs && loc.notableNpcs.length ? `
          <div class="detail-npcs">
            <span class="detail-label">Notable:</span>
            ${loc.notableNpcs.join(', ')}
          </div>
        ` : ''}
        ${secrets.length ? `
          <div class="detail-secrets">
            <div class="detail-label secret-label">▸ Secret${secrets.length > 1 ? 's' : ''}</div>
            ${secrets.map(s => `<p class="secret-text">${s.text}</p>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  /** Selects a location, updates markers, legend, and detail panel. */
  function selectLocation(locationId) {
    selectedId = locationId === selectedId ? null : locationId;
    renderMarkers();
    renderLegend();
    renderDetail(selectedId);

    // Scroll the selected legend item into view
    if (selectedId) {
      const el = document.querySelector(`.legend-item[data-id="${selectedId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ── Phase selector ─────────────────────────────────────────────────────────

  /** Rebuilds the phase dropdown from JSON data. */
  function buildPhaseSelector() {
    const select = document.getElementById('phase-select');
    if (!select) return;
    select.innerHTML = '';
    data.town.phases.forEach(phase => {
      const opt = document.createElement('option');
      opt.value = phase.id;
      opt.textContent = phase.label;
      select.appendChild(opt);
    });
    select.value = currentPhaseId;
    select.addEventListener('change', () => {
      currentPhaseId = select.value;
      // Deselect if selected location is no longer visible
      if (selectedId) {
        const loc = data.locations.find(l => l.id === selectedId);
        if (!loc || !isVisible(loc)) selectedId = null;
      }
      renderAll();
    });
  }

  // ── Day/Night toggle ───────────────────────────────────────────────────────

  /** Switches the map image between day and night. */
  function setMapMode(mode) {
    currentMode = mode;
    const img = document.getElementById('map-image');
    const placeholder = document.getElementById('map-placeholder');
    if (img) {
      const src = mode === 'day' ? data.town.maps.day : data.town.maps.night;
      img.src = src;
    }
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  /** Sets up day/night toggle buttons. */
  function buildModeToggle() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMapMode(btn.dataset.mode));
    });
    setMapMode('day');
  }

  // ── Image error fallback ───────────────────────────────────────────────────

  /** Shows a styled placeholder when map image fails to load. */
  function handleImageError() {
    const img = document.getElementById('map-image');
    const placeholder = document.getElementById('map-placeholder');
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  // ── Full re-render ─────────────────────────────────────────────────────────

  function renderAll() {
    renderMarkers();
    renderLegend();
    renderDetail(selectedId);
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  /** Loads the JSON and boots the map. */
  function init() {
    fetch('dunmore_town-data.json')
      .then(r => {
        if (!r.ok) throw new Error('Could not load town data: ' + r.status);
        return r.json();
      })
      .then(json => {
        data = json;
        currentPhaseId = data.town.phases[0].id;

        // Set page title
        const titleEl = document.getElementById('town-name');
        if (titleEl) titleEl.textContent = data.town.name;

        buildPhaseSelector();
        buildModeToggle();

        // Image error handler
        const img = document.getElementById('map-image');
        if (img) img.addEventListener('error', handleImageError);

        renderAll();
      })
      .catch(err => {
        console.error(err);
        const panel = document.getElementById('detail-panel');
        if (panel) panel.innerHTML = `<p class="detail-empty" style="color:var(--blood)">Error loading map data. Make sure dunmore_town-data.json is in the same folder and you're running this via a local server (not file://).</p>`;
      });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
