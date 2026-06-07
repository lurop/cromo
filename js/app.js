(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  const ROUTES = {
    album:   { kind: 'view',        view: 'album' },
    sobres:  { kind: 'view',        view: 'sobres' },
    cambios: { kind: 'view',        view: 'cambios' },
    juego:   { kind: 'placeholder', title: 'Juego',   hint: 'Minijuegos para ganar energía y sobres. Llega en Fase 3.' },
    perfil:  { kind: 'placeholder', title: 'Perfil',  hint: 'Cuenta, estadísticas y cosméticos. Llega en Fase 1.' },
    tienda:  { kind: 'view',        view: 'tienda' }
  };
  const DEFAULT_ROUTE = 'album';
  // Tienda no es tab visible; al estar ahí marcamos Álbum como activa (es la más cercana).
  const TAB_FOR_ROUTE = { tienda: 'album' };

  const TITLES = {
    album: 'Álbum', sobres: 'Sobres', cambios: 'Cambios',
    juego: 'Juego', perfil: 'Perfil', tienda: 'Tienda'
  };

  const view = document.getElementById('view');
  const tabs = document.querySelectorAll('.tab');
  const chipStreak = document.getElementById('chip-streak');
  const chipPurp   = document.getElementById('chip-purp');
  const bellBtn    = document.getElementById('notif-bell');
  const soundBtn   = document.getElementById('sound-toggle');

  function renderSound() {
    const muted = C.audio.isMuted();
    soundBtn.innerHTML = muted ? C.ICON.mute : C.ICON.sound;
    soundBtn.classList.toggle('is-muted', muted);
    soundBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    soundBtn.setAttribute('aria-pressed', String(muted));
  }

  function parseRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    return ROUTES[raw] ? raw : DEFAULT_ROUTE;
  }

  function renderChrome(routeKey) {
    const streak = C.state.streak;
    const purp   = C.state.purpurina;
    chipStreak.innerHTML = `
      <span class="chip-ic">${C.ICON.flame}</span>
      <span class="chip-meta"><b>${streak}</b><small>${streak === 1 ? 'día' : 'días'}</small></span>`;
    chipPurp.innerHTML = `
      <span class="chip-ic">${C.ICON.gem}</span>
      <span class="chip-meta"><b>${purp}</b><small>Purpurina</small></span>`;

    // Campana — badge solo si hay no leídas.
    const unread = C.notif.unreadCount();
    const badge = unread > 0
      ? `<span class="notif-badge">${unread > 9 ? '9+' : unread}</span>`
      : '';
    bellBtn.innerHTML = `${C.ICON.bell}${badge}`;
    bellBtn.classList.toggle('has-unread', unread > 0);

    const activeTab = TAB_FOR_ROUTE[routeKey] || routeKey;
    tabs.forEach((tab) => {
      const isActive = tab.dataset.route === activeTab;
      tab.classList.toggle('is-active', isActive);
      if (isActive) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    document.title = `Cromo · ${TITLES[routeKey] || 'Cromo'}`;
  }

  function renderView(routeKey) {
    const route = ROUTES[routeKey];
    if (route.kind === 'placeholder') {
      C.views.placeholder(view, { title: route.title, hint: route.hint });
    } else if (route.view === 'sobres') {
      C.views.sobres(view);
    } else if (route.view === 'album') {
      C.views.album(view);
    } else if (route.view === 'cambios') {
      C.views.cambios(view);
    } else if (route.view === 'tienda') {
      C.views.tienda(view);
    }
    view.scrollTop = 0;
  }

  // Render principal: se usa después de mutar estado para repintar la pantalla actual.
  C.render = function render() {
    const routeKey = parseRoute();
    renderChrome(routeKey);
    renderView(routeKey);
    // La guía de primera vez se redibuja sobre la vista ya renderizada.
    if (C.onboarding) C.onboarding.refresh();
  };

  // Acciones de UI por event delegation. Centraliza el "cuando hacés X, mutá estado y repinto".
  view.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'open-pack') {
      if (C.state.packs <= 0) return;
      C.audio.play('packOpen');
      const res = C.pack.openPack();
      C.views.showReveal(res);
      return;
    }
    if (action === 'open-pack-5') {
      if (C.state.packs < 5) return;
      C.audio.play('packOpen');
      const res = C.pack.openPackBundle(5);
      if (res.length) C.views.showReveal(res);
      return;
    }
    if (action === 'claim-daily') {
      if (C.pack.claimDaily()) { C.audio.play('reward'); C.render(); }
      return;
    }
    if (action === 'set-team') {
      C.audio.play('tap');
      C.state.albumTeam = btn.dataset.team;
      C.render();
      return;
    }
    if (action === 'buy') {
      if (C.pack.buy(btn.dataset.id)) { C.audio.play('buy'); C.render(); }
      return;
    }
    if (action === 'sell') {
      const id = btn.dataset.id;
      const s = C.stk(id);
      if (!s) return;
      const dup = C.state.dupes.get(id) || 0;
      if (dup <= 0) return;
      if (btn.dataset.busy === '1') return;
      btn.dataset.busy = '1';
      C.audio.play('coin');
      const amount = C.RAR[s.rar].dupe;
      C.anim.flyToPurpChip(btn, amount, {
        onFirstLand: () => {
          C.pack.sell(id);
          C.render();
        }
      });
      return;
    }
    if (action === 'sell-all') {
      const total = C.dupesValue();
      if (total <= 0) return;
      if (btn.dataset.busy === '1') return;
      btn.dataset.busy = '1';
      C.audio.play('coin');
      C.anim.flyToPurpChip(btn, total, {
        onFirstLand: () => {
          C.pack.sellAll();
          C.render();
        }
      });
      return;
    }
  });

  // Campana — abre el panel y marca todo como leído al cerrar.
  bellBtn.addEventListener('click', () => C.views.showNotifs());

  // Botón de sonido (mute on/off).
  soundBtn.addEventListener('click', () => {
    C.audio.toggleMute();
    renderSound();
  });

  // Tap sutil al navegar por la barra inferior.
  document.querySelector('.app-tabs').addEventListener('click', (e) => {
    if (e.target.closest('.tab')) C.audio.play('tap');
  });

  window.addEventListener('hashchange', () => C.render());
  if (!location.hash) location.replace('#/' + DEFAULT_ROUTE);
  C.render();
  renderSound();

  // Arranca la guía de primera vez (no hace nada si ya se completó).
  if (C.onboarding) C.onboarding.init();
})();
