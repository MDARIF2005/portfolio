const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// ============ Footer year ============
document.getElementById('year').textContent = new Date().getFullYear();

// ============ Scroll-linked 3D fly-in ============
// Cards start pushed back in depth, tilted, and slide in as you scroll.
const flyEls = [...document.querySelectorAll('.fly')];
flyEls.forEach((el, i) => {
  el.dataset.dir = i % 2 ? 1 : -1;
  el._rx = 0;   // pointer tilt (desktop)
  el._ry = 0;
});

const progress = document.getElementById('progress');
const navbar = document.getElementById('navbar');
const bgGrid = document.querySelector('.bg-grid');
const aurora = document.querySelectorAll('.aurora span');
const contactWord = document.querySelector('.contact-word');
const contactSection = document.getElementById('contact');

// Each card has a signed "flight" value k:
//   k > 0  card is still below, it flies up into place as you scroll down
//   k < 0  card is above, it drops down into place as you scroll back up
//   k = 0  card is settled
// The card eases toward its target, so the flight is smooth and a little slow.
const easeOut = p => 1 - Math.pow(1 - p, 3);
const clamp01 = v => Math.min(Math.max(v, 0), 1);

// offsetTop ignores CSS transforms, so the card's own movement never feeds back into the maths
function layoutTop(el) {
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  return y;
}

