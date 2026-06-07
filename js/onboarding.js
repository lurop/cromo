(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // ============================================================
  // Onboarding — guía de primera vez (Fase 0)
  // Capa de "coach marks": foco (spotlight) sobre un elemento real
  // + tarjeta con instrucción. NO toca la lógica de juego: avanza
  // observando el estado real (sobres abiertos, ruta actual, repetidas).
  // Se redibuja desde C.render() vía refresh(), así sigue al
  // re-render de cada vista.
  // "Ya vi la guía" se guarda en localStorage: es cache de UI, no dato
  // de cuenta (§4 del CLAUDE.md). En Fase 1 esto vivirá en el perfil.
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

  // Ruta actual (mismo criterio que app.js).
  function route() {
    const raw = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    return raw || 'album';
  }

  // Definición de pasos. Cada uno avanza por `auto()` (predicado sobre el
  // estado real) o por el botón `cta` de la tarjeta.
  const STEPS = {
    welcome: {
      kind: 'modal',
      eyebrow: 'Bienvenido',
      title: 'Empezá a coleccionar',
      body: 'En <b>Cromo</b> no se compran los sobres: se ganan. Abrís, completás tu álbum y las repetidas nunca se desperdician. Te muestro el camino en 30 segundos.',
      // Seteamos el paso y navegamos: el hashchange dispara render()→refresh()
      // cuando la vista de Sobres ya está pintada (sin parpadeo de la tarjeta).
      cta: { label: 'Abrir mi primer sobre', go: () => { cur = 'open-pack'; location.hash = '#/sobres'; } }
    },

    'open-pack': {
      kind: 'spot',
      requireRoute: 'sobres',
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
      target: 'a[data-route="album"]',
      allow: ['a[data-route="album"]'],
      eyebrow: 'Paso 2 de 3',
      title: 'Mirá tu álbum',
      body: 'Tus figuritas ya están guardadas. Tocá <b>Álbum</b> para verlas.',
      auto: () => route() === 'album',
      next: 'album-tour'
    },

    'album-tour': {
      kind: 'spot',
      requireRoute: 'album',
      target: '.pages',
      allow: ['.page-tab'],
      eyebrow: 'Tu álbum',
      title: 'Una página por selección',
      body: 'Cada bandera es una selección — tocala para cambiar de equipo. Los casilleros en <b>gris</b> son las figuritas que te faltan; completá una línea y se desbloquea su leyenda.',
      cta: { label: 'Seguir', go: () => { cur = 'await-dupe'; location.hash = '#/sobres'; } }
    },

    'await-dupe': {
      kind: 'pill',
      body: 'Seguí abriendo sobres — te aviso cuando te toque una <b>repetida</b>.',
      auto: () => C.totalDupes() > 0,
      next: 'dupe'
    },

    dupe: {
      kind: 'spot',
      target: 'a[data-route="cambios"]',
      allow: ['a[data-route="cambios"]'],
      eyebrow: 'Paso 3 de 3',
      title: '¡Te tocó una repetida!',
      body: 'Las repetidas no se tiran a la basura. Tocá <b>Cambios</b> y te muestro qué hacer con ellas.',
      auto: () => route() === 'cambios',
      next: 'dupe-tour'
    },

    'dupe-tour': {
      kind: 'spot',
      requireRoute: 'cambios',
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
  let curBlocking = false;
  let root = null;       // capa raíz (.coach)
  let rafPending = false;

  function finish() {
    markDone();
    active = false;
    curBlocking = false;
    teardownLayer();
  }

  function teardownLayer() {
    curBlocking = false;
    if (root) { root.remove(); root = null; }
  }

  // Bloqueo: en pasos bloqueantes, todo click que no caiga en el objetivo
  // permitido ni en la tarjeta se cancela. Captura en fase de captura para
  // ganarle a los handlers delegados de app.js y a la navegación de las tabs.
  function onCapture(e) {
    if (!active || !curBlocking) return;
    const t = e.target;
    if (t.closest && t.closest('.coach-card')) return;
    // No bloquear los modales propios (revelado de sobre, notificaciones):
    // se abren sin pasar por render(), así que la guía sigue activa y, si no,
    // se comería su botón "Continuar". refresh() la oculta al próximo render.
    if (t.closest && t.closest('.overlay')) return;
    for (const sel of curAllow) {
      if (t.closest && t.closest(sel)) return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  // Reposiciona sin re-evaluar transiciones (scroll/resize).
  function scheduleReposition() {
    if (!active || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; refresh(); });
  }

  // Núcleo: avanza por los pasos cuyo predicado ya se cumple y dibuja el
  // paso en reposo. Idempotente: seguro de llamar en cada render.
  function refresh() {
    if (!active) return;

    // Cedemos ante modales propios (revelado de sobre, notificaciones):
    // ocultamos la guía y soltamos el bloqueo para no trabar su botón.
    if (document.querySelector('.overlay')) { teardownLayer(); return; }

    let guard = 0;
    while (STEPS[cur] && STEPS[cur].auto && STEPS[cur].auto() && guard++ < 12) {
      cur = STEPS[cur].next;
      if (cur === 'done' || !STEPS[cur]) { finish(); return; }
    }

    const step = STEPS[cur];
    if (!step) { finish(); return; }

    if (step.requireRoute && route() !== step.requireRoute) {
      teardownLayer();
      location.hash = '#/' + step.requireRoute;
      return;
    }

    showStep(step);
  }

  function ensureRoot() {
    if (!root) {
      root = document.createElement('div');
      document.body.appendChild(root);
    }
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
    curBlocking = step.kind !== 'pill';

    if (step.kind === 'pill') {
      renderPill(step);
      return;
    }
    if (step.kind === 'modal') {
      renderModal(step);
      return;
    }
    renderSpot(step);
  }

  function cardHTML(step, centered) {
    const cta = step.cta
      ? `<button class="btn" data-coach="cta">${step.cta.label}</button>`
      : '';
    return `<div class="coach-card${centered ? ' center' : ''}">
        <div class="coach-eyebrow">${step.eyebrow || 'Guía'}</div>
        <h3 class="coach-title">${step.title || ''}</h3>
        <p class="coach-body">${step.body || ''}</p>
        ${cta}
        <button class="coach-skip" data-coach="skip">Saltar guía</button>
      </div>`;
  }

  function wireCard(step) {
    const ctaBtn = root.querySelector('[data-coach="cta"]');
    if (ctaBtn && step.cta) ctaBtn.addEventListener('click', step.cta.go);
    const skip = root.querySelector('[data-coach="skip"]');
    if (skip) skip.addEventListener('click', finish);
  }

  function renderModal(step) {
    root.className = 'coach modal-dim';
    root.innerHTML = cardHTML(step, true);
    wireCard(step);
  }

  function renderSpot(step) {
    const el = targetEl(step);
    // Sin objetivo a la vista (aún no renderizó): mostramos solo la tarjeta
    // centrada para no dejar al usuario sin instrucción.
    if (!el) {
      root.className = 'coach modal-dim';
      root.innerHTML = cardHTML(step, true);
      wireCard(step);
      return;
    }

    const r = el.getBoundingClientRect();
    const pad = 8;
    const vh = window.innerHeight;
    const holeTop = r.top - pad;
    const holeStyle =
      `top:${holeTop}px;left:${r.left - pad}px;` +
      `width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;

    // Tarjeta arriba o abajo del objetivo según dónde haya lugar.
    const below = r.top < vh * 0.55;
    const vStyle = below
      ? `top:${r.bottom + 14}px;bottom:auto;`
      : `bottom:${vh - r.top + 14}px;top:auto;`;

    root.className = 'coach';
    root.innerHTML =
      `<div class="coach-hole" style="${holeStyle}"></div>` +
      cardHTML(step, false);
    const card = root.querySelector('.coach-card');
    card.style.cssText += vStyle;
    wireCard(step);
  }

  function renderPill(step) {
    root.className = 'coach';
    root.innerHTML =
      `<div class="coach-pill">
        <span>📦 ${step.body}</span>
        <a data-coach="sobres" href="#/sobres">Ir</a>
      </div>`;
  }

  // ---- API pública ----
  C.onboarding = {
    init() {
      if (isDone()) { active = false; return; }
      active = true;
      cur = 'welcome';
      document.addEventListener('click', onCapture, true);
      window.addEventListener('resize', scheduleReposition);
      // El contenido scrollea dentro de #view; reposicionamos el spotlight.
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
      refresh();
    }
  };
})();
