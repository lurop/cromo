(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  // Renderer compartido para las tabs que aún no tienen lógica (Fases 1/2/3).
  C.views.placeholder = function placeholder(view, { title, hint }) {
    view.innerHTML = `
      <section class="screen" aria-labelledby="screen-title">
        <p class="screen-eyebrow">Cromo</p>
        <h2 class="screen-title" id="screen-title">${title}</h2>
        <div class="screen-divider" aria-hidden="true"></div>
        <p class="screen-hint">${hint}</p>
      </section>
    `;
  };
})();
