(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  function slotHTML(s, teamObj) {
    if (C.state.owned.has(s.id)) {
      return `<div class="slot">${C.views.stickerHTML(s, { showDupes: true })}</div>`;
    }
    return `<div class="slot empty">${C.jersey(teamObj, s.num, true)}<span class="lock">${C.ICON.lock}</span></div>`;
  }

  function legendCard(teamObj, line) {
    const legend = C.getLegend(teamObj.id, line.id);
    if (legend) {
      const src = legend.sourceUrl
        ? `<a class="legend-source" href="${legend.sourceUrl}" target="_blank" rel="noopener">Fuente</a>`
        : '';
      return `<aside class="legend-card unlocked" aria-label="Leyenda de la ${line.label.toLowerCase()}">
        <div class="legend-head">
          <span class="legend-badge">${C.ICON.check}</span>
          <span class="legend-eyebrow au">Leyenda desbloqueada</span>
        </div>
        <h3 class="legend-title au">${line.label} de ${teamObj.name}</h3>
        <p class="legend-text">${legend.text}</p>
        ${src}
      </aside>`;
    }
    // Línea completa pero sin texto verificado todavía: somos honestos.
    return `<aside class="legend-card pending" aria-label="Leyenda en preparación">
      <div class="legend-head">
        <span class="legend-badge">${C.ICON.scroll}</span>
        <span class="legend-eyebrow au">Leyenda en preparación</span>
      </div>
      <h3 class="legend-title au">${line.label} de ${teamObj.name}</h3>
      <p class="legend-text">
        Completaste la línea. La historia verificada de esta línea se desbloquea
        cuando carguemos los textos editoriales (Fase 2).
      </p>
    </aside>`;
  }

  function lineSection(teamObj, line, players) {
    const ownedN = players.filter((s) => C.state.owned.has(s.id)).length;
    const total = players.length;
    const pct = Math.round((ownedN / total) * 100);
    const complete = ownedN === total;

    const status = complete
      ? `<span class="line-count complete">${C.ICON.check}<span>Completa</span></span>`
      : `<span class="line-count">${ownedN}/${total}</span>`;

    const cells = players.map((s) => slotHTML(s, teamObj)).join('');

    return `<section class="line-block ${complete ? 'is-complete' : ''}" data-line="${line.id}">
      <header class="line-head">
        <div class="line-head-l">
          <span class="line-icon">${C.ICON[line.icon] || ''}</span>
          <span class="line-name au">${line.label}</span>
          ${line.sub ? `<span class="line-sub">${line.sub}</span>` : ''}
        </div>
        ${status}
      </header>
      <div class="line-bar"><i style="width:${pct}%"></i></div>
      <div class="grid">${cells}</div>
      ${complete ? legendCard(teamObj, line) : ''}
    </section>`;
  }

  C.views.album = function renderAlbum(view) {
    const { state, ROSTER, TEAMS, TOTAL, LINES } = C;
    const t = state.albumTeam;
    const teamObj = C.team(t);
    const players = ROSTER.filter((s) => s.team === t);
    const ownedHere = players.filter((s) => state.owned.has(s.id)).length;

    const tabs = TEAMS.map((x) =>
      `<button class="page-tab ${x.id === t ? 'active' : ''}" data-action="set-team" data-team="${x.id}">
        ${C.flag(x.id)}${x.name}
      </button>`
    ).join('');

    const sections = LINES.map((line) => {
      const linePlayers = players.filter((s) => s.line === line.id);
      return lineSection(teamObj, line, linePlayers);
    }).join('');

    view.innerHTML = `
      <p class="sec-title au">Mi álbum</p>
      <h1 class="h1" style="margin-bottom:14px">Completá la <span class="gold-text">colección</span></h1>
      <div class="pages">${tabs}</div>
      <div class="prog-line">
        <span class="muted">${teamObj.name} · ${ownedHere}/${players.length}</span>
        <span class="pct">${Math.round(state.owned.size / TOTAL * 100)}% total</span>
      </div>
      ${sections}
      <p class="hint">Completá una línea para desbloquear su leyenda.</p>
    `;
  };
})();
