/* ============================================================
   CURSOR
   ============================================================ */
(function () {
  const dot = document.getElementById('cursor-dot');
  if (!dot) return;

  let mx = -100, my = -100;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });

  document.querySelectorAll('a, button, [data-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('hovering'));
    el.addEventListener('mouseleave', () => dot.classList.remove('hovering'));
  });
})();

/* ============================================================
   NAV — MOBILE MENU
   ============================================================ */
(function () {
  const burger = document.querySelector('.nav-burger');
  const menu   = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
      burger.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

/* ============================================================
   SMOOTH SCROLL — WORKS LINK
   ============================================================ */
document.querySelectorAll('a[href="#works"]').forEach(a => {
  a.addEventListener('click', e => {
    const sec = document.getElementById('works');
    if (sec) { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ============================================================
   TYPING ANIMATION
   ============================================================ */
(function () {
  const container = document.getElementById('typing-word');
  if (!container) return;

  const words  = (container.dataset.words || '').split('|').map(w => w.trim()).filter(Boolean);
  const colors = (container.dataset.colors || '').split('|');
  const caret  = container.querySelector('.typing-caret');

  let wi = 0, displayed = '', phase = 'typing';
  const TYPE_SPEED = 60, PAUSE_HOLD = 1200, PAUSE_CLEAR = 300;
  let timer;

  function tick() {
    clearTimeout(timer);
    const word  = words[wi % words.length] || '';
    const color = colors[wi % colors.length] || '#000';
    container.style.color = color;
    if (caret) caret.style.backgroundColor = color;

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        displayed = word.slice(0, displayed.length + 1);
        renderText();
        timer = setTimeout(tick, TYPE_SPEED);
      } else {
        phase = 'holding';
        timer = setTimeout(tick, PAUSE_HOLD);
      }
    } else if (phase === 'holding') {
      phase = 'clearing';
      tick();
    } else if (phase === 'clearing') {
      if (displayed.length > 0) {
        displayed = '';
        renderText();
        timer = setTimeout(tick, PAUSE_CLEAR);
      } else {
        wi = (wi + 1) % Math.max(words.length, 1);
        phase = 'typing';
        timer = setTimeout(tick, 80);
      }
    }
  }

  function renderText() {
    const textNode = container.querySelector('.typing-text');
    if (textNode) textNode.textContent = displayed;
  }

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else tick();
  });

  tick();
})();

/* ============================================================
   ARC CAROUSEL — a from-scratch (plain HTML/CSS/JS, no Framer, no
   carousel library) port of the actual mechanics used by the Framer
   "Arc Carousel" component (framer.com/m/Arc-Carousel, Free Spin
   mode) — reverse-engineered from its published source.

   HOW IT WORKS
   Cards aren't moved with translate(x,y) math. Each card is just
   rotated with a plain CSS rotate(), but around a pivot point far
   below itself (`transform-origin: center <radius>px`) — like a
   clock hand pinned <radius>px beneath the card, swinging it through
   a circular arc as the angle changes. A big radius makes a wide,
   shallow arc; a small one makes a tight, deep curve.

   The 7 real images aren't used just once — they're repeated enough
   times (see `count` below) to fill a long angular strip (at least
   ARC_CONFIG.minDegrees * 2.5 degrees' worth of card slots). That's
   what makes the loop genuinely seamless: there's always a dense run
   of cards flowing through the visible window, so nothing ever has
   to be individually teleported into place.

   One continuously-growing `rotation` value drives everything; each
   card just reads its own fixed offset from it and gets wrapped into
   range with a modulo — no per-card special-casing.

   All of this is built once, up front (cloning the 7 authored
   template cards into the full repeated strip). The animation loop
   itself only writes transform/opacity/z-index on those existing
   elements every frame — nothing is ever created or removed while
   it's running, so this stays cheap regardless of how long it plays.

   TO CUSTOMIZE: edit ARC_CONFIG below. Nothing else in this file
   needs to change.
   ============================================================ */
(function () {
  const stage = document.querySelector('.arc-stage');
  const track = document.querySelector('.arc-track');
  if (!stage || !track) return;

  const templateCards = Array.from(track.querySelectorAll('.arc-card'));
  if (templateCards.length === 0) return;

  /* ---------- ARC_CONFIG — the only part you should need to edit ---------- */
  const ARC_CONFIG = {
    radius: 1200,         // "Curve" — pivot distance in px. Bigger = wider & flatter arc, smaller = tighter & deeper.
    spacing: 16,            // "Gap" — degrees between one card's slot and the next.
    speed: 2.5,             // degrees/second the arc spins — small number = slow & subtle.
    direction: 'left',     // 'left' or 'right' — which way the arc spins.
    frameAngle: 22,         // the responsive width/scale is calibrated so a card at this angle just touches the
                            // container's edges. Cards past this keep swinging out/dipping lower toward the footer.
    fadeSpan: 25,           // degrees PAST frameAngle over which a card gently fades out (never a hard on/off —
                            // that's what caused the old "popping" — it's a slow dissolve into the dark footer).
    cullAngle: 55,          // degrees past which a card is display:none'd. By here it's long since faded to 0
                            // opacity, so this is invisible — it only exists to stop the handful of cards that
                            // would otherwise swing round toward the far side of the circle (and dip a huge,
                            // page-breaking amount) from affecting layout at all.
    minDegrees: 240,        // the 7 cards repeat enough times to cover minDegrees*2.5 of angle, keeping the flow dense.
    cardWidth: 260,         // reference card size in px at full (desktop) scale.
    cardHeight: 380,

    // Swap these for real photos any time — a missing/broken file just
    // keeps showing that card's pastel placeholder, nothing else breaks.
    // Order matches the 7 .arc-card templates in index.html: Places,
    // Illustrations, Clay & Making, Crafting, Books, Rangoli, Embroidery.
    images: [
      'assets/images/travel.jpeg',
      'assets/images/illustrations.jpg',
      'assets/images/fridge-magnet.jpg',
      'assets/images/craft.jpg',
      'assets/images/books.jpg',
      'assets/images/rangoli.jpg',
      'assets/images/embroidery.jpg',
    ],
  };
  /* ---------- end ARC_CONFIG ---------- */

  const dirSign = ARC_CONFIG.direction === 'right' ? 1 : -1;

  // Repeat the 7 template cards until the strip covers minDegrees*2.5
  // of angle (e.g. 7 cards at 18deg spacing repeat 5x into a 35-card,
  // 630deg strip) — done once, up front.
  let count = 0;
  while (count * ARC_CONFIG.spacing < ARC_CONFIG.minDegrees * 2.5) count += templateCards.length;
  if (count === templateCards.length) count += templateCards.length;
  const totalArc = count * ARC_CONFIG.spacing;

  const cards = [];
  for (let i = 0; i < count; i++) {
    const clone = templateCards[i % templateCards.length].cloneNode(true);
    track.appendChild(clone);
    cards.push(clone);
  }
  templateCards.forEach((el) => el.remove());

  // Load each card's image once, up front — never touched again during
  // the animation loop. Failure just leaves the CSS pastel background showing.
  cards.forEach((card, i) => {
    const src = ARC_CONFIG.images[i % ARC_CONFIG.images.length];
    const media = card.querySelector('.arc-card-media');
    if (!src || !media) return;
    const img = new Image();
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    // NOTE: deliberately no loading="lazy" here — this image isn't in the
    // document yet (it only gets appended once loaded, see onload below),
    // and lazy-loading a detached <img> makes some browsers defer the
    // fetch indefinitely since there's no viewport position to judge it by.
    img.onload = () => media.appendChild(img);
    img.src = src; // onerror intentionally does nothing — placeholder stays visible
  });

  const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');

  let rotation = 0;     // single continuously-growing value every card reads its offset from
  let lastTs = null;
  let rafId = null;
  let scaleFactor = 1;  // responsive scale-down applied to card size + radius

  function applyLayout() {
    const containerWidth = stage.clientWidth;
    const frameRad = (ARC_CONFIG.frameAngle * Math.PI) / 180;
    // Scale is calibrated so a card at frameAngle just touches the
    // container's edges — wider-than-that cards keep going, swinging
    // further out and dipping lower (uncapped, see renderCards).
    const frameWidth = 2 * ARC_CONFIG.radius * Math.sin(frameRad) + ARC_CONFIG.cardWidth;
    scaleFactor = containerWidth > 0 ? Math.min(1, containerWidth / frameWidth) : 1;

    const cw = ARC_CONFIG.cardWidth * scaleFactor;
    const ch = ARC_CONFIG.cardHeight * scaleFactor;
    const radiusPx = ARC_CONFIG.radius * scaleFactor;

    track.style.width = `${frameWidth * scaleFactor}px`;
    // Deliberately NOT sized to fit the outer cards' dip — only the
    // (undipped) centre card's height plus a little breathing room.
    // The outer cards are taller-reaching than this box and are meant
    // to spill past it, down into the footer below; .arc-section and
    // .arc-stage both allow that overflow (overflow:visible), and the
    // footer (opaque, later in the DOM) simply paints over whatever
    // dips into its space — no opacity change involved.
    track.style.height = `${ch + 24}px`;

    cards.forEach((card) => {
      card.style.width = `${cw}px`;
      card.style.height = `${ch}px`;
      card.style.borderRadius = `${Math.max(8, 16 * scaleFactor)}px`;
      // The pivot sits radiusPx below the card's own (untransformed)
      // top edge — this, not a separate x/y formula, is what bends
      // the whole strip into a circular arc as each card rotates.
      card.style.transformOrigin = `center ${radiusPx}px`;
    });
  }

  function renderCards() {
    const fadeStart = ARC_CONFIG.frameAngle;
    const fadeEnd = ARC_CONFIG.frameAngle + ARC_CONFIG.fadeSpan;

    for (let i = 0; i < count; i++) {
      const card = cards[i];
      let angle = (i * ARC_CONFIG.spacing + rotation) % totalArc;
      if (angle > totalArc / 2) angle -= totalArc;
      else if (angle < -totalArc / 2) angle += totalArc;
      const absAngle = Math.abs(angle);

      if (absAngle > ARC_CONFIG.cullAngle) {
        // Long since faded to nothing — fully remove it from layout so
        // it can't stretch the page (this is a handful of the 35 cards,
        // the ones currently swinging round toward the far side of the
        // circle). Not visible, so this never causes a pop.
        if (card.style.display !== 'none') card.style.display = 'none';
        continue;
      }
      if (card.style.display === 'none') card.style.display = '';

      // Gentle, gradual fade — never a hard on/off — so a card visually
      // dissolves into the dark footer as it dips, rather than blinking
      // in or out of existence.
      const opacity = absAngle <= fadeStart
        ? 1
        : Math.max(0, 1 - (absAngle - fadeStart) / (fadeEnd - fadeStart));

      card.style.opacity = String(opacity);
      card.style.zIndex = Math.round(1000 - absAngle);
      // translate(-50%,-50%) centres the card on the stage's middle
      // point; rotate() then swings it around transformOrigin above.
      card.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
  }

  function loop(ts) {
    const speed = reducedMotionMql.matches ? 0 : ARC_CONFIG.speed;
    if (speed > 0) {
      const dt = lastTs === null ? 0 : ts - lastTs;
      rotation += (dirSign * speed * dt) / 1000;
    }
    lastTs = ts;
    renderCards();
    rafId = requestAnimationFrame(loop);
  }

  // Pause the rAF loop whenever it wouldn't be doing anything useful —
  // tab in the background, or this section scrolled well out of view.
  // Scrolling through the rest of the site (hero, projects, about...)
  // shouldn't be competing with 42 cards' worth of trig + style writes
  // every frame for no visible benefit; this is what keeps scrolling
  // smooth everywhere else on the page.
  let tabVisible = !document.hidden;
  let sectionVisible = false;

  function syncLoop() {
    const shouldRun = tabVisible && sectionVisible;
    if (shouldRun && rafId === null) {
      lastTs = null;
      rafId = requestAnimationFrame(loop);
    } else if (!shouldRun && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    tabVisible = !document.hidden;
    syncLoop();
  });

  const io = new IntersectionObserver(
    (entries) => {
      sectionVisible = entries[0].isIntersecting;
      syncLoop();
    },
    { rootMargin: '200px 0px' } // start/keep animating a little before it scrolls into view
  );
  io.observe(stage);

  const ro = new ResizeObserver(() => {
    applyLayout();
    renderCards();
  });
  ro.observe(stage);

  applyLayout();
  renderCards();
})();

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
})();
