(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;
  C.views = C.views || {};

  function burst(ov) {
    const cols = ['#F0D77B', '#D4AF37', '#F4EEE3', '#7FB2E8', '#A8842A'];
    for (let i = 0; i < 22; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = (1.1 + Math.random() * 1.1) + 's';
      c.style.animationDelay = (Math.random() * 0.25) + 's';
      ov.appendChild(c);
      setTimeout(() => c.remove(), 2600);
    }
  }

  C.views.showReveal = function showReveal(res) {
    const dense = res.length > 5;
    // En modo denso (apertura múltiple) achicamos cartas y aceleramos el cascade.
    const stagger = dense ? 150 : 340;
    const flipStart = dense ? 280 : 380;

    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');

    const cards = res.map((c, i) => {
      const leg = c.s.rar === 'legendaria';
      return `<div class="rcard ${leg ? 'leg' : ''}" data-i="${i}"><div class="inner">
        <div class="face back">${C.ICON.star}</div>
        <div class="face front">${c.isNew ? '<div class="newtag">Nueva</div>' : ''}${C.views.stickerHTML(c.s)}</div>
      </div></div>`;
    }).join('');

    const newCount = res.filter((c) => c.isNew).length;
    const dupCount = res.length - newCount;
    const legCount = res.filter((c) => c.s.rar === 'legendaria').length;

    const title = dense
      ? `Abriendo 5 sobres · <b>${res.length} figuritas</b>`
      : 'Abriendo sobre…';

    ov.innerHTML = `
      <div class="overlay-inner">
        <div class="reveal-title au">${title}</div>
        <div class="reveal-grid ${dense ? 'dense' : ''}">${cards}</div>
        <div class="tally" id="tally"></div>
        <div style="width:100%;max-width:320px">
          <button class="btn" id="contBtn" style="opacity:0;pointer-events:none">Continuar</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    const rcards = [...ov.querySelectorAll('.rcard')];
    let confettiFired = false;
    let goalRoared = false;
    rcards.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('flipped');
        const isLeg = el.classList.contains('leg');
        // Sonido por carta. Legendaria = momento grande: chispa dorada +
        // rugido de gol (una sola vez aunque haya varias). El resto, giro suave.
        if (isLeg) {
          C.audio.play('legendary');
          if (!goalRoared) { C.audio.play('goal'); goalRoared = true; }
        } else {
          C.audio.play('flip');
        }
        // Confetti UNA vez al aparecer la primera legendaria.
        if (isLeg && !confettiFired) {
          confettiFired = true;
          burst(ov);
        }
      }, flipStart + i * stagger);
    });

    setTimeout(() => {
      // Cierre: si el sobre cerró un equipo/álbum, rugido de gol (si no rugió
      // ya por una legendaria); si no, un floreo.
      if (res.bigMoment && !goalRoared) C.audio.play('goal');
      else if (legCount === 0 && newCount > 0) C.audio.play('celebrate');
      const tally = ov.querySelector('#tally');
      let line1 = `<b>${newCount}</b> nueva${newCount === 1 ? '' : 's'}`;
      if (dupCount > 0) line1 += ` · <b>${dupCount}</b> repetida${dupCount === 1 ? '' : 's'}`;
      if (legCount > 0) {
        const legLine = legCount === 1
          ? '✦ ¡Legendaria! ✦'
          : `✦ ${legCount} legendarias ✦`;
        line1 = legLine + '<br>' + line1;
      }
      const line2 = dupCount > 0
        ? `<small class="tally-hint">Las repetidas van a <b>Cambios</b> · cambialas o convertilas en Purpurina</small>`
        : '';
      tally.innerHTML = line1 + line2;

      const b = ov.querySelector('#contBtn');
      b.style.opacity = '1';
      b.style.pointerEvents = 'auto';
      // En modo denso el contenido puede pasar del viewport; aseguramos
      // que el botón Continuar quede visible cuando termina el reveal.
      if (dense) b.scrollIntoView({ behavior: 'smooth', block: 'end' });
      b.addEventListener('click', () => {
        ov.remove();
        C.render();
      });
    }, flipStart + rcards.length * stagger + 300);
  };
})();
