(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // Pity blando: pasados SOFT_FROM sobres sin legendaria, la chance crece +2.5% por sobre,
  // tope 60%. Pity duro: si el próximo sobre cruza HARD_PITY, fuerza legendaria.
  function legChance() {
    const { state, SOFT_FROM, RAR } = C;
    if (state.sinceLeg < SOFT_FROM) return RAR.legendaria.drop;
    return Math.min(0.6, RAR.legendaria.drop + (state.sinceLeg - SOFT_FROM + 1) * 0.025);
  }

  function rollRarity() {
    const { state, HARD_PITY, RAR } = C;
    const forced = state.sinceLeg + 1 >= HARD_PITY;
    const w = {
      legendaria: forced ? 1 : legChance(),
      brillante:  RAR.brillante.drop,
      especial:   RAR.especial.drop,
      comun:      RAR.comun.drop
    };
    const sum = w.legendaria + w.brillante + w.especial + w.comun;
    let r = Math.random() * sum, acc = 0;
    for (const k of ['legendaria', 'brillante', 'especial', 'comun']) {
      acc += w[k];
      if (r <= acc) return k;
    }
    return 'comun';
  }

  function pick(rar) {
    const pool = C.ROSTER.filter((s) => s.rar === rar);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ¿Está completa esta línea de este equipo con el set "owned" dado?
  function lineDone(teamId, lineId, owned) {
    return C.ROSTER.every((s) =>
      (s.team !== teamId || s.line !== lineId) || owned.has(s.id)
    );
  }
  function teamDone(teamId, owned) {
    return C.ROSTER.every((s) => s.team !== teamId || owned.has(s.id));
  }
  // Hitos globales que queremos celebrar al cruzarlos por primera vez.
  const MILESTONES = [10, 25, 50, 100];

  // Apertura de sobre: 5 figuritas. Cada una sortea rareza → figurita de esa rareza.
  // Si ya la tenés → queda como repetida en state.dupes. El usuario decide
  // después si la cambia con alguien (Fase 1) o la convierte a Purpurina
  // (acción manual desde la pantalla de Cambios).
  // Además: emitimos notificaciones para hitos (línea completa, equipo
  // completo, milestone global %, legendaria, pity duro).
  function openPack() {
    const { state, HARD_PITY } = C;
    const total = C.TOTAL;
    const res = [];
    for (let i = 0; i < 5; i++) {
      const willBePity = state.sinceLeg + 1 >= HARD_PITY;
      const rar = rollRarity();
      if (rar === 'legendaria') state.sinceLeg = 0;
      else state.sinceLeg++;
      const s = pick(rar);
      const isNew = !state.owned.has(s.id);

      // Snapshots ANTES del cambio de estado para detectar transiciones.
      const lineWas = lineDone(s.team, s.line, state.owned);
      const teamWas = teamDone(s.team, state.owned);
      const pctBefore = Math.floor((state.owned.size / total) * 100);

      if (isNew) {
        state.owned.add(s.id);
      } else {
        state.dupes.set(s.id, (state.dupes.get(s.id) || 0) + 1);
      }

      // Detección post-cambio. Solo si fue NEW puede haber cerrado la línea/equipo/milestone.
      if (isNew) {
        const lineNow = lineDone(s.team, s.line, state.owned);
        if (!lineWas && lineNow) C.notif.lineComplete(s.team, s.line);

        const teamNow = teamDone(s.team, state.owned);
        if (!teamWas && teamNow) C.notif.teamComplete(s.team);

        const pctAfter = Math.floor((state.owned.size / total) * 100);
        for (const m of MILESTONES) {
          if (pctBefore < m && pctAfter >= m) C.notif.milestone(m);
        }
      }

      if (rar === 'legendaria') C.notif.legendary(s.id, isNew);
      if (willBePity && rar === 'legendaria') C.notif.pityHard();

      res.push({ s, isNew });
    }
    state.packs--;
    return res;
  }

  // Abrir varios sobres seguidos. Devuelve TODAS las figuritas (n*5) en un solo array.
  function openPackBundle(n) {
    const { state } = C;
    n = Math.min(n, state.packs);
    if (n <= 0) return [];
    const all = [];
    for (let i = 0; i < n; i++) all.push(...openPack());
    return all;
  }

  function claimDaily() {
    const { state } = C;
    if (state.dailyClaimed) return false;
    state.dailyClaimed = true;
    state.streak++;
    state.packs++;
    // Día 7 = sobre brillante (sección 6 del CLAUDE.md). Cada múltiplo de 7
    // se celebra como hito de racha.
    if (state.streak % 7 === 0) C.notif.streak7(state.streak);
    return true;
  }

  function buy(id) {
    const { state, RAR } = C;
    const s = C.stk(id);
    if (!s) return false;
    const cost = RAR[s.rar].cost;
    if (state.owned.has(id) || state.purpurina < cost) return false;
    state.purpurina -= cost;
    state.owned.add(id);
    return true;
  }

  // Convertir una repetida a Purpurina. Pierde valor a propósito (Común
  // vale 1 vendido vs 8 al comprar → ratio 1/8) para que intercambiar siempre
  // sea más rentable que vender.
  function sell(id) {
    const { state, RAR } = C;
    const s = C.stk(id);
    if (!s) return false;
    const dup = state.dupes.get(id) || 0;
    if (dup <= 0) return false;
    const left = dup - 1;
    if (left > 0) state.dupes.set(id, left);
    else state.dupes.delete(id);
    state.purpurina += RAR[s.rar].dupe;
    return true;
  }

  function sellAll() {
    const { state, RAR } = C;
    let gained = 0;
    state.dupes.forEach((qty, id) => {
      if (qty <= 0) return;
      const s = C.stk(id);
      if (s) gained += qty * RAR[s.rar].dupe;
    });
    if (gained <= 0) return 0;
    state.dupes.clear();
    state.purpurina += gained;
    return gained;
  }

  C.pack = { legChance, rollRarity, openPack, openPackBundle, claimDaily, buy, sell, sellAll };
})();
