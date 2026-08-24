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
    '.hero-support-img',
    '.footer-brand > div:first-child',
    '.footer-mho-logo',
    '.hero-media-frame',
    '.map-embed'
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
    // CSS animations (fadeUpIn, reveal, etc.) have higher priority than inline styles
    // and will override our saved transform once they finish. We must cancel them first.
    el.style.animation = 'none';
    el.style.opacity = '1'; // Element may be hidden if reveal animation hasn't fired yet
    el.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    el.setAttribute('data-offset-x', pos.left);
    el.setAttribute('data-offset-y', pos.top);
    // Also add 'in' class in case it's a .reveal element (so it isn't hidden by IntersectionObserver logic)
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
    badge.innerHTML = '✏️ Layout Edit Mode <span style="font-size:11px;opacity:0.7;margin-left:6px;">(Ctrl+Shift+E to exit | Shift to snap axis)</span>';
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
        }
      });
      if(activeWrappers.length > 0) {
          activeWrappers.forEach(w => {
              w.wrapper.style.transform = '';
          });
      }
    });

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

    // Freeze dimensions so relative/percentage elements like iframes don't collapse
    const rect = el.getBoundingClientRect();

    wrapper.style.cssText = `
      position: relative; display: block; cursor: grab;
      width: ${rect.width}px; height: ${rect.height}px;
      outline: 2px dashed #e8158c; outline-offset: 4px;
      transform: translate(${currentX}px, ${currentY}px);
      z-index: 1000;
    `;

    // Reset element's own transform and fix it to 100% to fill the wrapper safely
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = '';
    el.setAttribute('data-original-width', el.style.width);
    el.setAttribute('data-original-height', el.style.height);
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.margin = '0';

    const handle = document.createElement('div');
    handle.className = 'msc-drag-handle';
    handle.innerHTML = '✥ Drag';
    handle.style.cssText = `
      position: absolute; top: -24px; left: 0;
      background: #e8158c; color: #fff; font-size: 11px; font-weight: 700;
      padding: 3px 8px; border-radius: 4px 4px 0 0; font-family: sans-serif;
      cursor: grab; user-select: none; z-index: 1001; white-space: nowrap;
    `;

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(handle);
    wrapper.appendChild(el);

    handle.addEventListener('mousedown', function (e) {
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

      handle.style.cursor = 'grabbing';
      wrapper.style.cursor = 'grabbing';
      wrapper.style.zIndex = '100000'; // Bring to front while dragging
    });

    return wrapper;
  }

  /* ── Remove drag wrapper from an element ── */
  function removeDraggable(wrapper, el) {
    if (wrapper.parentNode) {
      // Re-apply the transform directly to the element before unwrapping
      let finalX = el.getAttribute('data-offset-x') || 0;
      let finalY = el.getAttribute('data-offset-y') || 0;
      el.style.transform = `translate(${finalX}px, ${finalY}px)`;
      
      // Restore original dimensions
      el.style.width = el.getAttribute('data-original-width') || '';
      el.style.height = el.getAttribute('data-original-height') || '';
      el.style.margin = '';
      el.removeAttribute('data-original-width');
      el.removeAttribute('data-original-height');

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

  /* ── Mouse move handler — only updates visual position ── */
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;

    dragging.el.style.pointerEvents = 'none';

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

  /* ── Mouse up handler — commits save to localStorage on release ── */
  document.addEventListener('mouseup', function () {
    if (dragging) {
      const handle = dragging.wrapper.querySelector('.msc-drag-handle');
      if (handle) handle.style.cursor = 'grab';
      dragging.wrapper.style.cursor = 'grab';
      dragging.el.style.pointerEvents = '';
      dragging.wrapper.style.zIndex = '1000';

      if (dragging._pendingLeft !== undefined) {
        const positions = loadPositions();
        positions[dragging.selector] = { left: dragging._pendingLeft, top: dragging._pendingTop };
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

  /* ── Restore LAST on load (runs after alignHeroMedia and all other scripts) ── */
  window.addEventListener('load', function () {
    setTimeout(restoreAllPositions, 50);
  });

  document.addEventListener('contentLoaded', function () {
    setTimeout(restoreAllPositions, 50);
  });

})();
