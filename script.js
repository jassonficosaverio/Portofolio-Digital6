// ================== util ==================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tahun otomatis di footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ================== intro pembuka (hanya sekali per sesi) ==================
// Ikon muncul satu-satu -> teks sapaan diketik huruf demi huruf ->
// badge nama memudar masuk -> seluruh layar tersapu naik seperti tirai.
// Animasi ini hanya diputar sekali saat situs pertama kali dibuka di tab
// browser (dicek lewat sessionStorage) — berpindah menu/halaman lain
// tidak akan memutar ulang animasi ini, cukup transisi halaman biasa.
const INTRO_SESSION_KEY = 'jassonPortfolioIntroPlayed';
function readIntroFlag(){
  try { return sessionStorage.getItem(INTRO_SESSION_KEY) === '1'; }
  catch (e) { return false; }
}
function writeIntroFlag(){
  try { sessionStorage.setItem(INTRO_SESSION_KEY, '1'); }
  catch (e) { /* sessionStorage tidak tersedia (mis. dibuka lewat file://) — abaikan */ }
}
const introAlreadyPlayed = readIntroFlag();
const intro = document.getElementById('siteIntro');

if (intro) {
  if (prefersReducedMotion || introAlreadyPlayed) {
    intro.remove();
  } else {
    const introIcons = Array.from(intro.querySelectorAll('.intro-icon'));
    const line1El = document.getElementById('introLine1');
    const line2El = document.getElementById('introLine2');
    const cursorEl = document.getElementById('introCursor');
    const urlEl = intro.querySelector('.intro-url');
    const line1Text = 'Welcome to my';
    const line2Text = 'Portfolio';
    let finished = false;

    function typeLine(el, text, delay, onDone){
      let i = 0;
      (function step(){
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          i++;
          setTimeout(step, delay);
        } else if (onDone) {
          onDone();
        }
      })();
    }

    function leaveIntro(){
      if (finished || !intro.isConnected) return;
      finished = true;
      writeIntroFlag();
      intro.classList.add('is-leaving');
      setTimeout(() => {
        intro.classList.add('is-hidden');
        setTimeout(() => intro.remove(), 500);
      }, 850);
    }

    function runIntroSequence(){
      introIcons.forEach((icon, i) => {
        setTimeout(() => icon.classList.add('is-visible'), 150 * (i + 1));
      });
      setTimeout(() => {
        typeLine(line1El, line1Text, 42, () => {
          if (cursorEl) line2El.after(cursorEl); // pindahkan kursor ke akhir baris 2
          typeLine(line2El, line2Text, 42, () => {
            setTimeout(() => {
              if (urlEl) urlEl.classList.add('is-visible');
              setTimeout(leaveIntro, 750);
            }, 200);
          });
        });
      }, 650);
    }

    runIntroSequence();
    // jaga-jaga kalau ada yang gagal / macet
    setTimeout(leaveIntro, 6000);
  }
}

// ================== transisi halus antar halaman ==================
// Situs ini multi-halaman (bukan SPA), jadi supaya perpindahan menu
// terasa halus (bukan lompatan/reload kaku), konten memudar & bergeser
// naik-turun sebelum & sesudah berpindah halaman.
(function setupRouteTransitions(){
  const ROUTE_TRANSITION_MS = 380;

  function revealPage(){
    document.body.classList.remove('route-leaving');
    // beri satu frame supaya class awal (route-transition) sempat
    // ter-render dulu, baru dilepas -> transisi CSS benar-benar terpicu.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove('route-transition');
      });
    });
  }

  function isSameOriginPageLink(a){
    if (!a || !a.getAttribute) return false;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (a.hasAttribute('download')) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    let url;
    try { url = new URL(href, window.location.href); }
    catch (e) { return false; }
    if (url.origin !== window.location.origin) return false;
    // link ke halaman yang sama persis (tanpa hash baru) tidak perlu dianimasikan
    if (url.pathname === window.location.pathname && !url.hash) return false;
    return true;
  }

  function goTo(href){
    if (prefersReducedMotion) { window.location.href = href; return; }
    document.body.classList.add('route-leaving');
    setTimeout(() => { window.location.href = href; }, ROUTE_TRANSITION_MS);
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isSameOriginPageLink(a)) return;
    e.preventDefault();
    goTo(a.getAttribute('href'));
  });

  window.addEventListener('pageshow', revealPage);
  revealPage();
})();

// ================== menu mobile ==================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ================== navbar: highlight halaman aktif ==================
// Karena situs kini terdiri dari beberapa halaman terpisah (bukan satu halaman
// dengan scroll-spy), status aktif ditentukan dari atribut data-page di <body>.
const navAnchors = Array.from(document.querySelectorAll('.nav-links a[data-nav]'));
const navIndicator = document.getElementById('navIndicator');
const currentPage = document.body.dataset.page;

function moveIndicatorTo(link){
  if (!link || !navIndicator) return;
  navIndicator.style.left = link.offsetLeft + 'px';
  navIndicator.style.width = link.offsetWidth + 'px';
}

function setActiveNav(){
  navAnchors.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === currentPage));
  moveIndicatorTo(navAnchors.find((a) => a.dataset.nav === currentPage));
}

