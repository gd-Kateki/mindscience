'use strict';

/* =========================================================================
   MindScience Layout Editor  — Ctrl+Shift+E to toggle
   - Drag any highlighted element to move it
   - Shift+Drag to lock to horizontal or vertical axis
   - Shift+Scroll to scale up/down
   - All positions auto-saved to localStorage
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

  /* ── Storage ─────────────────────────────────────────────────────────── */
  function loadPositions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function savePositions(pos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }

  /* ── Apply a saved position to one element ───────────────────────────── */
  function applyPosition(el, pos) {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.classList.add('in');
    const s = pos.scale !== undefined ? pos.scale : 1;
    el.style.transform = `translate(${pos.left || 0}px, ${pos.top || 0}px) scale(${s})`;
    el.style.transformOrigin = 'top left';
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
  function showScaleTooltip(wrapper, scale) {
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
    const rect = wrapper.getBoundingClientRect();
    scaleTooltip.textContent = `${Math.round(scale * 100)}%`;
    scaleTooltip.style.left = (rect.left + rect.width / 2 - 22) + 'px';
    scaleTooltip.style.top  = (rect.top + window.scrollY - 36) + 'px';
    scaleTooltip.style.position = 'absolute';
    scaleTooltip.style.opacity = '1';
    clearTimeout(scaleTooltip._hide);
    scaleTooltip._hide = setTimeout(() => {
      if (scaleTooltip) scaleTooltip.style.opacity = '0';
    }, 900);
  }

  /* ── Update the wrapper outline to match actual scaled visual size ───── */
  function updateWrapperOutline(wrapper, el) {
    const scale = parseFloat(el.getAttribute('data-scale') || 1);
    const baseW = parseFloat(wrapper.getAttribute('data-base-w') || wrapper.offsetWidth);
    const baseH = parseFloat(wrapper.getAttribute('data-base-h') || wrapper.offsetHeight);
    const scaledW = baseW * scale;
    const scaledH = baseH * scale;
    // Use box-shadow on element to show a scaled outline; outline on wrapper stays for focus/context
    el.style.boxShadow = editMode
      ? `0 0 0 2px #e8158c, 0 0 0 4px rgba(232,21,140,0.2)`
      : '';
  }

  /* ── Build the floating editor toolbar ──────────────────────────────── */
  function buildUI() {
    const bar = document.createElement('div');
    bar.id = 'msc-edit-badge';
    bar.style.cssText = `
      position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
      background: rgba(20,20,36,0.97); color: #fff;
      padding: 10px 20px; border-radius: 999px;
      font-size: 13px; font-weight: 600; font-family: sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 999998; display: none; align-items: center;
      gap: 10px; white-space: nowrap; backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;

    const label = document.createElement('span');
    label.innerHTML = '✦ Layout Editor';
    label.style.cssText = 'color:#e8158c; font-weight:800; letter-spacing:0.02em; margin-right:2px;';

    const tip = document.createElement('span');
    tip.innerHTML = 'Drag to move &nbsp;·&nbsp; Shift+drag = straight line &nbsp;·&nbsp; Shift+scroll = scale';
    tip.style.cssText = 'font-size:11px; opacity:0.45;';

    const sep = () => {
      const d = document.createElement('span');
      d.style.cssText = 'width:1px;height:16px;background:rgba(255,255,255,0.15);display:inline-block;flex-shrink:0;';
      return d;
    };

    const btn = (text, bg, onClick) => {
      const b = document.createElement('button');
      b.innerHTML = text;
      b.style.cssText = `
        background:${bg}; color:#fff; border:none; padding:5px 14px;
        border-radius:999px; font-size:12px; font-weight:700;
        cursor:pointer; font-family:sans-serif; transition:filter 0.15s;
      `;
      b.onmouseover = () => b.style.filter = 'brightness(1.15)';
      b.onmouseout  = () => b.style.filter = '';
      b.addEventListener('click', onClick);
      return b;
    };

    const saveBtn = btn('💾 Save', '#00a040', () => {
      const positions = loadPositions();
      activeWrappers.forEach(w => {
        positions[w.selector] = {
          left:  parseFloat(w.el.getAttribute('data-offset-x') || 0),
          top:   parseFloat(w.el.getAttribute('data-offset-y') || 0),
          scale: parseFloat(w.el.getAttribute('data-scale')    || 1)
        };
      });
      savePositions(positions);
      saveBtn.innerHTML = '✓ Saved!';
      saveBtn.style.background = '#00c853';
      setTimeout(() => { saveBtn.innerHTML = '💾 Save'; saveBtn.style.background = '#00a040'; }, 1500);
    });

    const resetBtn = btn('↺ Reset', '#c0392b', () => {
      if (!confirm('Reset all positions and scales? This cannot be undone.')) return;
      localStorage.removeItem(STORAGE_KEY);
      activeWrappers.forEach(w => {
        w.el.style.transform   = 'scale(1)';
        w.el.style.boxShadow   = '0 0 0 2px #e8158c, 0 0 0 4px rgba(232,21,140,0.2)';
        w.el.setAttribute('data-offset-x', 0);
        w.el.setAttribute('data-offset-y', 0);
        w.el.setAttribute('data-scale', 1);
        w.wrapper.style.transform = 'translate(0px,0px)';
      });
    });

    const exitBtn = btn('✕ Exit', '#444', () => disableEditMode());

    bar.appendChild(label);
    bar.appendChild(tip);
    bar.appendChild(sep());
    bar.appendChild(saveBtn);
    bar.appendChild(resetBtn);
    bar.appendChild(sep());
    bar.appendChild(exitBtn);
    document.body.appendChild(bar);
    return bar;
  }

  /* ── Wrap one element and make it draggable ──────────────────────────── */
  function makeDraggable(el, selector) {
    const currentX     = parseFloat(el.getAttribute('data-offset-x') || 0);
    const currentY     = parseFloat(el.getAttribute('data-offset-y') || 0);
    const currentScale = parseFloat(el.getAttribute('data-scale')    || 1);

    // Temporarily strip transform to get the true unscaled dimensions
    const origTransform = el.style.transform;
    el.style.transform = 'none';
    const rect     = el.getBoundingClientRect();
    const computed  = window.getComputedStyle(el);

    // Also note whether the element is absolutely positioned
    const isAbsolute = computed.position === 'absolute' || computed.position === 'fixed';
    el.style.transform = origTransform;

    // Create wrapper — handles translation only
    const wrapper = document.createElement('div');
    wrapper.className = 'msc-drag-wrapper';
    wrapper.setAttribute('data-base-w', rect.width);
    wrapper.setAttribute('data-base-h', rect.height);
    wrapper.style.cssText = `
      position: ${isAbsolute ? 'relative' : 'relative'};
      display: block; cursor: grab;
      width: ${rect.width}px; height: ${rect.height}px;
      margin-top: ${computed.marginTop}; margin-bottom: ${computed.marginBottom};
      margin-left: ${computed.marginLeft}; margin-right: ${computed.marginRight};
      transform: translate(${currentX}px, ${currentY}px);
      z-index: 1000; box-sizing: border-box; overflow: visible;
    `;

    // Scale lives on el; translation lives on wrapper
    el.style.animation      = 'none';
    el.style.opacity        = '1';
    el.style.transform      = `scale(${currentScale})`;
    el.style.transformOrigin = 'top left';
    el.style.pointerEvents  = 'none'; // Let wrapper receive all mouse events
    el.style.boxShadow      = '0 0 0 2px #e8158c, 0 0 0 4px rgba(232,21,140,0.2)';

    // If it was position:absolute, reset to static so it sits inside wrapper flow
    if (isAbsolute) {
      el.setAttribute('data-orig-position', el.style.position);
      el.style.position = 'relative';
    }

    // Save original inline styles to restore later
    ['width','height','margin','marginTop','marginBottom'].forEach(p => {
      el.setAttribute(`data-orig-${p}`, el.style[p] || '');
    });
    el.style.width   = '100%';
    el.style.height  = '100%';
    el.style.margin  = '0';

    // Hover label (non-interactive, just informational)
    const labelEl = document.createElement('div');
    labelEl.className = 'msc-drag-handle';
    labelEl.innerHTML = '✥ Drag &nbsp;·&nbsp; Shift+scroll to scale';
    labelEl.style.cssText = `
      position: absolute; top: 0; left: 0;
      background: rgba(232,21,140,0.85); color: #fff;
      font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
      padding: 3px 9px; font-family: sans-serif; border-radius: 0 0 6px 0;
      pointer-events: none; z-index: 1001;
      opacity: 0; transition: opacity 0.12s;
    `;

    wrapper.appendChild(labelEl);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Show/hide label on hover
    wrapper.addEventListener('mouseenter', () => { if (!dragging) labelEl.style.opacity = '1'; });
    wrapper.addEventListener('mouseleave', () => { labelEl.style.opacity = '0'; });

    // Start drag
    wrapper.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      dragging = {
        el, selector, wrapper, labelEl,
        startX:  parseFloat(el.getAttribute('data-offset-x') || 0),
        startY:  parseFloat(el.getAttribute('data-offset-y') || 0),
        mouseX:  e.clientX,
        mouseY:  e.clientY
      };

      wrapper.style.cursor  = 'grabbing';
      wrapper.style.zIndex  = '100000';
      labelEl.style.opacity = '0';
    });

    return wrapper;
  }

  /* ── Un-wrap an element, restoring its original styles ───────────────── */
  function removeDraggable(wrapper, el) {
    if (!wrapper.parentNode) return;

    const finalX     = el.getAttribute('data-offset-x') || 0;
    const finalY     = el.getAttribute('data-offset-y') || 0;
    const finalScale = el.getAttribute('data-scale')    || 1;

    // Restore original inline styles
    ['width','height','margin','marginTop','marginBottom'].forEach(p => {
      el.style[p] = el.getAttribute(`data-orig-${p}`) || '';
      el.removeAttribute(`data-orig-${p}`);
    });

    if (el.hasAttribute('data-orig-position')) {
      el.style.position = el.getAttribute('data-orig-position') || '';
      el.removeAttribute('data-orig-position');
    }

    el.style.pointerEvents   = '';
    el.style.boxShadow       = '';
    el.style.transformOrigin = '';
    el.style.transform = `translate(${finalX}px, ${finalY}px) scale(${finalScale})`;

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

    // Shift = constrain to straight line
    if (e.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
      else dx = 0;
    }

    const newX = Math.round((dragging.startX + dx) / SNAP) * SNAP;
    const newY = Math.round((dragging.startY + dy) / SNAP) * SNAP;

    dragging.wrapper.style.transform = `translate(${newX}px, ${newY}px)`;
    dragging.el.setAttribute('data-offset-x', newX);
    dragging.el.setAttribute('data-offset-y', newY);
    dragging._px = newX;
    dragging._py = newY;
  });

  /* ── Mouse up ────────────────────────────────────────────────────────── */
  document.addEventListener('mouseup', function () {
    if (!dragging) return;

    dragging.wrapper.style.cursor = 'grab';
    dragging.wrapper.style.zIndex = '1000';

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
    scale = Math.round(Math.min(3, Math.max(0.2, scale + (e.deltaY < 0 ? 0.05 : -0.05))) * 100) / 100;

    el.setAttribute('data-scale', scale);
    el.style.transform = `scale(${scale})`;
    // Update the pink outline box-shadow to match scale visually
    el.style.boxShadow = `0 0 0 ${Math.round(2 / scale)}px #e8158c, 0 0 0 ${Math.round(4 / scale)}px rgba(232,21,140,0.2)`;

    showScaleTooltip(wrapper, scale);

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

  /* ── Restore positions on page load ──────────────────────────────────── */
  window.addEventListener('load', () => setTimeout(restoreAllPositions, 60));
  document.addEventListener('contentLoaded', () => setTimeout(restoreAllPositions, 60));

})();
