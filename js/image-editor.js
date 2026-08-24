'use strict';

/* =========================================================================
   MindScience Layout Editor  — Ctrl+Shift+E to toggle
   - Click anywhere on an element to drag it
   - Shift+Drag to lock to horizontal or vertical axis
   - Shift+Scroll to scale
   - Positions auto-saved to localStorage and restored on every visit
   ========================================================================= */

(function () {

  /* ── Config ─────────────────────────────────────────────────────────── */
  const STORAGE_KEY = 'msc_image_positions';
  const SNAP = 5; // px grid snap

  const DRAGGABLE_SELECTORS = [
    '#heroLogoImg',
    '.hero-support-img',
    '.hero-media-frame',
    '.map-embed',
    '.footer-brand > div:first-child',
    '.footer-mho-logo'
  ];

  /* ── State ───────────────────────────────────────────────────────────── */
  let editMode = false;
  let dragging = null;
  let activeWrappers = [];
  let badge = null;
  let scaleTooltip = null;

  /* ── Storage helpers ─────────────────────────────────────────────────── */
  function loadPositions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function savePositions(pos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }

  /* ── Restore saved positions on page load ────────────────────────────── */
  function applyPosition(el, pos) {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.classList.add('in');
    const s = pos.scale !== undefined ? pos.scale : 1;
    el.style.transform = `translate(${pos.left || 0}px, ${pos.top || 0}px) scale(${s})`;
    el.setAttribute('data-offset-x', pos.left || 0);
    el.setAttribute('data-offset-y', pos.top || 0);
    el.setAttribute('data-scale', s);
  }

  function restoreAllPositions() {
    const positions = loadPositions();
    DRAGGABLE_SELECTORS.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && positions[sel]) applyPosition(el, positions[sel]);
    });
  }

  /* ── Scale tooltip ───────────────────────────────────────────────────── */
  function showScaleTooltip(el, scale) {
    if (!scaleTooltip) {
      scaleTooltip = document.createElement('div');
      scaleTooltip.style.cssText = `
        position: fixed; background: rgba(26,26,46,0.92); color: #fff;
        padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;
        font-family: sans-serif; pointer-events: none; z-index: 999999;
        transition: opacity 0.15s;
      `;
      document.body.appendChild(scaleTooltip);
    }
    const rect = el.parentElement.getBoundingClientRect();
    scaleTooltip.textContent = `${Math.round(scale * 100)}%`;
    scaleTooltip.style.left = (rect.left + rect.width / 2 - 22) + 'px';
    scaleTooltip.style.top = (rect.top - 32) + 'px';
    scaleTooltip.style.opacity = '1';
    clearTimeout(scaleTooltip._hide);
    scaleTooltip._hide = setTimeout(() => {
      if (scaleTooltip) scaleTooltip.style.opacity = '0';
    }, 800);
  }

  /* ── Build the floating editor toolbar ──────────────────────────────── */
  function buildUI() {
    const bar = document.createElement('div');
    bar.id = 'msc-edit-badge';
    bar.style.cssText = `
      position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
      background: rgba(26,26,46,0.96); color: #fff;
      padding: 10px 18px; border-radius: 999px;
      font-size: 13px; font-weight: 600; font-family: sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      z-index: 999998; display: none; align-items: center;
      gap: 10px; white-space: nowrap; backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08);
    `;

    const label = document.createElement('span');
    label.innerHTML = '✦ Layout Editor';
    label.style.cssText = 'color: #e8158c; font-weight: 800; letter-spacing: 0.02em;';

    const tip = document.createElement('span');
    tip.innerHTML = 'Drag • Shift+drag to lock axis • Shift+scroll to scale';
    tip.style.cssText = 'font-size: 11px; opacity: 0.55; margin-left: 2px;';

    const divider = () => {
      const d = document.createElement('span');
      d.style.cssText = 'width: 1px; height: 16px; background: rgba(255,255,255,0.15); display: inline-block;';
      return d;
    };

    const btn = (text, color, onClick) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = `
        background: ${color}; color: #fff; border: none; padding: 5px 14px;
        border-radius: 999px; font-size: 12px; font-weight: 700;
        cursor: pointer; font-family: sans-serif; transition: opacity 0.15s;
      `;
      b.onmouseover = () => b.style.opacity = '0.82';
      b.onmouseout  = () => b.style.opacity = '1';
      b.addEventListener('click', onClick);
      return b;
    };

    const saveBtn = btn('💾 Save', '#00b248', () => {
      const positions = loadPositions();
      activeWrappers.forEach(w => {
        positions[w.selector] = {
          left:  parseFloat(w.el.getAttribute('data-offset-x') || 0),
          top:   parseFloat(w.el.getAttribute('data-offset-y') || 0),
          scale: parseFloat(w.el.getAttribute('data-scale')    || 1)
        };
      });
      savePositions(positions);
      saveBtn.textContent = '✓ Saved!';
      saveBtn.style.background = '#00e676';
      setTimeout(() => { saveBtn.textContent = '💾 Save'; saveBtn.style.background = '#00b248'; }, 1200);
    });

    const resetBtn = btn('↺ Reset All', '#c0392b', () => {
      if (!confirm('Reset all element positions? This cannot be undone.')) return;
      localStorage.removeItem(STORAGE_KEY);
      activeWrappers.forEach(w => {
        w.el.style.transform = 'scale(1)';
        w.el.setAttribute('data-offset-x', 0);
        w.el.setAttribute('data-offset-y', 0);
        w.el.setAttribute('data-scale', 1);
        w.wrapper.style.transform = 'translate(0px, 0px)';
      });
    });

    const exitBtn = btn('✕ Exit', '#555', () => disableEditMode());

    bar.appendChild(label);
    bar.appendChild(tip);
    bar.appendChild(divider());
    bar.appendChild(saveBtn);
    bar.appendChild(resetBtn);
    bar.appendChild(divider());
    bar.appendChild(exitBtn);
    document.body.appendChild(bar);
    return bar;
  }

  /* ── Wrap one element and make it draggable ──────────────────────────── */
  function makeDraggable(el, selector) {
    const currentX     = parseFloat(el.getAttribute('data-offset-x') || 0);
    const currentY     = parseFloat(el.getAttribute('data-offset-y') || 0);
    const currentScale = parseFloat(el.getAttribute('data-scale')    || 1);

    // Measure true dimensions without any applied transform
    const prevTransform = el.style.transform;
    el.style.transform = 'none';
    const rect     = el.getBoundingClientRect();
    const computed  = window.getComputedStyle(el);
    el.style.transform = prevTransform;

    // Create the wrapper — it handles translation; el handles scale
    const wrapper = document.createElement('div');
    wrapper.className = 'msc-drag-wrapper';
    wrapper.style.cssText = `
      position: relative; display: block; cursor: grab;
      width: ${rect.width}px; height: ${rect.height}px;
      margin-top: ${computed.marginTop}; margin-bottom: ${computed.marginBottom};
      margin-left: ${computed.marginLeft}; margin-right: ${computed.marginRight};
      outline: 2px dashed rgba(232,21,140,0.6); outline-offset: 3px;
      transform: translate(${currentX}px, ${currentY}px);
      z-index: 1000; box-sizing: border-box;
    `;

    // Element fills wrapper; scale only on el
    el.style.animation   = 'none';
    el.style.opacity     = '1';
    el.style.transform   = `scale(${currentScale})`;
    el.style.transformOrigin = 'top left';
    el.style.pointerEvents = 'none';

    // Save original styles for restoration
    ['width','height','margin','marginTop','marginBottom'].forEach(p => {
      el.setAttribute(`data-orig-${p}`, el.style[p] || '');
    });
    el.style.width  = '100%';
    el.style.height = '100%';
    el.style.margin = '0';

    // Hover label
    const label = document.createElement('div');
    label.className = 'msc-drag-handle';
    label.innerHTML = '✥ Drag &nbsp;|&nbsp; Shift+Scroll to scale';
    label.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0;
      background: rgba(232,21,140,0.82); color: #fff;
      font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
      padding: 4px 8px; font-family: sans-serif;
      pointer-events: none; z-index: 1001;
      opacity: 0; transition: opacity 0.15s;
    `;

    wrapper.appendChild(label);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    wrapper.addEventListener('mouseenter', () => { label.style.opacity = '1'; });
    wrapper.addEventListener('mouseleave', () => { if (!dragging) label.style.opacity = '0'; });

    wrapper.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();

      dragging = {
        el, selector, wrapper, label,
        startX: parseFloat(el.getAttribute('data-offset-x') || 0),
        startY: parseFloat(el.getAttribute('data-offset-y') || 0),
        mouseX: e.clientX,
        mouseY: e.clientY
      };

      wrapper.style.cursor   = 'grabbing';
      wrapper.style.zIndex   = '100000';
      wrapper.style.outline  = '2px solid #e8158c';
      label.style.opacity    = '0';
    });

    return wrapper;
  }

  /* ── Un-wrap an element ──────────────────────────────────────────────── */
  function removeDraggable(wrapper, el) {
    if (!wrapper.parentNode) return;

    const finalX     = el.getAttribute('data-offset-x') || 0;
    const finalY     = el.getAttribute('data-offset-y') || 0;
    const finalScale = el.getAttribute('data-scale')    || 1;

    // Restore original styles
    ['width','height','margin','marginTop','marginBottom'].forEach(p => {
      el.style[p] = el.getAttribute(`data-orig-${p}`) || '';
      el.removeAttribute(`data-orig-${p}`);
    });

    el.style.pointerEvents = '';
    el.style.transform = `translate(${finalX}px, ${finalY}px) scale(${finalScale})`;
    el.style.transformOrigin = '';

    wrapper.parentNode.insertBefore(el, wrapper);
    wrapper.parentNode.removeChild(wrapper);
  }

  /* ── Enable / Disable ────────────────────────────────────────────────── */
  function enableEditMode() {
    editMode = true;
    if (!badge) badge = buildUI();
    badge.style.display = 'flex';

    DRAGGABLE_SELECTORS.forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      const wrapper = makeDraggable(el, sel);
      activeWrappers.push({ wrapper, el, selector: sel });
    });
  }

  function disableEditMode() {
    editMode = false;
    if (badge) badge.style.display = 'none';
    activeWrappers.forEach(item => removeDraggable(item.wrapper, item.el));
    activeWrappers = [];
  }

  /* ── Mouse move ──────────────────────────────────────────────────────── */
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;

    let dx = e.clientX - dragging.mouseX;
    let dy = e.clientY - dragging.mouseY;

    if (e.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
      else dx = 0;
    }

    let newX = Math.round((dragging.startX + dx) / SNAP) * SNAP;
    let newY = Math.round((dragging.startY + dy) / SNAP) * SNAP;

    dragging.wrapper.style.transform = `translate(${newX}px, ${newY}px)`;
    dragging.el.setAttribute('data-offset-x', newX);
    dragging.el.setAttribute('data-offset-y', newY);
    dragging._px = newX;
    dragging._py = newY;
  });

  /* ── Mouse up ────────────────────────────────────────────────────────── */
  document.addEventListener('mouseup', function () {
    if (!dragging) return;

    dragging.wrapper.style.cursor  = 'grab';
    dragging.wrapper.style.zIndex  = '1000';
    dragging.wrapper.style.outline = '2px dashed rgba(232,21,140,0.6)';
    dragging.label.style.opacity   = '0';

    if (dragging._px !== undefined) {
      const positions = loadPositions();
      positions[dragging.selector] = {
        left:  dragging._px,
        top:   dragging._py,
        scale: parseFloat(dragging.el.getAttribute('data-scale') || 1)
      };
      savePositions(positions);
    }

    dragging = null;
  });

  /* ── Shift+Scroll to scale ───────────────────────────────────────────── */
  document.addEventListener('wheel', function (e) {
    if (!editMode || !e.shiftKey) return;
    const wrapper = e.target.closest('.msc-drag-wrapper');
    if (!wrapper) return;
    e.preventDefault();

    const el = wrapper.querySelector(':scope > :not(.msc-drag-handle)');
    if (!el) return;

    let scale = parseFloat(el.getAttribute('data-scale') || 1);
    scale = Math.min(3, Math.max(0.2, scale + (e.deltaY < 0 ? 0.05 : -0.05)));
    scale = Math.round(scale * 100) / 100; // Round to 2dp

    el.setAttribute('data-scale', scale);
    el.style.transform = `scale(${scale})`;

    showScaleTooltip(el, scale);

    const selector = activeWrappers.find(w => w.wrapper === wrapper)?.selector;
    if (selector) {
      const positions = loadPositions();
      const x = parseFloat(el.getAttribute('data-offset-x') || 0);
      const y = parseFloat(el.getAttribute('data-offset-y') || 0);
      positions[selector] = { left: x, top: y, scale };
      savePositions(positions);
    }
  }, { passive: false });

  /* ── Ctrl+Shift+E toggle ─────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      editMode ? disableEditMode() : enableEditMode();
    }
  });

  /* ── Restore on page load ────────────────────────────────────────────── */
  window.addEventListener('load', () => setTimeout(restoreAllPositions, 60));
  document.addEventListener('contentLoaded', () => setTimeout(restoreAllPositions, 60));

})();
