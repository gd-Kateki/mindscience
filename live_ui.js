'use strict';
function initUI() {

  const topBar = document.getElementById('topBar');
  const closeBtn = document.getElementById('topBarClose');
  if (topBar && closeBtn) closeBtn.addEventListener('click', () => topBar.classList.add('dismissed'));

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (a.classList.contains('has-dropdown') && window.matchMedia('(max-width:760px)').matches) return;
        navLinks.classList.remove('open'); navToggle.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const aboutNavItem = document.getElementById('aboutNavItem');
  if (aboutNavItem) {
    const aboutTrigger = aboutNavItem.querySelector('.nav-link.has-dropdown');
    if (aboutTrigger) {
      aboutTrigger.addEventListener('click', e => {
        if (window.matchMedia('(max-width:760px)').matches) { e.preventDefault(); const isOpen = aboutNavItem.classList.toggle('open'); aboutTrigger.setAttribute('aria-expanded', isOpen); }
      });
    }
    document.addEventListener('click', e => { if (!aboutNavItem.contains(e.target)) { aboutNavItem.classList.remove('open'); if (aboutTrigger) aboutTrigger.setAttribute('aria-expanded', 'false'); } });
  }

  const segWrap = document.getElementById('aboutTabs');
  const segBtns = document.querySelectorAll('.seg-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  function activateTab(name) {
    segBtns.forEach(b => { const active = b.dataset.tab === name; b.classList.toggle('active', active); b.setAttribute('aria-selected', active); });
    tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
    if (segWrap) segWrap.dataset.active = name;
  }
  segBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  document.querySelectorAll('[data-nav="values"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); activateTab('values'); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }));
  document.querySelectorAll('[data-nav="team"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); activateTab('team'); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }));

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

  const navLinkEls = document.querySelectorAll('.nav-link[data-nav]');
  const sections = ['home', 'about', 'services', 'book'].map(id => document.getElementById(id));
  const siteHeader = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');
  let sectionOffsets = [];
  function measureSections() { sectionOffsets = sections.filter(Boolean).map(sec => ({ id: sec.id, top: sec.offsetTop })); }
  measureSections();

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    let current = 'home';
    sectionOffsets.forEach(sec => { if (y >= sec.top - 120) current = sec.id; });
    navLinkEls.forEach(a => a.classList.toggle('active', a.dataset.nav === current));
    if (siteHeader) siteHeader.classList.toggle('scrolled', y > 20);
    if (toTop) toTop.classList.toggle('show', y > 500);
    if (progressBar) { const docH = document.documentElement.scrollHeight - window.innerHeight; progressBar.style.transform = `scaleX(${docH > 0 ? Math.min(y / docH, 1) : 0})`; }
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', measureSections, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else { revealEls.forEach(el => el.classList.add('in')); }

  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-a');
      if (!btn || !answer) return;
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(other => { if (other !== item) { other.classList.remove('open'); other.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); other.querySelector('.faq-a').style.maxHeight = null; } });
        item.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
      });
    });
  }
  initFAQ();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); } }); }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal:not(.in)').forEach(el => observer.observe(el));
  }
}
document.addEventListener('contentLoaded', initUI);

function alignHeroMedia() {
  const logo = document.getElementById('heroLogoImg');
  const frame = document.querySelector('.hero-media-frame');
  if (!logo || !frame) return;

  if (window.matchMedia('(max-width: 900px)').matches) {
    logo.style.marginTop = '0px';
    logo.style.marginBottom = '30px';
    frame.style.marginTop = '0px';
    return;
  }

  const copy = document.querySelector('.hero-copy');
  const h1 = copy ? copy.querySelector('h1') : null;
  const lead = copy ? copy.querySelector('p.lead') : null;

  if (h1 && lead) {
    const h1Top = h1.offsetTop;
    const leadTop = lead.offsetTop;

    logo.style.marginTop = h1Top + 'px';
    logo.style.marginBottom = '0px';

    const logoHeight = logo.offsetHeight || 110; 
    let frameMargin = leadTop - (h1Top + logoHeight);
    
    // Push the Instagram frame up slightly closer to the logo
    frameMargin = frameMargin - 40;
    if (frameMargin < 30) frameMargin = 30; 
    
    frame.style.marginTop = frameMargin + 'px';
  }
}

window.addEventListener('load', alignHeroMedia);
window.addEventListener('resize', alignHeroMedia);