function applyFly(el) {
  const k = el._k || 0;
  const a = Math.abs(k);
  const d = Number(el.dataset.dir);
  const travel = window.innerWidth < 768 ? 0.5 : 1;

  const tx = d * -130 * a * travel;
  const ty = 110 * k * travel;
  const tz = -320 * a;
  const rx = 38 * k + el._rx;
  const ry = -d * 24 * a + el._ry;
  const s = 1 - 0.14 * a;

  el.style.transform =
    `perspective(1400px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
  el.style.opacity = (1 - 0.8 * a).toFixed(3);
}

let flyRaf = 0;
function flyLoop() {
  let moving = false;
  for (const el of flyEls) {
    const diff = el._kt - el._k;
    if (Math.abs(diff) > 0.0008) {
      el._k += diff * 0.1;          // lower number = slower, floatier flight
      moving = true;
      applyFly(el);
    } else if (el._k !== el._kt) {
      el._k = el._kt;
      applyFly(el);
    }
  }
  flyRaf = moving ? requestAnimationFrame(flyLoop) : 0;
}

function renderFly() {
  if (reduceMotion) return;
  const vh = window.innerHeight;
  const y = window.scrollY;
  const botStart = vh * 1.0;    // card starts flying in when its top reaches the bottom edge
  const botEnd = vh * 0.36;     // and has settled when its top reaches 36% of the screen
  const topSettled = vh * 0.04; // card is settled until its top passes the top edge
  const topGone = -vh * 0.25;   // and has fully "left" 25% of a screen above it

  for (const el of flyEls) {
    const top = layoutTop(el) - y;
    let k = 0;
    if (top > botEnd) {
      k = 1 - easeOut(clamp01((botStart - top) / (botStart - botEnd)));
    } else if (top < topSettled) {
      k = -(1 - easeOut(clamp01((top - topGone) / (topSettled - topGone))));
    }
    el._kt = k;
    if (el._k === undefined) { el._k = k; applyFly(el); }   // first pass: snap, don't animate from zero
  }
  if (!flyRaf) flyRaf = requestAnimationFrame(flyLoop);
}

// ============ One rAF-throttled scroll handler ============
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    navbar.classList.toggle('scrolled', y > 40);
    if (bgGrid) bgGrid.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
    if (aurora[0] && !reduceMotion) {
      aurora[0].style.marginTop = (y * 0.08) + 'px';
      aurora[1].style.marginBottom = (y * -0.06) + 'px';
    }
    // Big outlined word in the contact section drifts up as the section scrolls into view
    if (contactWord && !reduceMotion) {
      const r = contactSection.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight + r.height), 0), 1);
      contactWord.style.setProperty('--py', (80 - p * 130) + 'px');
    }
    renderFly();
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// ============ Pointer tilt on cards (desktop only) ============
if (!reduceMotion && finePointer) {
  flyEls.forEach(card => {
    const max = card.classList.contains('project') ? 4 : 6;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card._ry = (px - 0.5) * max * 2;
      card._rx = (0.5 - py) * max * 2;
      applyFly(card);
    });
    card.addEventListener('mouseleave', () => {
      card._rx = 0;
      card._ry = 0;
      applyFly(card);
    });
  });
}

// ============ Mobile menu ============
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const iconOpen = document.getElementById('icon-open');
const iconClose = document.getElementById('icon-close');
function setMenu(open) {
  mobileMenu.classList.toggle('hidden', !open);
  iconOpen.classList.toggle('hidden', open);
  iconClose.classList.toggle('hidden', !open);
}
menuBtn.addEventListener('click', () => setMenu(mobileMenu.classList.contains('hidden')));
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => setMenu(false)));

// ============ Active nav link ============
const navLinks = document.querySelectorAll('.nav-link');
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

// ============ Headings: split into words so each one rises out of a mask ============
document.querySelectorAll('h1.reveal, main h2.reveal').forEach(el => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.classList.remove('reveal');
  el.classList.add('split');
  el.textContent = '';
  const words = text.split(/\s+/);
  words.forEach((word, i) => {
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.textContent = word;
    inner.style.setProperty('--i', i);
    w.appendChild(inner);
    el.appendChild(w);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
});

// ============ Reveal text blocks and headings ============
const revealObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .split').forEach(el => revealObs.observe(el));

// ============ Count-up numbers ============
const counters = document.querySelectorAll('[data-count]');
if (!reduceMotion) counters.forEach(el => { el.textContent = (0).toFixed(Number(el.dataset.dec || 0)); });
const countObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    obs.unobserve(e.target);
    const el = e.target;
    const end = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.dec || 0);
    if (reduceMotion) { el.textContent = end.toFixed(dec); return; }
    const t0 = performance.now();
    const dur = 1400;
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}, { threshold: 0.6 });
counters.forEach(el => countObs.observe(el));

// ============ Cursor effects (desktop only) ============
if (finePointer && !reduceMotion) {
  // Highlight that follows the pointer inside each card
  document.querySelectorAll('.card, .project').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Faint warm glow that trails the cursor across the page
  const glow = document.getElementById('cursor-glow');
  let gx = 0, gy = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; });
  document.addEventListener('mouseleave', () => { glow.style.opacity = 0; });
  (function follow() {
    gx += (tx - gx) * 0.1;
    gy += (ty - gy) * 0.1;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    requestAnimationFrame(follow);
  })();
}

// ============ Contact form ============
// Use Formspree, Web3Forms, or FormSubmit.
// If you create a free form on Formspree (https://formspree.io), paste your form ID below:
const FORMSPREE_ID = ''; // e.g. 'mbljzkpq'
// Or if you get a Web3Forms access key (https://web3forms.com), paste it here:
const WEB3FORMS_KEY = ''; // e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
const CONTACT_EMAIL = 'arifsmart2005@gmail.com';

const form = document.getElementById('contact-form');
if (form) {
  const note = document.getElementById('form-note');
  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultNote = note.textContent;
  const fields = [...form.querySelectorAll('[required]')];

  fields.forEach(f => f.addEventListener('input', () => f.classList.remove('invalid')));

  const setNote = (text, state) => {
    note.textContent = text;
    note.dataset.state = state || '';
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();

    let firstBad = null;
    fields.forEach(f => {
      const ok = f.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) : f.value.trim() !== '';
      f.classList.toggle('invalid', !ok);
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      setNote('Please fill in the highlighted fields.', 'error');
      firstBad.focus();
      return;
    }

    const el = form.elements;
    const name = el['name'].value.trim();
    const email = el['email'].value.trim();
    const message = el['message'].value.trim();
    const subject = el['subject'].value.trim() || `Portfolio enquiry from ${name}`;

    // Hidden honeypot field: real visitors leave it empty, bots fill it in
    if (el['_honey'] && el['_honey'].value) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    setNote('Sending your message...', '');

    try {
      let endpoint = '';
      let bodyData = {};

      if (FORMSPREE_ID) {
        endpoint = `https://formspree.io/f/${FORMSPREE_ID}`;
        bodyData = { name, email, subject, message };
      } else if (WEB3FORMS_KEY) {
        endpoint = 'https://api.web3forms.com/submit';
        bodyData = { access_key: WEB3FORMS_KEY, name, email, subject, message };
      } else {
        endpoint = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
        bodyData = {
          name,
          email,
          _subject: subject,
          _replyto: email,
          message,
          _template: 'table',
          _captcha: 'false'
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === 'false' || data.success === false) {
        throw new Error(data.message || 'Service unavailable');
      }

      form.reset();
      setNote('Thank you! Your message has been sent successfully.', 'ok');
    } catch (err) {
      console.error('Contact form error:', err);
      setNote('Unable to send message. Please email directly to arifsmart2005@gmail.com.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      setTimeout(() => setNote(defaultNote, ''), 9000);
    }
  });
}

