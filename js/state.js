(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // Sección 6 — pity blando desde 30 sobres sin legendaria, garantizada a los 50.
  C.HARD_PITY = 50;
  C.SOFT_FROM = 30;

  // Estado de Fase 0: solo en memoria. La persistencia llega en Fase 1 con Supabase.
  // owned = set de figuritas distintas que tenés (al menos una).
  // dupes = map stickerId → cuántas REPETIDAS extra tenés (no cuenta la base).
  //         Quedan en tu inventario hasta que las cambies (Fase 1) o las
  //         conviertas a Purpurina manualmente desde Cambios.
  C.state = {
    packs: 10,
    purpurina: 30,
    owned: new Set(),
    dupes: new Map(),
    sinceLeg: 0,
    streak: 3,
    dailyClaimed: false,
    albumTeam: 'arg',
    // notifications: lista cronológica creciente (push al final).
    // notifSeen = cuántas ya vio el usuario; unread = length - notifSeen.
    // Fase 0: viven en memoria; se persisten en Supabase en Fase 1.
    notifications: [],
    notifSeen: 0
  };

  C.dupesOf = (id) => C.state.dupes.get(id) || 0;
  C.totalDupes = () => {
    let n = 0;
    C.state.dupes.forEach((q) => { n += q; });
    return n;
  };
  // Valor en Purpurina de todas las repetidas si se convirtieran (para el header de Cambios).
  C.dupesValue = () => {
    let v = 0;
    C.state.dupes.forEach((q, id) => {
      if (q <= 0) return;
      const s = C.stk(id);
      if (s) v += q * C.RAR[s.rar].dupe;
    });
    return v;
  };
})();
