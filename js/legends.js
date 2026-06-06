(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // 144 leyendas (48 equipos × 3 líneas) son un pipeline editorial — sección 7
  // del CLAUDE.md y restricción legal: solo hechos verificables con fuente.
  // El pipeline se hace en Fase 2; acá dejamos el mapa vacío y la UI muestra
  // un placeholder honesto cuando una línea se completa pero su texto aún
  // no está cargado.
  //
  // Forma esperada de cada entrada (cuando llegue Fase 2):
  //   'arg.def': { text: '...', sourceUrl: 'https://...', verified: true }
  C.LEGENDS = {};

  C.getLegend = (teamId, lineId) => {
    const entry = C.LEGENDS[teamId + '.' + lineId];
    return entry && entry.verified ? entry : null;
  };
})();
