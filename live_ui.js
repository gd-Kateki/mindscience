'use strict';
function initUI() {

  const topBar = document.getElementById('topBar');
  const closeBtn = document.getElementById('topBarClose');
  if (topBar && closeBtn) closeBtn.addEventListener('click', () => topBar.classList.add('dismissed'));

  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.getElementById('navLinks');
  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      const open = navLinksContainer.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinksContainer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (a.classList.contains('has-dropdown') && window.matchMedia('(max-width:760px)').matches) return;
        navLinksContainer.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const aboutNavItem = document.getElementById('aboutNavItem');
  if (aboutNavItem) {
    const aboutTrigger = aboutNavItem.querySelector('.nav-link.has-dropdown');
    if (aboutTrigger) {
      aboutTrigger.addEventListener('click', e => {
        if (window.matchMedia('(max-width:760px)').matches) {
          e.preventDefault();
          const isOpen = aboutNavItem.classList.toggle('open');
          aboutTrigger.setAttribute('aria-expanded', isOpen);
        }
      });
    }
    document.addEventListener('click', e => {
      if (!aboutNavItem.contains(e.target)) {
        aboutNavItem.classList.remove('open');
        if (aboutTrigger) aboutTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const segWrap = document.getElementById('aboutTabs');
  const segBtns = document.querySelectorAll('.seg-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  function activateTab(name) {
    segBtns.forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active);
    });
    tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
    if (segWrap) segWrap.dataset.active = name;
  }
  segBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  document.querySelectorAll('[data-nav="values"]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    activateTab('values');
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-nav="team"]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    activateTab('team');
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  }));

  const filterChips = document.querySelectorAll('.filter-chip');
  const announceRows = () => document.querySelectorAll('.announce-row');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
      chip.classList.add('active'); chip.setAttribute('aria-selected', 'true');
      const filter = chip.dataset.filter;
      announceRows().forEach(row => row.classList.toggle('hide', filter !== 'all' && row.dataset.category !== filter));
    });
  });

  // --- Robust Real-Time Scrollspy ---
  const navLinkEls = document.querySelectorAll('.nav-link[data-nav]');
  const sectionMapping = [
    { id: 'home', nav: 'home' },
    { id: 'about', nav: 'about' },
    { id: 'services', nav: 'services' },
    { id: 'announcements', nav: 'announcements' },
    { id: 'testimonials', nav: 'announcements' },
    { id: 'faq', nav: 'faq' },
    { id: 'book', nav: 'book' },
    { id: 'visit', nav: 'faq' },
    { id: 'blog', nav: 'blog' }
  ];

  const siteHeader = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 180;
    let currentNav = 'home';

    for (let i = 0; i < sectionMapping.length; i++) {
      const item = sectionMapping[i];
      const el = document.getElementById(item.id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (scrollPos >= top) {
          currentNav = item.nav;
        }
      }
    }

    navLinkEls.forEach(link => {
      link.classList.toggle('active', link.dataset.nav === currentNav);
    });

    const y = window.scrollY;
    if (siteHeader) siteHeader.classList.toggle('scrolled', y > 20);
    if (toTop) toTop.classList.toggle('show', y > 500);
    if (progressBar) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${docH > 0 ? Math.min(y / docH, 1) : 0})`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateActiveNav();

  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Reveal animations
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // FAQ Accordion
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-a');
      if (!btn || !answer) return;
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-a').style.maxHeight = null;
          }
        });
        item.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
      });
    });
  }
  initFAQ();
}

document.addEventListener('contentLoaded', initUI);
document.addEventListener('DOMContentLoaded', initUI);
