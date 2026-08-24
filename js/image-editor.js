'use strict';

(function () {
  /* ── Editor is now globally accessible via Ctrl+Shift+E ── */

  const STORAGE_KEY = 'msc_image_positions';
  let editMode = false;
  let dragging = null;
  let offsetX = 0, offsetY = 0;

  /* ── Editable images: add IDs to any you want draggable ── */
  const DRAGGABLE_SELECTORS = [
    '#heroLogoImg',
    '.footer-brand > div:first-child',
    '.footer-mho-logo',
    '.hero-media-frame',
    '.map-embed',
    '#val-img-1',
    '#val-img-2',
    '#val-img-3',
    '#val-img-4',
    '#val-img-5',
    '#val-img-6',
    '#val-img-7'
  ];

  /* ── Load saved positions from localStorage ── */
  function loadPositions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  /* ── Save positions to localStorage ── */
  function savePositions(positions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }

  /* ── Apply a saved position to an element ── */
  function applyPosition(el, pos) {
    el.style.animation = 'none';
    el.style.opacity = '1';
    const scale = pos.scale !== undefined ? pos.scale : 1;
    el.style.transformOrigin = 'top left';
    el.style.transform = `translate(${pos.left || 0}px, ${pos.top || 0}px) scale(${scale})`;
    el.setAttribute('data-offset-x', pos.left || 0);
    el.setAttribute('data-offset-y', pos.top || 0);
    el.setAttribute('data-scale', scale);
    el.classList.add('in');
  }

  /* ── Restore all saved positions on page load ── */
  function restoreAllPositions() {
    const positions = loadPositions();
    DRAGGABLE_SELECTORS.forEach(function (sel) {
      const el = document.querySelector(sel);
      if (el && positions[sel]) {
        applyPosition(el, positions[sel]);
      }
    });
  }

  /* ── Build the edit-mode UI overlay ── */
  function buildUI() {
    const badge = document.createElement('div');
    badge.id = 'msc-edit-badge';
    badge.innerHTML = '✦ Layout Edit Mode <span style="font-size:11px;opacity:0.6;margin-left:6px;">(Ctrl+Shift+E to exit | Shift+drag = straight line | Shift+scroll = scale)</span>';
    badge.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #1a1a2e; color: #fff; padding: 10px 20px; border-radius: 999px;
      font-size: 14px; font-weight: 600; font-family: sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 99999;
      display: none; align-items: center; gap: 12px; white-space: nowrap;
    `;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset All';
    resetBtn.style.cssText = `
      background: #e8158c; color: #fff; border: none; padding: 6px 14px;
      border-radius: 999px; font-size: 12px; font-weight: 700;
      cursor: pointer; font-family: sans-serif;
    `;
    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(STORAGE_KEY);
      DRAGGABLE_SELECTORS.forEach(function (sel) {
        const el = document.querySelector(sel);
        if (el) {
          el.style.transform = '';
          el.removeAttribute('data-offset-x');
          el.removeAttribute('data-offset-y');
          el.removeAttribute('data-scale');
        }
      });
      if (activeWrappers.length > 0) {
        activeWrappers.forEach(w => {
          w.wrapper.style.transform = '';
        });
      }
    });

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save';
    saveBtn.style.cssText = `
      background: #00b248; color: #fff; border: none; padding: 6px 14px;
      border-radius: 999px; font-size: 12px; font-weight: 700;
      cursor: pointer; font-family: sans-serif;
    `;
    saveBtn.addEventListener('click', function () {
      const positions = loadPositions();
      activeWrappers.forEach(w => {
        let finalX = parseFloat(w.el.getAttribute('data-offset-x') || 0);
        let finalY = parseFloat(w.el.getAttribute('data-offset-y') || 0);
        let finalScale = parseFloat(w.el.getAttribute('data-scale') || 1);
        positions[w.selector] = { left: finalX, top: finalY, scale: finalScale };
      });
      savePositions(positions);

      saveBtn.textContent = '✓ Saved!';
      saveBtn.style.background = '#00e676';
      setTimeout(() => {
        saveBtn.textContent = '💾 Save';
        saveBtn.style.background = '#00b248';
      }, 1200);
    });

    badge.appendChild(saveBtn);
    badge.appendChild(resetBtn);
    document.body.appendChild(badge);
    return badge;
  }

  /* ── Add drag behaviour to a single element ── */
  function makeDraggable(el, selector) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msc-drag-wrapper';

    // Extract existing transform offset if any
    const currentX = parseFloat(el.getAttribute('data-offset-x') || 0);
    const currentY = parseFloat(el.getAttribute('data-offset-y') || 0);
    const currentScale = parseFloat(el.getAttribute('data-scale') || 1);

    // Is this a leaf element (img/iframe) or a container div?
    const isLeaf = el.tagName === 'IMG' || el.tagName === 'IFRAME';

    // Temporarily remove transform to get true base dimensions
    const oldTransform = el.style.transform;
    el.style.transform = 'none';
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    el.style.transform = oldTransform;

    // Wrapper handles translation; el handles scale
    wrapper.style.cssText = `
      position: relative; display: block; cursor: grab;
      width: ${rect.width}px;
      height: ${isLeaf ? rect.height + 'px' : 'auto'};
      margin-top: ${computed.marginTop}; margin-bottom: ${computed.marginBottom};
      margin-left: ${computed.marginLeft}; margin-right: ${computed.marginRight};
      outline: 2px dashed #e8158c; outline-offset: 4px;
      transform: translate(${currentX}px, ${currentY}px);
      z-index: 1000;
    `;

    // Reset element's own transform — scale only, translate moves to wrapper
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = `scale(${currentScale})`;
    el.style.transformOrigin = 'top left';
    el.style.pointerEvents = 'none'; // wrapper captures all mouse events

    // For leaf elements resize to fill wrapper; for containers leave sizing alone
    if (isLeaf) {
      el.setAttribute('data-orig-width', el.style.width);
      el.setAttribute('data-orig-height', el.style.height);
      el.style.width = '100%';
      el.style.height = '100%';
    }

    el.setAttribute('data-original-margin', el.style.margin);
    el.setAttribute('data-original-margin-top', el.style.marginTop);
    el.setAttribute('data-original-margin-bottom', el.style.marginBottom);
    el.style.margin = '0';

    const handle = document.createElement('div');
    handle.className = 'msc-drag-handle';
    handle.innerHTML = '✥ Drag';
    handle.style.cssText = `
      position: absolute; top: 0; left: 0;
      background: #e8158c; color: #fff; font-size: 11px; font-weight: 700;
      padding: 4px 8px; font-family: sans-serif; opacity: 0;
      pointer-events: none; z-index: 1001; white-space: nowrap;
      transition: opacity 0.15s;
    `;

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(handle);
    wrapper.appendChild(el);

    wrapper.addEventListener('mouseenter', () => { if (!dragging) handle.style.opacity = '1'; });
    wrapper.addEventListener('mouseleave', () => { if (!dragging) handle.style.opacity = '0'; });

    wrapper.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();

      let startX = parseFloat(el.getAttribute('data-offset-x') || 0);
      let startY = parseFloat(el.getAttribute('data-offset-y') || 0);

      dragging = {
        el: el,
        selector: selector,
        wrapper: wrapper,
        startX: startX,
        startY: startY,
        mouseX: e.clientX,
        mouseY: e.clientY
      };

      wrapper.style.cursor = 'grabbing';
      wrapper.style.zIndex = '100000';
      handle.style.opacity = '0';
    });

    return wrapper;
  }

  /* ── Remove drag wrapper from an element ── */
  function removeDraggable(wrapper, el) {
    if (wrapper.parentNode) {
      const finalX     = el.getAttribute('data-offset-x') || 0;
      const finalY     = el.getAttribute('data-offset-y') || 0;
      const finalScale = el.getAttribute('data-scale')    || 1;

      // Restore leaf element sizing if we changed it
      if (el.hasAttribute('data-orig-width')) {
        el.style.width  = el.getAttribute('data-orig-width')  || '';
        el.style.height = el.getAttribute('data-orig-height') || '';
        el.removeAttribute('data-orig-width');
        el.removeAttribute('data-orig-height');
      }

      el.style.margin      = el.getAttribute('data-original-margin')        || '';
      el.style.marginTop   = el.getAttribute('data-original-margin-top')    || '';
      el.style.marginBottom = el.getAttribute('data-original-margin-bottom') || '';

      el.removeAttribute('data-original-margin');
      el.removeAttribute('data-original-margin-top');
      el.removeAttribute('data-original-margin-bottom');

      el.style.pointerEvents   = '';
      el.style.transformOrigin = '';
      el.style.transform = `translate(${finalX}px, ${finalY}px) scale(${finalScale})`;

      wrapper.parentNode.insertBefore(el, wrapper);
      wrapper.parentNode.removeChild(wrapper);
    }
  }

  /* ── Toggle edit mode on/off ── */
  let badge = null;
  let activeWrappers = [];

  function enableEditMode() {
    editMode = true;
    if (!badge) badge = buildUI();
    badge.style.display = 'flex';

    DRAGGABLE_SELECTORS.forEach(function (sel) {
      const el = document.querySelector(sel);
      if (!el) return;
      const wrapper = makeDraggable(el, sel);
      activeWrappers.push({ wrapper: wrapper, el: el, selector: sel });
    });
  }

  function disableEditMode() {
    editMode = false;
    if (badge) badge.style.display = 'none';

    activeWrappers.forEach(function (item) {
      removeDraggable(item.wrapper, item.el);
    });
    activeWrappers = [];
  }

  /* ── Mouse move handler ── */
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;

    let dx = e.clientX - dragging.mouseX;
    let dy = e.clientY - dragging.mouseY;

    // Shift: lock to horizontal or vertical axis
    if (e.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    let newLeft = dragging.startX + dx;
    let newTop = dragging.startY + dy;

    // Snap to nearest 10px grid
    const snap = 10;
    newLeft = Math.round(newLeft / snap) * snap;
    newTop = Math.round(newTop / snap) * snap;

    dragging.wrapper.style.transform = `translate(${newLeft}px, ${newTop}px)`;
    dragging.el.setAttribute('data-offset-x', newLeft);
    dragging.el.setAttribute('data-offset-y', newTop);
    dragging._pendingLeft = newLeft;
    dragging._pendingTop = newTop;
  });

  /* ── Mouse up handler — save on release ── */
  document.addEventListener('mouseup', function () {
    if (dragging) {
      const handle = dragging.wrapper.querySelector('.msc-drag-handle');
      dragging.wrapper.style.cursor = 'grab';
      dragging.wrapper.style.zIndex = '1000';
      if (handle) handle.style.opacity = '0';

      if (dragging._pendingLeft !== undefined) {
        const positions = loadPositions();
        let currentScale = parseFloat(dragging.el.getAttribute('data-scale') || 1);
        positions[dragging.selector] = {
          left: dragging._pendingLeft,
          top: dragging._pendingTop,
          scale: currentScale
        };
        savePositions(positions);
      }

      dragging = null;
    }
  });

  /* ── Keyboard shortcut: Ctrl + Shift + E ── */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      if (editMode) {
        disableEditMode();
      } else {
        enableEditMode();
      }
    }
  });

  /* ── Shift+Scroll to scale ── */
  document.addEventListener('wheel', function (e) {
    if (!editMode || !e.shiftKey) return;
    let target = e.target.closest('.msc-drag-wrapper');
    if (!target) return;
    e.preventDefault();

    const el = target.querySelector(':scope > :not(.msc-drag-handle)');
    if (!el) return;

    let currentScale = parseFloat(el.getAttribute('data-scale') || 1);
    const scaleStep = 0.05;
    if (e.deltaY < 0) currentScale += scaleStep;
    else currentScale -= scaleStep;
    if (currentScale < 0.2) currentScale = 0.2;
    if (currentScale > 3) currentScale = 3;
    currentScale = Math.round(currentScale * 100) / 100;

    el.setAttribute('data-scale', currentScale);
    el.style.transform = `scale(${currentScale})`;

    const selector = activeWrappers.find(w => w.wrapper === target)?.selector;
    if (selector) {
      const positions = loadPositions();
      const x = parseFloat(el.getAttribute('data-offset-x') || 0);
      const y = parseFloat(el.getAttribute('data-offset-y') || 0);
      positions[selector] = { left: x, top: y, scale: currentScale };
      savePositions(positions);
    }
  }, { passive: false });

  /* ── Restore on page load ── */
  window.addEventListener('load', function () {
    setTimeout(restoreAllPositions, 60);
  });

  document.addEventListener('contentLoaded', function () {
    setTimeout(restoreAllPositions, 60);
  });

})();