if (navAnchors.length) {
  setActiveNav();
  // pastikan posisi terukur dengan benar setelah font/layout siap
  requestAnimationFrame(setActiveNav);
  window.addEventListener('resize', setActiveNav);
}

// navbar mengambang: sedikit "mengetat" saat halaman discroll
const navbarEl = document.getElementById('navbar');
if (navbarEl) {
  const updateNavbarState = () => navbarEl.classList.toggle('is-condensed', window.scrollY > 12);
  updateNavbarState();
  window.addEventListener('scroll', updateNavbarState, { passive: true });
}

// ================== scroll reveal (satu momen halus per section) ==================
document.querySelectorAll('.section-head, .about-grid, .hero-text').forEach((el) => el.classList.add('reveal'));
if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

// ================== teks peran berganti (hero) ==================
const roles = ['Kelas XI', 'Belajar Jaringan', 'Eksplorasi AI', 'Calon Praktisi TKJ'];
const roleEl = document.getElementById('roleCycle');
if (roleEl) {
  let roleIndex = 0;
  roleEl.style.transition = 'opacity .25s ease';
  if (!prefersReducedMotion) {
    setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleEl.style.opacity = 0;
      setTimeout(() => {
        roleEl.textContent = roles[roleIndex];
        roleEl.style.opacity = 1;
      }, 250);
    }, 2600);
  }
}

// ================== kartu ID gantung — gerak halus & bebas arah ==================
// Alih-alih transform langsung 1:1 mengikuti pointer (terasa patah-patah dan
// cuma berputar berdasar sumbu X), posisi kartu di-lerp tiap frame lewat
// requestAnimationFrame supaya gerakannya empuk, dan sekarang bergerak di
// sumbu X *dan* Y sekaligus (bukan cuma rotasi).
const cardWrap = document.getElementById('idCardWrap');
if (cardWrap) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let targetX = 0, targetY = 0;      // posisi yang dituju
  // posisi awal sengaja dimulai agak jauh dari titik diam supaya kartu
  // terlihat "berayun masuk" dengan halus saat halaman pertama dimuat,
  // bukan langsung diam di tempat.
  let curX = -130, curY = -46;       // posisi halus saat ini (hasil lerp)
  let swingPhase = Math.random() * Math.PI * 2;
  let rafId = null;

  function pointerPos(e){
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function startDrag(e){
    isDragging = true;
    const p = pointerPos(e);
    startX = p.x; startY = p.y;
    cardWrap.classList.add('is-dragging');
  }
  function duringDrag(e){
    if (!isDragging) return;
    const p = pointerPos(e);
    const dx = p.x - startX;
    const dy = p.y - startY;
    targetX = Math.max(-140, Math.min(140, dx * 0.55));
    targetY = Math.max(-60, Math.min(70, dy * 0.4));
  }
  function endDrag(){
    if (!isDragging) return;
    isDragging = false;
    cardWrap.classList.remove('is-dragging');
  }

  cardWrap.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', duringDrag);
  window.addEventListener('mouseup', endDrag);
  cardWrap.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', duringDrag, { passive: true });
  window.addEventListener('touchend', endDrag);

  function tick(){
    if (!isDragging) {
      // ayunan idle yang lembut ke berbagai arah saat tidak diseret
      swingPhase += 0.012;
      targetX = Math.sin(swingPhase) * 9;
      targetY = Math.sin(swingPhase * 1.35) * 4;
    }
    // damping / lerp — inilah yang bikin gerakannya halus, bukan patah-patah
    const ease = isDragging ? 0.16 : 0.075;
    curX += (targetX - curX) * ease;
    curY += (targetY - curY) * ease;
    const rotation = Math.max(-26, Math.min(26, curX / 5.2));
    cardWrap.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`;
    rafId = requestAnimationFrame(tick);
  }

  if (prefersReducedMotion) {
    cardWrap.style.transform = 'none';
  } else {
    rafId = requestAnimationFrame(tick);
  }
}

// ================== tab switch portofolio ==================
const tabSwitch = document.getElementById('tabSwitch');
if (tabSwitch) {
  const tabIndicator = document.getElementById('tabIndicator');
  const tabButtons = Array.from(tabSwitch.querySelectorAll('.tab-btn'));

  function moveTabIndicator(btn){
    if (!btn || !tabIndicator) return;
    tabIndicator.style.left = btn.offsetLeft + 'px';
    tabIndicator.style.width = btn.offsetWidth + 'px';
  }

  function activateTab(tabName){
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (!targetPanel || targetPanel.classList.contains('is-active')) return;

    tabButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tabName));
    moveTabIndicator(tabButtons.find((b) => b.dataset.tab === tabName));

    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('is-active'));
    // restart animasi CSS meski nama class sama, supaya transisinya
    // selalu terpicu ulang dan terasa halus tiap kali tab diganti.
    targetPanel.classList.remove('is-active');
    void targetPanel.offsetWidth; // paksa reflow
    targetPanel.classList.add('is-active');
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  window.addEventListener('resize', () => {
    moveTabIndicator(tabButtons.find((b) => b.classList.contains('is-active')));
  });
  requestAnimationFrame(() => moveTabIndicator(tabButtons[0]));
}

// ================== detail proyek (expand/collapse) ==================
document.querySelectorAll('.project-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.project-card');
    const isOpen = card.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.firstChild.textContent = isOpen ? 'Sembunyikan detail ' : 'Lihat detail ';
  });
});

// ================== angka statistik naik ==================
const statNums = document.querySelectorAll('.stat-num');
if (statNums.length) {
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    if (prefersReducedMotion || target === 0) { el.textContent = target; return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 30);
  };
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  statNums.forEach((el) => statObserver.observe(el));
}

// ===== GALERI & LIGHTBOX =====
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
if (galleryItems.length) {
  const galleryCount = document.getElementById('galleryCount');

  galleryItems.forEach((item, i) => item.setAttribute('data-index', i + 1));

  function updateGalleryCount() {
    const filled = galleryItems.filter((item) => {
      const src = item.querySelector('img').getAttribute('src');
      const has = !!(src && src.trim() !== '');
      item.classList.toggle('has-photo', has);
      return has;
    }).length;
    if (galleryCount) galleryCount.textContent = `${filled} foto`;
  }
  updateGalleryCount();

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let filledItems = [];
  let currentIndex = 0;

  function openLightbox(index) {
    filledItems = galleryItems.filter((item) => {
      const src = item.querySelector('img').getAttribute('src');
      return src && src.trim() !== '';
    });
    currentIndex = filledItems.findIndex((item) => item === galleryItems[index]);
    if (currentIndex === -1) return;
    showLightboxImage();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function showLightboxImage() {
    const img = filledItems[currentIndex].querySelector('img');
    lightboxImg.src = img.getAttribute('src');
    lightboxImg.alt = img.getAttribute('alt') || '';
    lightboxCaption.textContent = img.getAttribute('data-caption') || '';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + filledItems.length) % filledItems.length;
    showLightboxImage();
  });
  if (lightboxNext) lightboxNext.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % filledItems.length;
    showLightboxImage();
  });
  if (lightbox) {
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev.click();
      if (e.key === 'ArrowRight') lightboxNext.click();
    });
  }
}

// ================== kelopak dekoratif ==================
const petalLayer = document.getElementById('petalLayer');
if (petalLayer && !prefersReducedMotion) {
  const totalPetals = 10;
  for (let i = 0; i < totalPetals; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = 10 + Math.random() * 9 + 's';
    petal.style.animationDelay = Math.random() * 10 + 's';
    petal.style.opacity = 0.2 + Math.random() * 0.3;
    petalLayer.appendChild(petal);
  }
}

// ================== form kontak -> mailto ==================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get('name');
    const email = data.get('email');
    const message = data.get('message');
    const subject = encodeURIComponent(`Pesan dari ${name} lewat portofolio`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:jassonficosaverio@gmail.com?subject=${subject}&body=${body}`;
  });
}

