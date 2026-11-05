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

function renderFly() {
  if (reduceMotion) return;
  const vh = window.innerHeight;
  const mobile = window.innerWidth < 768;
  const travel = mobile ? 0.5 : 1;
  const start = vh * 0.98;   // starts when the card's top reaches the bottom of the screen
  const end = vh * 0.38;     // fully settled when its top reaches 38% of the screen

  for (const el of flyEls) {
    const r = el.getBoundingClientRect();
    let p = (start - r.top) / (start - end);
    p = Math.min(Math.max(p, 0), 1);
    const e = 1 - Math.pow(1 - p, 3);
    const k = 1 - e;
    const d = Number(el.dataset.dir);

    const tx = d * -130 * k * travel;
    const ty = 110 * k * travel;
    const tz = -320 * k;
    const rx = 38 * k + el._rx;
    const ry = -d * 24 * k + el._ry;
    const s = 0.86 + 0.14 * e;

    el.style.transform =
      `perspective(1400px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
    el.style.opacity = (0.2 + 0.8 * e).toFixed(3);
  }
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
      renderFly();
    });
    card.addEventListener('mouseleave', () => {
      card._rx = 0;
      card._ry = 0;
      renderFly();
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

// ============ Reveal text blocks ============
const revealObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

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