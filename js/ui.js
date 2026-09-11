'use strict';

let uiInitialized = false;

function initUI() {
  if (uiInitialized) return;
  uiInitialized = true;

  // Top announcement bar dismissal
  const topBar = document.getElementById('topBar');
  const closeBtn = document.getElementById('topBarClose');
  if (topBar && closeBtn) {
    closeBtn.addEventListener('click', () => topBar.classList.add('dismissed'));
  }

  // Navigation mobile hamburger toggle
  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.getElementById('navLinks');
  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      const open = navLinksContainer.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
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

  // About dropdown for mobile / desktop
  const aboutNavItem = document.getElementById('aboutNavItem');
  if (aboutNavItem) {
    const aboutTrigger = aboutNavItem.querySelector('.nav-link.has-dropdown');
    if (aboutTrigger) {
      aboutTrigger.addEventListener('click', e => {
        if (window.matchMedia('(max-width:760px)').matches) {
          e.preventDefault();
          const isOpen = aboutNavItem.classList.toggle('open');
          aboutTrigger.setAttribute('aria-expanded', String(isOpen));
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

  // About Segmented Tabs (Our Values vs Our Team)
  const segWrap = document.getElementById('aboutTabs');
  const segBtns = document.querySelectorAll('.seg-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  function activateTab(name) {
    segBtns.forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
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

  // Announcements filter chips
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

  // Dynamic Scrollspy Navigation
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

  // Scroll reveal animations
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

  // --- FAQ Accordion with Reliable Event Delegation ---
  const faqContainer = document.getElementById('faqList') || document.querySelector('.faq-list');
  if (faqContainer) {
    faqContainer.addEventListener('click', e => {
      const btn = e.target.closest('.faq-q');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      if (!item) return;

      const isCurrentlyOpen = item.classList.contains('open');

      // Close all other open FAQ items
      faqContainer.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-q');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          const otherA = other.querySelector('.faq-a');
          if (otherA) otherA.style.maxHeight = null;
        }
      });

      // Toggle clicked item
      item.classList.toggle('open', !isCurrentlyOpen);
      btn.setAttribute('aria-expanded', String(!isCurrentlyOpen));
      const answer = item.querySelector('.faq-a');
      if (answer) {
        answer.style.maxHeight = !isCurrentlyOpen ? (answer.scrollHeight + 30) + 'px' : null;
      }
    });
  }

  
    // --- Reviews Carousel Logic ---
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewsPrev = document.getElementById('reviewsPrev');
  const reviewsNext = document.getElementById('reviewsNext');
  const reviewsDots = document.getElementById('reviewsDots');

  if (reviewsTrack) {
    const cards = Array.from(reviewsTrack.querySelectorAll('.review-card'));
    
    function getCardWidth() {
      if (!cards.length) return 0;
      const card = cards[0];
      const style = window.getComputedStyle(reviewsTrack);
      const gap = parseFloat(style.gap) || 24;
      return card.offsetWidth + gap;
    }

    function getVisibleCount() {
      const w = window.innerWidth;
      if (w <= 680) return 1;
      if (w <= 1024) return 2;
      return 3;
    }

    function createDots() {
      if (!reviewsDots) return;
      reviewsDots.innerHTML = '';
      const visible = getVisibleCount();
      const dotCount = Math.max(1, cards.length - visible + 1);

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to review slide ${i + 1}`);
        dot.setAttribute('role', 'tab');
        dot.addEventListener('click', () => {
          reviewsTrack.scrollTo({
            left: i * getCardWidth(),
            behavior: 'smooth'
          });
        });
        reviewsDots.appendChild(dot);
      }
    }

    function updateActiveDot() {
      if (!reviewsDots) return;
      const scrollLeft = reviewsTrack.scrollLeft;
      const cardW = getCardWidth();
      if (!cardW) return;
      const activeIdx = Math.min(
        Math.round(scrollLeft / cardW),
        reviewsDots.querySelectorAll('.carousel-dot').length - 1
      );
      const dots = reviewsDots.querySelectorAll('.carousel-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }

    if (reviewsPrev) {
      reviewsPrev.addEventListener('click', () => {
        const cardW = getCardWidth();
        reviewsTrack.scrollBy({ left: -cardW, behavior: 'smooth' });
      });
    }

    if (reviewsNext) {
      reviewsNext.addEventListener('click', () => {
        const cardW = getCardWidth();
        reviewsTrack.scrollBy({ left: cardW, behavior: 'smooth' });
      });
    }

    // Drag to scroll on desktop
    let isDown = false;
    let startX = 0;
    let scrollLeftVal = 0;
    reviewsTrack.addEventListener('mousedown', e => {
      isDown = true;
      reviewsTrack.classList.add('grabbing');
      startX = e.pageX - reviewsTrack.offsetLeft;
      scrollLeftVal = reviewsTrack.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      isDown = false;
      reviewsTrack.classList.remove('grabbing');
    });
    reviewsTrack.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - reviewsTrack.offsetLeft;
      const walk = (x - startX) * 1.5;
      reviewsTrack.scrollLeft = scrollLeftVal - walk;
    });

    reviewsTrack.addEventListener('scroll', updateActiveDot, { passive: true });
    window.addEventListener('resize', () => {
      createDots();
      updateActiveDot();
    }, { passive: true });

    createDots();
    updateActiveDot();
  }

  // --- Hero Video Modal Lightbox ---
  const heroVideoCard = document.getElementById('heroVideoCard') || document.querySelector('.hero-video-frame');
  const videoModal = document.getElementById('videoModal');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const videoModalClose = document.getElementById('videoModalClose');
  const modalVideo = document.getElementById('heroModalVideo');

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add('open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (modalVideo) {
      modalVideo.currentTime = 0;
      const playPromise = modalVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
    if (videoModalClose) videoModalClose.focus();
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalVideo) {
      modalVideo.pause();
    }
    if (heroVideoCard) heroVideoCard.focus();
  }

  if (heroVideoCard && videoModal) {
    heroVideoCard.addEventListener('click', openVideoModal);
    heroVideoCard.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoModal();
      }
    });
  }

  if (videoModalClose) videoModalClose.addEventListener('click', closeVideoModal);
  if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && videoModal && videoModal.classList.contains('open')) {
      closeVideoModal();
    }
  });

}

// Attach listeners cleanly
document.addEventListener('contentLoaded', initUI);
document.addEventListener('DOMContentLoaded', initUI);
