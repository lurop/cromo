(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  function dupeRow(stickerId, qty) {
    const s = C.stk(stickerId);
    if (!s) return '';
    const t = C.team(s.team);
    const r = C.RAR[s.rar];
    const value = qty * r.dupe;
    return `<div class="dupe-item">
      <div class="mini">${C.jersey(t, s.num)}</div>
      <div class="info">
        <div class="ct">${C.flag(t.id)}<b>${t.name} · #${s.num}</b><span class="dupe-qty">×${qty}</span></div>
        <span class="r" style="color:${r.color}">${r.label}</span>
      </div>
      <div class="dupe-actions">
        <button class="btn sm ghost" data-action="trade" data-id="${stickerId}" disabled
                title="El intercambio entre usuarios llega en Fase 1">Cambiar</button>
        <button class="btn sm" data-action="sell" data-id="${stickerId}">
          <span class="cost" style="color:#241a05">${C.ICON.gem}+${r.dupe}</span>
        </button>
      </div>
    </div>`;
  }

  function emptyState() {
    return `<div class="empty-state">${C.ICON.gem}
      <div><b>Sin repetidas</b></div>
      <div style="margin-top:6px">Cuando te toque una figurita que ya tenés, va a aparecer acá para que la cambies o la conviertas.</div>
    </div>`;
  }

  C.views.cambios = function renderCambios(view) {
    const { state, ICON } = C;
    const totalDupes = C.totalDupes();
    const value = C.dupesValue();

    // Agrupar repetidas por equipo para que sea fácil ver qué tenés de quién.
    const byTeam = {};
    state.dupes.forEach((qty, id) => {
      if (qty <= 0) return;
      const s = C.stk(id);
      if (!s) return;
      (byTeam[s.team] = byTeam[s.team] || []).push({ id, qty });
    });
    // Dentro de cada equipo, ordenar por rareza descendente.
    const order = { legendaria: 0, brillante: 1, especial: 2, comun: 3 };
    Object.values(byTeam).forEach((arr) =>
      arr.sort((a, b) => {
        const ra = C.stk(a.id).rar, rb = C.stk(b.id).rar;
        return order[ra] - order[rb] || C.stk(a.id).num - C.stk(b.id).num;
      })
    );

    const teamsWithDupes = C.TEAMS.filter((t) => byTeam[t.id] && byTeam[t.id].length > 0);
    // Si hay un solo país, lo abrimos por default; si hay varios, todos cerrados.
    const openByDefault = teamsWithDupes.length === 1;

    const groups = teamsWithDupes.map((t) => {
      const items = byTeam[t.id];
      const qty = items.reduce((acc, d) => acc + d.qty, 0);
      const value = items.reduce((acc, d) => {
        const s = C.stk(d.id);
        return acc + (s ? d.qty * C.RAR[s.rar].dupe : 0);
      }, 0);
      return `
        <details class="dupe-group" ${openByDefault ? 'open' : ''}>
          <summary class="dupe-group-head">
            <span class="dupe-group-l">
              ${C.flag(t.id)}<span class="dupe-group-name au">${t.name}</span>
            </span>
            <span class="dupe-group-meta">
              <span class="dupe-group-count">${qty}</span>
              <span class="dupe-group-value cost">${ICON.gem}${value}</span>
              <span class="dupe-group-chev">${ICON.chevron}</span>
            </span>
          </summary>
          <div class="dupe-group-body">
            ${items.map((d) => dupeRow(d.id, d.qty)).join('')}
          </div>
        </details>
      `;
    }).join('');

    view.innerHTML = `
      <p class="sec-title au">Cambios</p>
      <h1 class="h1" style="margin-bottom:14px">Tus <span class="gold-text">repetidas</span></h1>

      <div class="card trade-banner">
        <div class="purp-icon" style="background:rgba(155,109,214,0.1);border-color:rgba(155,109,214,0.35);box-shadow:none">
          <svg viewBox="0 0 24 24" fill="none" stroke="#C49DEE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><path d="M7 7h11l-2.5-2.5L17 3l5 5-5 5-1.5-1.5L18 9H7V7zm10 10H6l2.5 2.5L7 21l-5-5 5-5 1.5 1.5L6 15h11v2z"/></svg>
        </div>
        <div class="purp-body">
          <b>Intercambio entre jugadores</b>
          <p>
            Pronto vas a poder cambiar tus repetidas con otros (Fase 1).
            <b>Intercambiar conserva todo el valor</b> — convertir a Purpurina
            te da una fracción. Solo convertí lo que sabés que nadie va a querer.
          </p>
        </div>
      </div>

      ${totalDupes > 0 ? `
        <div class="card row dupe-summary">
          <div>
            <b>${totalDupes}</b> repetida${totalDupes === 1 ? '' : 's'}
            <span class="muted" style="font-size:13px;display:block;margin-top:2px">
              valen <span class="cost" style="display:inline-flex">${ICON.gem}${value}</span> si las convertís
            </span>
          </div>
          <button class="btn sm" data-action="sell-all">Convertir todo</button>
        </div>
        ${groups}
      ` : emptyState()}
    `;
  };
})();
