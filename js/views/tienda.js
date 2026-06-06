(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  C.views.tienda = function renderTienda(view) {
    const { state, ROSTER, RAR, ICON } = C;
    const missing = ROSTER.filter((s) => !state.owned.has(s.id));
    const order = { legendaria: 0, brillante: 1, especial: 2, comun: 3 };
    missing.sort((a, b) =>
      order[a.rar] - order[b.rar] ||
      a.team.localeCompare(b.team) ||
      a.num - b.num
    );

    let body;
    if (missing.length === 0) {
      body = `<div class="empty-state">${ICON.star}
        <div><b>¡Álbum completo!</b></div>
        <div style="margin-top:6px">Sos leyenda. Pronto: nueva temporada.</div>
      </div>`;
    } else {
      body = missing.map((s) => {
        const t = C.team(s.team);
        const r = RAR[s.rar];
        const afford = state.purpurina >= r.cost;
        return `<div class="shop-item">
          <div class="mini">${C.jersey(t, s.num)}</div>
          <div class="info">
            <div class="ct">${C.flag(t.id)}<b>${t.name} · #${s.num}</b></div>
            <span class="r" style="color:${r.color}">${r.label}</span>
          </div>
          <button class="btn sm ${afford ? '' : 'ghost'}" data-action="buy" data-id="${s.id}" ${afford ? '' : 'disabled'}>
            <span class="cost" style="color:${afford ? '#241a05' : ''}">${ICON.gem}${r.cost}</span>
          </button>
        </div>`;
      }).join('');
    }

    view.innerHTML = `
      <div class="back-row">
        <a class="back-link" href="#/album">${ICON.back}<span>Volver</span></a>
      </div>
      <p class="sec-title au">Tienda de Purpurina</p>
      <h1 class="h1" style="margin-bottom:6px">Comprá lo que te <span class="gold-text">falta</span></h1>
      <div class="card row" style="margin-bottom:16px">
        <span class="muted">Tu Purpurina (de tus repetidas)</span>
        <span class="cost" style="font-size:18px">${ICON.gem}${state.purpurina}</span>
      </div>
      ${body}
      <p class="hint">Las repetidas se convierten en Purpurina automáticamente.</p>
    `;
  };
})();
