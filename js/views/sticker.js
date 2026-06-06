(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  // Componente compartido entre álbum y reveal. Las legendarias llevan marco foil animado.
  // showDupes: si true (álbum) muestra el badge "+N" cuando hay repetidas.
  C.views.stickerHTML = function stickerHTML(s, opts) {
    const t = C.team(s.team);
    const r = C.RAR[s.rar];
    const showDupes = opts && opts.showDupes;
    const dupes = showDupes ? C.dupesOf(s.id) : 0;
    const badge = dupes > 0 ? `<span class="dupe-badge" title="${dupes} repetida${dupes === 1 ? '' : 's'} en Cambios">+${dupes}</span>` : '';
    const inner = `
      <div class="sticker" style="--rc:${r.color}">
        <div class="photo">${badge}<span class="rdot"></span>${C.jersey(t, s.num)}</div>
        <div class="label">
          <div class="ct">${C.flag(t.id)}<b>${t.name}</b></div>
          <span class="rar">${r.label}</span>
        </div>
      </div>`;
    return s.rar === 'legendaria' ? `<div class="foil">${inner}</div>` : inner;
  };
})();
