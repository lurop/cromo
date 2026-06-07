(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // ============================================================
  // Onboarding — guía de primera vez (Fase 0)
  // Capa de "coach marks": foco (spotlight) + flecha + tarjeta sobre un
  // elemento REAL. La guía nunca navega por el usuario: marca la tab/botón
  // que tiene que tocar y él hace el toque. Avanza observando el estado real
  // (ruta, sobres abiertos, repetidas), sin tocar la lógica de juego.
  // Mientras hay un cartel bloqueante: se bloquea el scroll y se centra el
  // objetivo para que quede bien encuadrado.
  // "Ya vi la guía" se guarda en localStorage (cache de UI, no dato de
  // cuenta — §4). En Fase 1 esto vivirá en el perfil de Supabase.
  // ============================================================

  const DONE_KEY = 'cromo_onboarding_v2';

  function isDone() {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch (e) { return false; }
  }
  function markDone() {
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) { /* modo privado: ignora */ }
  }
  function clearDone() {
    try { localStorage.removeItem(DONE_KEY); } catch (e) { /* noop */ }
  }

  function route() {
    const raw = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    return raw || 'album';
  }

  // Selectores de las tabs de navegación (las marcamos para que el usuario
  // toque él mismo, en vez de navegar por él).
  const TAB = (r) => `a[data-route="${r}"]`;

  // Pasos. `auto()` avanza solo (predicado sobre el estado real); `cta`
  // avanza por botón de la tarjeta SIN navegar (solo cambia de paso).
  const STEPS = {
    welcome: {
      kind: 'modal',
      eyebrow: 'Bienvenido',
      title: 'Empezá a coleccionar',
      body: 'En <b>Cromo</b> no se compran los sobres: se ganan. Abrís, completás tu álbum y las repetidas nunca se desperdician. Te marco el camino — vos tocás.',
      cta: { label: '¡Dale, empecemos!', go: () => go('go-sobres') }
    },

    'go-sobres': {
      kind: 'spot',
      target: TAB('sobres'),
      eyebrow: 'Paso 1 de 3',
      title: 'Andá a Sobres',
      body: 'Tocá <b>Sobres</b> en la barra de abajo para conseguir tu primer sobre.',
      auto: () => route() === 'sobres',
      next: 'open-pack'
    },

    'open-pack': {
      kind: 'spot',
      target: '[data-action="open-pack"]',
      allow: ['[data-action="open-pack"]', '[data-action="open-pack-5"]'],
      eyebrow: 'Paso 1 de 3',
      title: 'Abrí el sobre',
      body: 'Tocá <b>Abrir sobre</b>. Trae 5 figuritas: por cada una se sortea la rareza y te puede tocar una <b>legendaria</b>.',
      auto: () => C.state.owned.size > 0,
      next: 'go-album'
    },

    'go-album': {
      kind: 'spot',
      target: TAB('album'),
      eyebrow: 'Paso 2 de 3',
      title: 'Mirá tu álbum',
      body: 'Tus figuritas ya están guardadas. Tocá <b>Álbum</b> para verlas.',
      auto: () => route() === 'album',
      next: 'album-tour'
    },

    'album-tour': {
      kind: 'spot',
      target: '.pages',
      allow: ['.pages', '.page-tab'],
      eyebrow: 'Tu álbum',
      title: 'Una página por selección',
      body: 'Cada bandera es una selección — tocala para cambiar de equipo. Los casilleros en <b>gris</b> son las figuritas que te faltan; completá una línea y se desbloquea su leyenda.',
      cta: { label: 'Entendido', go: () => go('back-to-sobres') }
    },

    'back-to-sobres': {
      kind: 'spot',
      target: TAB('sobres'),
      eyebrow: 'Seguí jugando',
      title: 'Conseguí repetidas',
      body: 'Volvé a <b>Sobres</b> y seguí abriendo. Te aviso apenas te toque una <b>repetida</b>.',
      auto: () => route() === 'sobres',
      next: 'await-dupe'
    },

    'await-dupe': {
      kind: 'pill',
      body: 'Seguí abriendo sobres — te aviso cuando te toque una <b>repetida</b>.',
      auto: () => C.totalDupes() > 0,
      next: 'dupe'
    },

    dupe: {
      kind: 'spot',
      target: TAB('cambios'),
      eyebrow: 'Paso 3 de 3',
      title: '¡Te tocó una repetida!',
      body: 'Las repetidas no se tiran a la basura. Tocá <b>Cambios</b> y te muestro qué hacer con ellas.',
      auto: () => route() === 'cambios',
      next: 'dupe-tour'
    },

    'dupe-tour': {
      kind: 'spot',
      target: '[data-action="sell-all"]',
      targetFallback: '.trade-banner',
      allow: ['[data-action="sell-all"]', '[data-action="sell"]'],
      eyebrow: 'Cambios',
      title: 'Repetidas = valor',
      body: 'Convertí las repetidas en <b>Purpurina</b> y comprá las que te faltan en la tienda. Y pronto vas a poder <b>intercambiarlas</b> con otros jugadores (botón Cambiar, llega en Fase 1) — eso conserva todo el valor.',
      cta: { label: '¡Listo, a coleccionar!', go: () => finish() }
    }
  };

  // ---- Estado interno ----
  let active = false;
  let cur = 'welcome';
  let curAllow = [];
  let curTargetSel = null;
  let curBlocking = false;
  let root = null;            // capa raíz (.coach)
  let builtStep = null;       // qué paso está construido en el DOM (para no re-animar)
  let scrolledForStep = null; // ya centramos el objetivo de este paso
  let rafPending = false;

  function go(id) { cur = id; refresh(); }

  function finish() {
    markDone();
    active = false;
    teardownLayer();
  }

  function teardownLayer() {
    curBlocking = false;
    curTargetSel = null;
    builtStep = null;
    scrolledForStep = null;
    if (root) { root.remove(); root = null; }
  }

  // Bloqueo de clicks: en pasos bloqueantes, todo toque que no caiga en el
  // objetivo permitido, la tarjeta o un modal propio se cancela.
  function onCapture(e) {
    if (!active || !curBlocking) return;
    const t = e.target;
    if (t.closest && t.closest('.coach-card')) return;
    if (t.closest && t.closest('.overlay')) return; // revelado / notificaciones
    for (const sel of curAllow) {
      if (t.closest && t.closest(sel)) return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  // Bloqueo de scroll: mientras hay un cartel bloqueante, cancelamos rueda y
  // arrastre, salvo dentro de la tarjeta o del propio elemento marcado
  // (ej. la fila de selecciones, que scrollea en horizontal).
  function onScrollBlock(e) {
    if (!active || !curBlocking) return;
    const t = e.target;
    if (t.closest && t.closest('.coach-card')) return;
    if (t.closest && t.closest('.overlay')) return; // revelado / notificaciones
    if (t.closest && curTargetSel && t.closest(curTargetSel)) return;
    e.preventDefault();
  }

  function scheduleReposition() {
    if (!active || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; refresh(); });
  }

  function refresh() {
    if (!active) return;

    // Cedemos ante modales propios (revelado de sobre, notificaciones).
    if (document.querySelector('.overlay')) { teardownLayer(); return; }

    let guard = 0;
    while (STEPS[cur] && STEPS[cur].auto && STEPS[cur].auto() && guard++ < 12) {
      cur = STEPS[cur].next;
      if (!STEPS[cur]) { finish(); return; }
    }

    const step = STEPS[cur];
    if (!step) { finish(); return; }
    showStep(step);
  }

  function ensureRoot() {
    if (!root) { root = document.createElement('div'); document.body.appendChild(root); }
    return root;
  }

  function targetEl(step) {
    if (!step.target) return null;
    return document.querySelector(step.target) ||
           (step.targetFallback ? document.querySelector(step.targetFallback) : null);
  }

  function showStep(step) {
    ensureRoot();
    curAllow = step.allow || (step.target ? [step.target] : []);
    curTargetSel = step.target || null;
    curBlocking = step.kind !== 'pill';

    if (step.kind === 'pill') { renderPill(step); return; }
    if (step.kind === 'modal') { renderModal(step); return; }
    renderSpot(step);
  }

  function cardHTML(step, centered) {
    const cta = step.cta
      ? `<button class="btn" data-coach="cta">${step.cta.label}</button>`
      : '';
    return `<div class="coach-card${centered ? ' center' : ''}">
        <div class="coach-card-in">
          <div class="coach-eyebrow">${step.eyebrow || 'Guía'}</div>
          <h3 class="coach-title">${step.title || ''}</h3>
          <p class="coach-body">${step.body || ''}</p>
          ${cta}
          <button class="coach-skip" data-coach="skip">Saltar guía</button>
        </div>
      </div>`;
  }

  function wireCard(step) {
    const ctaBtn = root.querySelector('[data-coach="cta"]');
    if (ctaBtn && step.cta) ctaBtn.addEventListener('click', step.cta.go);
    const skip = root.querySelector('[data-coach="skip"]');
    if (skip) skip.addEventListener('click', finish);
  }

  function renderModal(step) {
    if (builtStep !== cur) {
      root.className = 'coach modal-dim';
      root.innerHTML = cardHTML(step, true);
      wireCard(step);
      builtStep = cur;
    }
  }

  function renderSpot(step) {
    const el = targetEl(step);
    // Objetivo aún no en pantalla (la vista no renderizó): tarjeta centrada
    // con la instrucción para no dejar al usuario sin guía.
    if (!el) {
      if (builtStep !== cur) {
        root.className = 'coach modal-dim';
        root.innerHTML = cardHTML(step, true);
        wireCard(step);
        builtStep = cur;
      }
      return;
    }

    // Centramos el objetivo una sola vez al entrar al paso (solo si está
    // dentro del área scrolleable; las tabs son fijas).
    const view = document.getElementById('view');
    if (scrolledForStep !== cur) {
      if (view && view.contains(el)) {
        try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) { /* noop */ }
      }
      scrolledForStep = cur;
    }

    // Construimos una sola vez por paso (para animar la entrada una vez);
    // después solo reposicionamos.
    if (builtStep !== cur) {
      root.className = 'coach';
      root.innerHTML =
        '<div class="coach-hole"></div><div class="coach-arrow"></div>' +
        cardHTML(step, false);
      wireCard(step);
      builtStep = cur;
    }
    positionSpot(el);
  }

  function positionSpot(el) {
    const r = el.getBoundingClientRect();
    const pad = 8;
    const vh = window.innerHeight;
    const cx = r.left + r.width / 2;

    const hole = root.querySelector('.coach-hole');
    hole.style.top = (r.top - pad) + 'px';
    hole.style.left = (r.left - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    // Tarjeta abajo solo si el objetivo está claramente arriba; si está
    // centrado o abajo, va arriba (más aire, no la tapan las tabs).
    const below = r.top < vh * 0.42;
    const card = root.querySelector('.coach-card');
    if (below) { card.style.top = (r.bottom + 28) + 'px'; card.style.bottom = 'auto'; }
    else { card.style.bottom = (vh - r.top + 28) + 'px'; card.style.top = 'auto'; }

    // Flecha entre la tarjeta y el objetivo, apuntando al objetivo.
    const arrow = root.querySelector('.coach-arrow');
    arrow.className = 'coach-arrow ' + (below ? 'up' : 'down');
    arrow.style.left = (cx - 11) + 'px';
    arrow.style.top = below ? (r.bottom + 8) + 'px' : (r.top - 23) + 'px';
  }

  function renderPill(step) {
    if (builtStep !== cur) {
      root.className = 'coach';
      root.innerHTML =
        `<div class="coach-pill">
          <span>📦 ${step.body}</span>
        </div>`;
      builtStep = cur;
    }
  }

  // ---- API pública ----
  C.onboarding = {
    init() {
      if (isDone()) { active = false; return; }
      active = true;
      cur = 'welcome';
      document.addEventListener('click', onCapture, true);
      document.addEventListener('wheel', onScrollBlock, { passive: false, capture: true });
      document.addEventListener('touchmove', onScrollBlock, { passive: false, capture: true });
      window.addEventListener('resize', scheduleReposition);
      const v = document.getElementById('view');
      if (v) v.addEventListener('scroll', scheduleReposition, { passive: true });
      refresh();
    },
    refresh,
    // Para volver a ver la guía (consola): Cromo.onboarding.reset()
    reset() {
      clearDone();
      active = true;
      cur = 'welcome';
      teardownLayer();
      refresh();
    }
  };
})();
