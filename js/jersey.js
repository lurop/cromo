(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  let _jid = 0;

  // Camiseta SVG generada por código: paneles según kit.type (solid/stripes),
  // cuello en color trim, número en color num. Versión "ghost" para casilleros vacíos.
  // El arquero (#1) usa el gkKit del equipo si está definido (ver C.kitFor en data.js).
  C.jersey = function jersey(t, num, ghost) {
    const id = 'j' + (_jid++);
    const k = C.kitFor(t, num);
    const shirt  = 'M50 13 C44 19 36 19 31 14 L19 18 L8 41 L22 49 L27 41 L27 87 L73 87 L73 41 L78 49 L92 41 L81 18 L69 14 C64 19 56 19 50 13 Z';
    const collar = 'M31 14 C36 19 44 19 50 13 C56 19 64 19 69 14';

    if (ghost) {
      return `<svg viewBox="0 0 100 100" class="jsvg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="${shirt}" fill="rgba(255,255,255,.03)" stroke="rgba(212,175,55,.18)" stroke-width="1.5" stroke-linejoin="round"/>
        <text x="50" y="64" text-anchor="middle" font-family="Anton,sans-serif" font-size="34" fill="rgba(212,175,55,.16)">${num}</text>
      </svg>`;
    }

    let fillC;
    if (k.type === 'stripes') {
      let stripes = '';
      for (let x = 8; x < 92; x += 16) stripes += `<rect x="${x}" y="8" width="8" height="84" fill="${k.side}"/>`;
      fillC = `<rect width="100" height="100" fill="${k.base}"/>${stripes}`;
    } else {
      fillC = `<rect width="100" height="100" fill="${k.base}"/>`;
    }

    return `<svg viewBox="0 0 100 100" class="jsvg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Camiseta número ${num}">
      <defs><clipPath id="${id}"><path d="${shirt}"/></clipPath></defs>
      <g clip-path="url(#${id})">${fillC}</g>
      <path d="${shirt}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="${collar}" fill="none" stroke="${k.trim}" stroke-width="3.2" stroke-linecap="round"/>
      <text x="50" y="64" text-anchor="middle" font-family="Anton,sans-serif" font-size="34" fill="${k.num}">${num}</text>
    </svg>`;
  };
})();
