(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  C.views.sobres = function renderSobres(view) {
    const { state, HARD_PITY, SOFT_FROM, RAR, ICON } = C;
    const pity = HARD_PITY - state.sinceLeg;
    const pityPct = Math.min(100, (state.sinceLeg / HARD_PITY) * 100);

    // 7 puntos para la racha: el séptimo es el "regalo" (sobre brillante).
    const dots = Array.from({ length: 7 }, (_, i) => {
      const on = i === 6
        ? (state.streak % 7 >= 6 || state.streak >= 7)
        : ((state.streak % 7 || 7) > i);
      return `<div class="sd ${i === 6 ? 'gift' : ''} ${on ? 'on' : ''}"></div>`;
    }).join('');

    // Tabla de rarezas — sección 6 del CLAUDE.md exige publicar probabilidades.
    const rarRows = ['comun', 'especial', 'brillante', 'legendaria'].map((k) => {
      const r = RAR[k];
      return `<li class="rarity-row" style="--rc:${r.color}">
        <span class="rarity-dot"></span>
        <span class="rarity-name">${r.label}</span>
        <span class="rarity-prob">${Math.round(r.drop * 100)}%</span>
        <span class="rarity-purp">+${r.dupe}</span>
        <span class="rarity-cost">${r.cost}</span>
      </li>`;
    }).join('');

    view.innerHTML = `
      <p class="sec-title au">Mundial · edición 2026</p>
      <h1 class="h1">Tu sobre <span class="gold-text">dorado</span></h1>

      <div class="pack">
        <div class="ribbon au">Sobre Mundial</div>
        <div class="crest">${ICON.star}</div>
        <h2 class="au">5 figuritas</h2>
        <div class="sub">Negro y oro. ¿Te toca una legendaria?</div>
        <button class="btn" data-action="open-pack" ${state.packs <= 0 ? 'disabled' : ''}>
          ${state.packs > 0 ? 'Abrir sobre' : 'Sin sobres'}
        </button>
        <button class="btn ghost sm pack-bulk" data-action="open-pack-5" ${state.packs < 5 ? 'disabled' : ''}>
          Abrir 5 ${state.packs < 5 ? `· necesitás ${5 - state.packs} más` : '· 25 figuritas'}
        </button>
        <div class="count">Te quedan ${state.packs} sobre${state.packs === 1 ? '' : 's'}</div>
      </div>

      <div class="card">
        <div class="row">
          <div>
            <b>Sobre diario</b>
            <div class="muted" style="font-size:13px">
              Racha de ${state.streak} día${state.streak === 1 ? '' : 's'} · día 7 = sobre brillante
            </div>
          </div>
          <button class="btn sm" data-action="claim-daily" ${state.dailyClaimed ? 'disabled' : ''}>
            ${state.dailyClaimed ? 'Reclamado' : 'Reclamar'}
          </button>
        </div>
        <div class="streak-dots">${dots}</div>
      </div>

      <div class="card">
        <div class="row">
          <b>Garantía de legendaria</b>
          <span class="gold-text" style="font-weight:700">en ${pity} sobre${pity === 1 ? '' : 's'}</span>
        </div>
        <div class="muted" style="font-size:13px;margin-top:3px">
          La chance base es 1%. A partir del sobre ${SOFT_FROM} sin una legendaria,
          empieza a subir. En el sobre ${HARD_PITY} sale <b class="gold-text">garantizada</b>.
        </div>
        <div class="bar"><i style="width:${pityPct}%"></i></div>
      </div>

      <div class="card rarity-card">
        <div class="purp-explain">
          <div class="purp-icon">${ICON.gem}</div>
          <div class="purp-body">
            <b>¿Qué es la Purpurina?</b>
            <p>
              Es la moneda del álbum. Cuando te toca una figurita
              <b>repetida</b>, queda en tu inventario en
              <b>Cambios</b>: desde ahí podés <b>intercambiarla</b> con otro
              jugador (Fase 1) o <b>convertirla</b> a Purpurina para gastarla
              en la <b>tienda</b>. Intercambiar conserva todo el valor —
              convertir te da una fracción.
            </p>
          </div>
        </div>

        <div class="rarity-title">
          <b>Rarezas y probabilidades</b>
          <span class="muted">por figurita</span>
        </div>
        <ul class="rarity-list">
          <li class="rarity-head">
            <span></span>
            <span>Rareza</span>
            <span title="Probabilidad de que toque esta rareza por figurita">Chance</span>
            <span title="Purpurina que recibís si convertís una repetida (Cambios)">Convertir</span>
            <span title="Costo en la tienda para comprar esta rareza con Purpurina">Tienda</span>
          </li>
          ${rarRows}
        </ul>
      </div>
    `;
  };
})();
