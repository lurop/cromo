(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.anim = C.anim || {};

  // Cantidad de gemas que vuelan: escala con el monto pero capada para no saturar.
  function particleCount(amount) {
    if (amount <= 1) return 3;
    if (amount <= 5) return 4;
    if (amount <= 20) return 6;
    if (amount <= 100) return 8;
    return 10;
  }

  // Lanza N gemas desde fromEl hacia el chip de Purpurina del header.
  // opts.onFirstLand se dispara cuando aterriza la primera (momento ideal para
  // mutar estado y re-renderizar, así el número del chip se actualiza con el "pop").
  // opts.onAllLanded se dispara al terminar todo el vuelo.
  C.anim.flyToPurpChip = function flyToPurpChip(fromEl, amount, opts) {
    opts = opts || {};
    const chip = document.getElementById('chip-purp');
    if (!fromEl || !chip || amount <= 0) {
      if (opts.onFirstLand) opts.onFirstLand();
      if (opts.onAllLanded) opts.onAllLanded();
      return;
    }

    const srcRect = fromEl.getBoundingClientRect();
    const dstRect = chip.getBoundingClientRect();
    const sx = srcRect.left + srcRect.width / 2;
    const sy = srcRect.top + srcRect.height / 2;
    const dx = dstRect.left + dstRect.width / 2;
    const dy = dstRect.top + dstRect.height / 2;

    const count = particleCount(amount);
    const layer = document.createElement('div');
    layer.className = 'fly-layer';
    document.body.appendChild(layer);

    let landed = 0;
    let firstLandFired = false;

    for (let i = 0; i < count; i++) {
      const g = document.createElement('div');
      g.className = 'gem-fly';
      g.innerHTML = C.ICON.gem;
      // Dispersión inicial alrededor del botón.
      const jx = (Math.random() - 0.5) * 22;
      const jy = (Math.random() - 0.5) * 14;
      g.style.left = (sx + jx) + 'px';
      g.style.top = (sy + jy) + 'px';
      layer.appendChild(g);

      const delay = i * 55;
      const dur = 520 + Math.random() * 140;
      const tx = dx - sx - jx;
      const ty = dy - sy - jy;

      // Forzar el frame inicial antes de aplicar el transform final
      // para que la transición arranque desde la posición base.
      requestAnimationFrame(() => {
        g.style.transition =
          `transform ${dur}ms cubic-bezier(.42,-0.05,.55,1.1) ${delay}ms,` +
          `opacity ${Math.round(dur * 0.9)}ms ease-in ${delay + Math.round(dur * 0.25)}ms`;
        g.style.transform = `translate(${tx}px, ${ty}px) scale(0.45) rotate(${(Math.random() - 0.5) * 180}deg)`;
        g.style.opacity = '0';
      });

      const total = delay + dur;
      setTimeout(() => {
        g.remove();
        landed++;
        if (!firstLandFired) {
          firstLandFired = true;
          chip.classList.remove('chip-pop');
          // Reflow para reiniciar la animación si se dispara varias veces seguidas.
          void chip.offsetWidth;
          chip.classList.add('chip-pop');
          if (opts.onFirstLand) opts.onFirstLand();
        }
        if (landed >= count) {
          layer.remove();
          setTimeout(() => chip.classList.remove('chip-pop'), 400);
          if (opts.onAllLanded) opts.onAllLanded();
        }
      }, total + 30);
    }
  };
})();
