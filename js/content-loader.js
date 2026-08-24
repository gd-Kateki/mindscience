'use strict';

function icon(innerHtml, color = 'currentColor') { return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="color:${color}">${innerHtml}</svg>`; }
const ARROW_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return { day: d.getDate().toString().padStart(2, '0'), mon: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase() };
}
function renderStars(count) {
  const star = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#FF9635" aria-hidden="true"><path d="M12 2l3 6 6 .9-4.5 4.2 1 6-5.5-3-5.5 3 1-6L3 8.9 9 8l3-6z"/></svg>`;
  return Array(Math.min(5, count)).fill(star).join('');
}

function applySiteConfig(cfg) {
  const c = cfg.clinic;
  const setEl = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const setTxt = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  if (cfg.topbar) {
    setEl('topbarMessage', cfg.topbar.message);
    const tCta = document.getElementById('topbarCta');
    if (tCta) { tCta.textContent = cfg.topbar.cta.label; tCta.href = cfg.topbar.cta.href; }
  }
  const mapIframe = document.getElementById('mapIframe'); if (mapIframe) mapIframe.src = c.mapEmbedUrl;
  setTxt('mapAddress', c.address); setTxt('mapHours', c.hours); setTxt('mapParking', c.parking);
  const mapDirBtn = document.getElementById('mapDirBtn'); if (mapDirBtn) mapDirBtn.href = c.mapDirectionsUrl;
  setTxt('footerClinicName', c.name); setTxt('footerClinicDesc', c.description);
  setTxt('footerEmail', c.email); setTxt('footerPhone', c.phone); setTxt('footerAddress', c.location);
  document.title = `${c.name} — ${c.tagline}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `${c.name} — ${c.description}`;
  const w3key = document.querySelector('input[name="access_key"]'); if (w3key) w3key.value = c.web3formsKey;
  const toEmail = document.querySelector('input[name="to_email"]'); if (toEmail) toEmail.value = c.email;
}

function renderTeam(members) {
  const grid = document.getElementById('teamGrid'); if (!grid) return;
  grid.innerHTML = members.map(m => {
    const photoHtml = m.photoUrl ? `<img src="${m.photoUrl}" alt="Photo of ${m.name}" loading="lazy">` : `<div class="avatar-fallback">${m.initials}</div>`;
    const tags = m.specialties.map(s => `<span class="team-tag">${s}</span>`).join('');
    return `<div class="team-card reveal">
      <div class="avatar-photo" style="background: linear-gradient(135deg, ${m.gradientFrom}, ${m.gradientTo});">${photoHtml}</div>
      <h3>${m.name}</h3><span class="role">${m.role}</span><p>${m.bio}</p>
      <div class="team-specialties">${tags}</div></div>`;
  }).join('');
}

function renderServices(services) {
  const grid = document.getElementById('servicesGrid'); if (!grid) return;
  grid.innerHTML = services.map(s => `
    <div class="service-card reveal">
      <div class="service-icon" style="background:${s.iconBg}; color:${s.iconColor};">${icon(s.iconSvg)}</div>
      <h3>${s.title}</h3><p>${s.description}</p><span class="service-tag">${s.tag}</span>
    </div>`).join('');
}

function renderEvents(events) {
  const spotlight = events.find(e => e.isSpotlight) || events[0];
  renderSpotlight(spotlight);
  const list = document.getElementById('announceList'); if (!list) return;
  list.innerHTML = events.map(e => {
    const { day, mon } = formatDate(e.date);
    return `<div class="announce-row reveal" data-category="${e.category}">
      <div class="row-date"><span class="day">${day}</span><span class="mon">${mon}</span></div>
      <div class="row-thumb"><img src="${e.thumbUrl}" alt="" loading="lazy"></div>
      <div class="row-body"><h4>${e.title}</h4><div class="row-meta"><span>${e.time}</span><span>${e.location}</span></div></div>
      <a class="row-cta" href="#book" aria-label="Reserve a seat for ${e.title}">${ARROW_SVG}</a>
    </div>`;
  }).join('');
}

function renderSpotlight(e) {
  const el = document.getElementById('eventSpotlight'); if (!el || !e) return;
  const fullDate = new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  el.innerHTML = `
    <div class="spotlight-media">
      <img src="${e.imageUrl}" alt="${e.title}" loading="lazy"><span class="announce-badge">${e.category.charAt(0).toUpperCase() + e.category.slice(1)}</span>
    </div>
    <div class="spotlight-body">
      <span class="spotlight-eyebrow">Next up</span><h3>${e.title}</h3><p class="announce-desc">${e.description}</p>
      <div class="announce-meta">
        <div class="announce-meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${fullDate}</div>
        <div class="announce-meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${e.time}</div>
        <div class="announce-meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s-6.5-5.1-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.9 12 21 12 21z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10.5" r="2.2" stroke="currentColor" stroke-width="1.8"/></svg>${e.location}</div>
      </div>
      <a class="announce-cta" href="#book">Reserve a seat ${ARROW_SVG}</a>
    </div>`;
}

function renderTestimonials(items) {
  const grid = document.getElementById('testimonialsGrid'); if (!grid) return;
  grid.innerHTML = items.map(t => `
    <div class="testimonial-card reveal">
      <div class="stars">${renderStars(t.stars)}</div><p class="quote">${t.quote}</p>
      <div class="testimonial-who">
        <div class="testimonial-avatar" style="background: linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo});">${t.initial}</div>
        <div><h4>${t.name}</h4><span>${t.service}</span></div>
      </div>
    </div>`).join('');
}

function renderBlog(posts) {
  const grid = document.getElementById('blogGrid'); if (!grid) return;
  grid.innerHTML = posts.map(p => `
    <a class="blog-card reveal" href="${p.url}" target="_blank" rel="noopener">
      <div class="blog-thumb" style="background:${p.iconBg}; color:${p.iconColor};">${icon(p.iconSvg, 'currentColor')}</div>
      <div class="blog-body"><span class="blog-tag">${p.tag}</span><h3>${p.title}</h3><p>${p.description}</p><span class="blog-link">Read more ${ARROW_SVG}</span></div>
    </a>`).join('');
}

function init() {
  try {
    const data = {
      site:         window.DATA_site,
      team:         window.DATA_team,
      services:     window.DATA_services,
      events:       window.DATA_events,
      testimonials: window.DATA_testimonials,

      blog:         window.DATA_blog,
    };
    if (!data.site) throw new Error('Data scripts not loaded. Make sure the data/*.js files are included.');
    applySiteConfig(data.site);
    renderTeam(data.team);
    renderServices(data.services);
    renderEvents(data.events);
    renderTestimonials(data.testimonials);

    renderBlog(data.blog);
    document.dispatchEvent(new CustomEvent('contentLoaded'));
  } catch (err) {
    console.error('[content-loader]', err);
  }
}
document.addEventListener('DOMContentLoaded', init);


