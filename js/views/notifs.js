(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  // Icono + clase color por tipo de evento.
  const TYPE_META = {
    'line-complete': { icon: 'shield',  cls: 'n-line' },
    'team-complete': { icon: 'trophy',  cls: 'n-team' },
    'legendary':     { icon: 'star',    cls: 'n-leg' },
    'milestone':     { icon: 'trophy',  cls: 'n-mil' },
    'streak-7':      { icon: 'flame',   cls: 'n-streak' },
    'pity-hard':     { icon: 'gem',     cls: 'n-pity' }
  };

  function renderItem(n) {
    const meta = TYPE_META[n.type] || { icon: 'star', cls: '' };
    const icon = C.ICON[meta.icon] || C.ICON.star;
    const time = C.notif.relTime(n.ts);

    // Línea completa: expandible para mostrar la leyenda (o el placeholder).
    if (n.type === 'line-complete') {
      const t = C.team(n.meta.teamId);
      const line = C.lineMeta(n.meta.lineId);
      const legend = C.getLegend(n.meta.teamId, n.meta.lineId);
      const legendBody = legend
        ? `<p>${legend.text}</p>
           <a href="${legend.sourceUrl}" target="_blank" rel="noopener" class="legend-src">Fuente</a>`
        : `<p class="muted">Leyenda pendiente — la cargamos en Fase 2 con su fuente verificada.</p>`;
      return `<details class="notif-item ${meta.cls}">
        <summary class="notif-row">
          <span class="notif-ic">${icon}</span>
          <span class="notif-body">
            <b class="notif-title">${n.title}</b>
            <span class="notif-sub">${C.flag(t.id)}${t.name} · ${line.label}</span>
          </span>
          <span class="notif-time">${time}</span>
        </summary>
        <div class="notif-expand">${legendBody}</div>
      </details>`;
    }

    // Equipo completo: muestra bandera del equipo.
    if (n.type === 'team-complete') {
      const t = C.team(n.meta.teamId);
      return `<div class="notif-item ${meta.cls}">
        <div class="notif-row">
          <span class="notif-ic">${icon}</span>
          <span class="notif-body">
            <b class="notif-title">${n.title}</b>
            <span class="notif-sub">${C.flag(t.id)}${n.subtitle}</span>
          </span>
          <span class="notif-time">${time}</span>
        </div>
      </div>`;
    }

    return `<div class="notif-item ${meta.cls}">
      <div class="notif-row">
        <span class="notif-ic">${icon}</span>
        <span class="notif-body">
          <b class="notif-title">${n.title}</b>
          <span class="notif-sub">${n.subtitle}</span>
        </span>
        <span class="notif-time">${time}</span>
      </div>
    </div>`;
  }

  C.views.showNotifs = function showNotifs() {
    const ov = document.createElement('div');
    ov.className = 'overlay notif-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');

    const list = C.state.notifications;
    const items = list.length === 0
      ? `<div class="empty-state">${C.ICON.bell}
          <div><b>Sin novedades</b></div>
          <div style="margin-top:6px">Líneas y equipos completos, legendarias y otros hitos van a aparecer acá.</div>
        </div>`
      // Mostramos del más nuevo al más viejo.
      : list.slice().reverse().map(renderItem).join('');

    ov.innerHTML = `
      <div class="overlay-inner notif-inner">
        <div class="notif-head">
          <b class="notif-title-bar">Notificaciones</b>
          <button class="notif-close" data-action="close-notifs" aria-label="Cerrar">${C.ICON.close}</button>
        </div>
        <div class="notif-list">${items}</div>
        <p class="notif-foot">
          Tu historial vive solo en esta sesión. Cuando crees cuenta (Fase 1),
          se guarda permanentemente.
        </p>
      </div>`;

    document.body.appendChild(ov);

    // Click fuera del panel cierra. (Click dentro de notif-inner no propaga.)
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeOverlay();
      const btn = e.target.closest('[data-action="close-notifs"]');
      if (btn) closeOverlay();
    });

    function closeOverlay() {
      C.notif.markAllRead();
      ov.remove();
      C.render();
    }
  };
})();