// ============ Copy email ============
const copyBtn = document.getElementById('copy-mail');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const email = 'arifsmart2005@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
    } catch (_) {
      const t = document.createElement('textarea');
      t.value = email;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch (__) {}
      t.remove();
    }
    const label = copyBtn.querySelector('span');
    label.textContent = 'Copied';
    setTimeout(() => { label.textContent = 'Copy email'; }, 1800);
  });
}

// ============ Typewriter ============
const phrases = ['AI & ML Developer', 'Full-Stack Web Developer', 'Android App Developer'];
const typedEl = document.getElementById('typed');
if (reduceMotion) {
  typedEl.textContent = phrases[0];
} else {
  let pi = 0, ci = 0, del = false;
  (function tick() {
    const word = phrases[pi];
    typedEl.textContent = word.slice(0, ci);
    let wait = del ? 35 : 80;
    if (!del && ci === word.length) { wait = 1800; del = true; }
    else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 300; }
    else ci += del ? -1 : 1;
    setTimeout(tick, wait);
  })();
}

// ============ Hero 3D scene (muted, responsive) ============
(function heroScene() {
  const canvas = document.getElementById('hero-3d');
  if (!canvas || typeof THREE === 'undefined' || reduceMotion) return;

  const mobile = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 600 ? 19 : 14;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const core = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.4, 1),
    new THREE.MeshBasicMaterial({ color: 0xc9a66b, wireframe: true, transparent: true, opacity: 0.35 })
  );
  const inner = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.MeshBasicMaterial({ color: 0x6f9fb0, wireframe: true, transparent: true, opacity: 0.6 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.01, 8, 180),
    new THREE.MeshBasicMaterial({ color: 0xc9a66b, transparent: true, opacity: 0.25 })
  );
  ring.rotation.x = Math.PI / 2.6;
  core.add(outer, inner, ring);
  core.position.x = mobile ? 0 : 3.4;
  core.position.y = mobile ? 3 : 0;
  scene.add(core);

  const COUNT = mobile ? 450 : 1100;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0xd9dde5, size: 0.05, transparent: true, opacity: 0.45, depthWrite: false })
  );
  scene.add(particles);

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  if (finePointer) {
    window.addEventListener('mousemove', e => {
      target.x = (e.clientX / window.innerWidth - 0.5);
      target.y = (e.clientY / window.innerHeight - 0.5);
    });
  }

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  (function render() {
    requestAnimationFrame(render);
    if (!visible) return;
    const t = clock.getElapsedTime();

    current.x += (target.x - current.x) * 0.05;
    current.y += (target.y - current.y) * 0.05;

    core.rotation.y = t * 0.15 + current.x * 0.7;
    core.rotation.x = Math.sin(t * 0.25) * 0.15 + current.y * 0.4;
    outer.rotation.z = t * 0.08;
    inner.rotation.y = -t * 0.4;
    inner.rotation.x = t * 0.2;
    ring.rotation.z = t * 0.1;

    particles.rotation.y = t * 0.015 + current.x * 0.12;
    particles.position.y = -scrollY * 0.002;

    camera.position.x = current.x * 1.0;
    camera.position.y = -current.y * 0.6 - scrollY * 0.001;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  })();
})();