// ================== komentar / buku tamu ==================
const commentForm = document.getElementById('commentForm');
if (commentForm) {
  const commentList = document.getElementById('commentList');
  const commentImageInput = document.getElementById('commentImage');
  const uploadLabel = document.getElementById('uploadLabel');

  let comments = [
    { name: 'Jasson Fico Saverio', text: 'Terima kasih sudah mampir di portofolio aku!', pinned: true, image: null },
  ];

  function initials(name){
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
  }

  function renderComments(){
    commentList.innerHTML = '';
    const sorted = [...comments].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    sorted.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'comment-item' + (c.pinned ? ' is-pinned' : '');
      item.innerHTML = `
        <div class="comment-item-head">
          <span class="comment-avatar">${initials(c.name)}</span>
          <span class="comment-name">${c.name}</span>
          ${c.pinned ? '<span class="comment-pin">📌 disematkan</span>' : ''}
        </div>
        <p class="comment-text"></p>
      `;
      item.querySelector('.comment-text').textContent = c.text;
      if (c.image) {
        const img = document.createElement('img');
        img.src = c.image;
        img.className = 'comment-image';
        img.alt = `Lampiran dari ${c.name}`;
        item.appendChild(img);
      }
      commentList.appendChild(item);
    });
  }
  renderComments();

  if (commentImageInput) {
    commentImageInput.addEventListener('change', () => {
      const file = commentImageInput.files[0];
      uploadLabel.textContent = file ? `📎 ${file.name}` : '📎 Lampirkan gambar (opsional)';
    });
  }

  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(commentForm);
    const name = (data.get('name') || '').toString().trim();
    const text = (data.get('comment') || '').toString().trim();
    if (!name || !text) return;

    const file = commentImageInput ? commentImageInput.files[0] : null;
    const pushComment = (imageUrl) => {
      comments.push({ name, text, pinned: false, image: imageUrl || null });
      renderComments();
      commentForm.reset();
      if (uploadLabel) uploadLabel.textContent = '📎 Lampirkan gambar (opsional)';
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = () => pushComment(reader.result);
      reader.readAsDataURL(file);
    } else {
      pushComment(null);
    }
  });
}
