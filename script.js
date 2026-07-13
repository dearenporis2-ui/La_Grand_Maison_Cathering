// ============ Header scroll state ============
const header = document.querySelector('.site-header');
function onScroll() {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
window.addEventListener('scroll', onScroll);
onScroll();

// ============ Mobile nav toggle ============
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.textContent = '☰';
    });
  });
}

// ============ Gallery deck: continuous auto-scroll marquee ============
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.gallery-viewport').forEach(viewport => {
  const track = viewport.querySelector('.gallery-track');
  if (!track) return;

  // Duplicate the set once so the strip can loop seamlessly
  const originalItems = Array.from(track.children).filter(el => el.classList.contains('gallery-item'));
  originalItems.forEach(item => {
    const clone = item.cloneNode(true);
    clone.classList.remove('reveal', 'in');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    track.appendChild(clone);
  });

  let loopWidth = 0;
  function measure() {
    const firstClone = track.children[originalItems.length];
    if (!firstClone) { loopWidth = track.scrollWidth / 2; return; }
    const trackRect = track.getBoundingClientRect();
    const cloneRect = firstClone.getBoundingClientRect();
    loopWidth = (cloneRect.left - trackRect.left) + track.scrollLeft;
  }
  measure();
  window.addEventListener('load', measure);
  setTimeout(measure, 600); // re-measure once images/fonts settle

  if (reduceMotion) return; // respect reduced-motion preference: static, drag-only strip

  const SPEED = 34; // px per second, gentle ambient pace
  let paused = false;
  let lastTime = null;

  function tick(now) {
    if (lastTime === null) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!paused && loopWidth > 0) {
      track.scrollLeft += SPEED * dt;
      if (track.scrollLeft >= loopWidth) {
        track.scrollLeft -= loopWidth;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Pause while the pointer rests over the strip, so captions are easy to read
  viewport.addEventListener('mouseenter', () => { paused = true; });
  viewport.addEventListener('mouseleave', () => { paused = false; });

  // Optional manual override: drag to browse, auto-scroll resumes after release
  let isDown = false;
  let dragged = false;
  let startX = 0;
  let startScroll = 0;

  function onPointerMove(e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragged = true;
    track.scrollLeft = startScroll - dx;
  }

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('dragging');
    paused = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return; // let touch devices use native momentum scroll
    if (e.button !== undefined && e.button !== 0) return;
    isDown = true;
    dragged = false;
    paused = true;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  });

  // Prevent the lightbox from opening right after a drag gesture
  track.addEventListener('click', (e) => {
    if (dragged) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
});

// ============ Skeleton loading: dish photos ============
document.querySelectorAll('.plate img, .image-frame img').forEach(img => {
  const container = img.closest('.plate, .image-frame');
  if (container) container.classList.add('loading');

  function reveal() {
    img.classList.add('loaded');
    if (container) container.classList.remove('loading');
  }

  if (img.complete && img.naturalWidth > 0) {
    reveal();
  } else {
    img.addEventListener('load', reveal);
    img.addEventListener('error', reveal);
  }
});

// ============ Skeleton loading: hero background ============
document.querySelectorAll('.hero, .page-hero-image').forEach(hero => {
  const match = hero.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!match) return;
  const src = match[1];

  hero.classList.add('bg-loading');
  const preload = new Image();
  preload.onload = () => hero.classList.remove('bg-loading');
  preload.onerror = () => hero.classList.remove('bg-loading');
  preload.src = src;
});

// ============ Lightbox ============
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxClose = lightbox.querySelector('.lightbox-close');

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      openLightbox(trigger.dataset.src, trigger.dataset.caption);
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);

  // Click outside the image (on the dark backdrop) closes it
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Escape key closes it
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

// ============ Reveal on scroll ============
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ============ Enquiry form handling ============
// Forms submit via mailto + prefilled WhatsApp link, since this is a static
// site with no backend. Christelle receives the enquiry either way.
function handleEnquiryForm(formId, subjectPrefix) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const data = new FormData(form);
    const lines = [];
    for (const [key, value] of data.entries()) {
      if (!value) continue;
      lines.push(`${key}: ${value}`);
    }

    const bodyText = lines.join('\n');
    const subject = encodeURIComponent(`${subjectPrefix} — ${data.get('name') || 'New Enquiry'}`);
    const body = encodeURIComponent(bodyText);

    // Open mail client with prefilled enquiry
    window.location.href = `mailto:hello@lagrandemaisonseychelles.sc?subject=${subject}&body=${body}`;

    // Show on-page confirmation
    const successEl = form.parentElement.querySelector('.form-success');
    form.style.display = 'none';
    if (successEl) successEl.classList.add('show');
  });
}

handleEnquiryForm('events-form', 'Private / Corporate Event Enquiry');
handleEnquiryForm('wedding-form', 'Wedding Enquiry');
handleEnquiryForm('contact-form', 'General Enquiry');
