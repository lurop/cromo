(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.notif = C.notif || {};

  let _nid = 0;

  // Push genérico — todos los helpers terminan acá. Devuelve la notif creada
  // por si quien la dispara quiere referenciarla (ej. para toast en vivo).
  function push(evt) {
    const n = Object.assign({
      id: 'n_' + (++_nid),
      ts: Date.now()
    }, evt);
    C.state.notifications.push(n);
    return n;
  }

  C.notif.unreadCount = () => Math.max(0, C.state.notifications.length - C.state.notifSeen);

  C.notif.markAllRead = () => {
    C.state.notifSeen = C.state.notifications.length;
  };

  // Helpers por tipo de evento — encapsulan título, subtítulo y meta para
  // que la vista decida cómo renderizar (icono, expandible, color).

  C.notif.lineComplete = (teamId, lineId) => {
    const t = C.team(teamId);
    const line = C.lineMeta(lineId);
    if (!t || !line) return null;
    return push({
      type: 'line-complete',
      title: `Línea de ${line.label.toLowerCase()} completa`,
      subtitle: t.name,
      meta: { teamId, lineId }
    });
  };

  C.notif.teamComplete = (teamId) => {
    const t = C.team(teamId);
    if (!t) return null;
    return push({
      type: 'team-complete',
      title: `${t.name} al 100%`,
      subtitle: 'Página completa',
      meta: { teamId }
    });
  };

  C.notif.legendary = (stickerId, isNew) => {
    const s = C.stk(stickerId);
    if (!s) return null;
    const t = C.team(s.team);
    return push({
      type: 'legendary',
      title: isNew ? '¡Legendaria nueva!' : 'Legendaria repetida',
      subtitle: `${t.name} · #${s.num}`,
      meta: { stickerId, isNew }
    });
  };

  C.notif.milestone = (pct) => {
    return push({
      type: 'milestone',
      title: `${pct}% del álbum`,
      subtitle: pct === 100 ? '¡Álbum completo!' : 'Vas avanzando',
      meta: { pct }
    });
  };

  C.notif.streak7 = (streak) => {
    return push({
      type: 'streak-7',
      title: `Racha de ${streak} días`,
      subtitle: 'Sobre brillante reclamado',
      meta: { streak }
    });
  };

  C.notif.pityHard = () => {
    return push({
      type: 'pity-hard',
      title: 'Garantía de legendaria',
      subtitle: 'Pity duro activado',
      meta: {}
    });
  };

  // Formateo de tiempo relativo. Fase 0: en memoria, así que la mayoría
  // de los eventos serán "recién" o "hace X min" durante la sesión.
  C.notif.relTime = (ts) => {
    const diff = Date.now() - ts;
    const min = 60_000;
    const hr  = 60 * min;
    const day = 24 * hr;
    if (diff < 30_000) return 'recién';
    if (diff < hr)     return `hace ${Math.floor(diff / min)} min`;
    if (diff < day)    return `hace ${Math.floor(diff / hr)} h`;
    if (diff < 2*day)  return 'ayer';
    return `hace ${Math.floor(diff / day)} días`;
  };
})();
