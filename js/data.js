(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // Sección 6 — probabilidades, valor en Purpurina por repetida, costo en tienda.
  C.RAR = {
    comun:      { label: 'Común',      color: '#9DA3AB', drop: 0.70, dupe: 1,   cost: 8 },
    especial:   { label: 'Especial',   color: '#4FA3E3', drop: 0.22, dupe: 5,   cost: 30 },
    brillante:  { label: 'Brillante',  color: '#9B6DD6', drop: 0.07, dupe: 20,  cost: 90 },
    legendaria: { label: 'Legendaria', color: '#D4AF37', drop: 0.01, dupe: 100, cost: 400 }
  };

  // Subset de selecciones para la Fase 0. Las 48 con tiers llegan en Fase 2.
  // Camisetas con colores reales (permitido) y diseño propio (sin escudo, sin marca).
  // gkKit: kit del arquero (número 1), monocromático por convención de cada selección.
  C.TEAMS = [
    {
      id: 'arg', name: 'Argentina',
      kit:   { type: 'stripes', base: '#6FB1E6', side: '#FFFFFF', trim: '#0B2A4A', num: '#0B2A4A' },
      gkKit: { type: 'solid',   base: '#1B4D2E', side: '#1B4D2E', trim: '#0E2918', num: '#F4EEE3' }
    },
    {
      id: 'bra', name: 'Brasil',
      kit:   { type: 'solid', base: '#FFD400', side: '#FFD400', trim: '#00803D', num: '#00471F' },
      gkKit: { type: 'solid', base: '#2C2C2C', side: '#2C2C2C', trim: '#1A1A1A', num: '#FFD400' }
    },
    {
      id: 'fra', name: 'Francia',
      kit:   { type: 'solid', base: '#1F347A', side: '#1F347A', trim: '#FFFFFF', num: '#FFFFFF' },
      gkKit: { type: 'solid', base: '#3A3A3A', side: '#3A3A3A', trim: '#1A1A1A', num: '#F4EEE3' }
    }
  ];

  // El arquero (#1) usa el kit alterno si existe; el resto el kit principal.
  C.kitFor = (team, num) => (num === 1 && team.gkKit) ? team.gkKit : team.kit;

  // 11 figuritas por selección con un reparto de rareza por número.
  const RPATTERN = ['comun', 'comun', 'comun', 'especial', 'comun', 'comun', 'especial', 'brillante', 'especial', 'legendaria', 'comun'];

  // Formación 4-3-3: arquero #1 + 4 defensores #2-5 → línea "def" (5).
  // Mediocampo #6-8 → "mid" (3). Delantera #9-11 → "att" (3).
  const lineOf = (num) => num <= 5 ? 'def' : num <= 8 ? 'mid' : 'att';

  // Orden y metadatos de cada línea. El orden importa: se renderiza def → mid → att.
  C.LINES = [
    { id: 'def', label: 'Defensa',     sub: 'con arquero', icon: 'shield' },
    { id: 'mid', label: 'Mediocampo',  sub: '',            icon: 'midfield' },
    { id: 'att', label: 'Delantera',   sub: '',            icon: 'arrow' }
  ];
  C.lineMeta = (id) => C.LINES.find((l) => l.id === id);

  C.ROSTER = [];
  C.TEAMS.forEach((t) => {
    for (let i = 0; i < 11; i++) {
      const num = i + 1;
      C.ROSTER.push({
        id: t.id + '-' + num,
        team: t.id,
        num,
        rar: RPATTERN[i],
        line: lineOf(num)
      });
    }
  });
  C.TOTAL = C.ROSTER.length;

  C.team = (id) => C.TEAMS.find((t) => t.id === id);
  C.stk  = (id) => C.ROSTER.find((s) => s.id === id);
})();
