(() => {
  'use strict';
  window.Cromo = window.Cromo || {};
  const C = window.Cromo;

  // ============================================================
  // Audio — SFX "jugosos" generados por código (Web Audio API).
  // Cero archivos: cada sonido se sintetiza con osciladores + ruido y
  // envolventes. Premium, liviano y afinable. Respeta autoplay: el contexto
  // se crea/reanuda recién con el primer gesto del usuario. Mute persistido
  // en localStorage (cache de UI, no dato de cuenta — §4).
  // ============================================================

  const MUTE_KEY = 'cromo_muted';
  const AMB_KEY = 'cromo_ambient';
  let ctx = null;
  let master = null;
  let muted = false;
  let ambOn = false;
  let amb = null; // nodos del ambiente activo
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* noop */ }
  // Ambiente ENCENDIDO por defecto; respeta si el usuario lo apagó a mano.
  try { const a = localStorage.getItem(AMB_KEY); ambOn = a === null ? true : a === '1'; } catch (e) { ambOn = true; }

  function applyMute() {
    // El mute global baja el master: silencia SFX y ambiente por igual.
    if (master) master.gain.value = muted ? 0 : 0.85;
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
      applyMute();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    // Si el usuario lo había dejado encendido, lo retomamos con el 1er gesto.
    if (ambOn && !amb) startAmbient();
  }

  // --- Bloques de síntesis ---
  // Nota tonal con envolvente exponencial y glide opcional.
  function tone(opts) {
    const o = opts || {};
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const dur = o.dur || 0.2;
    const gain = o.gain != null ? o.gain : 0.18;
    const atk = o.attack || 0.006;
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq || 440, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + (o.glideTime || dur));
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // Ráfaga de ruido (para "rasgar" el sobre o ticks secos).
  function noise(opts) {
    const o = opts || {};
    const t = ctx.currentTime + (o.at || 0);
    const dur = o.dur || 0.2;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'highpass';
    f.frequency.value = o.freq || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.gain != null ? o.gain : 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur);
  }

  // Arpegio: lista de frecuencias espaciadas en el tiempo.
  function arp(freqs, opts) {
    const o = opts || {};
    const step = o.step || 0.08;
    freqs.forEach((f, i) => tone({
      at: i * step, freq: f, type: o.type || 'triangle',
      dur: o.dur || 0.2, gain: o.gain != null ? o.gain : 0.09, attack: o.attack || 0.005
    }));
  }

  // --- Catálogo de sonidos ---
  const SOUNDS = {
    tap() {
      tone({ freq: 520, type: 'triangle', dur: 0.06, gain: 0.07, attack: 0.004 });
    },
    flip() {
      noise({ dur: 0.05, gain: 0.05, filter: 'bandpass', freq: 2600 });
      tone({ freq: 720, glideTo: 1120, glideTime: 0.05, type: 'sine', dur: 0.07, gain: 0.05 });
    },
    packOpen() {
      // Rasgado (ruido que decae) + whoosh ascendente.
      noise({ dur: 0.34, gain: 0.16, filter: 'highpass', freq: 1400 });
      tone({ freq: 170, glideTo: 560, glideTime: 0.3, type: 'sawtooth', dur: 0.34, gain: 0.07 });
      tone({ at: 0.06, freq: 340, glideTo: 880, glideTime: 0.26, type: 'sine', dur: 0.3, gain: 0.05 });
    },
    coin() {
      // Purpurina: dos notas brillantes hacia arriba.
      arp([1046.5, 1568], { type: 'triangle', step: 0.07, dur: 0.16, gain: 0.08 });
    },
    reward() {
      // Acorde mayor ascendente (reclamar racha).
      arp([523.25, 659.25, 783.99], { type: 'triangle', step: 0.09, dur: 0.22, gain: 0.09 });
    },
    buy() {
      arp([784, 1046.5], { type: 'sine', step: 0.08, dur: 0.18, gain: 0.08 });
    },
    legendary() {
      // Acorde dorado con brillo + chispas agudas: el momento grande.
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone({ at: i * 0.045, freq: f, type: 'sine', dur: 0.95, gain: 0.06, attack: 0.02 }));
      arp([1568, 2093, 2637, 3136], { type: 'triangle', step: 0.13, dur: 0.5, gain: 0.045, attack: 0.005 });
    },
    celebrate() {
      arp([659.25, 783.99, 987.77, 1174.7, 1568], { type: 'triangle', step: 0.06, dur: 0.3, gain: 0.07 });
    }
  };

  // --- Ambiente: "gala mundialista" ---
  // Bed festivo y procedural: pad cálido tipo gala (acordes que rotan) + un
  // pulso de BOMBO de tribuna y PALMAS en el backbeat (el toque de partido) +
  // murmullo de hinchada por debajo. Sin melodías ni cantos identificables
  // (la progresión es la más genérica del pop; nada de himnos) — respeta §2.
  // Secuenciador con look-ahead sobre el reloj de audio.
  const BPM = 100;
  const S16 = 60 / BPM / 4;                 // duración de una semicorchea
  const CHORDS = [                          // 4 compases: progresión luminosa
    [261.63, 329.63, 392.00],               // Do mayor
    [196.00, 246.94, 392.00],               // Sol
    [220.00, 329.63, 392.00],               // La menor
    [174.61, 261.63, 349.23]                // Fa
  ];

  function pinkBuf(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;             // ruido rosa (Kellet): natural, no "hiss"
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    return buf;
  }

  function kick(t, gain) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(amb.out);
    o.start(t); o.stop(t + 0.32);
  }

  function clap(t, gain) {
    const dur = 0.13;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(amb.out);
    src.start(t); src.stop(t + dur);
  }

  function padChord(freqs, t, dur) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1600; f.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.4);          // attack lento (gala)
    g.gain.setValueAtTime(0.06, t + dur - 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);        // release
    f.connect(g).connect(amb.out);
    freqs.forEach((fr, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fr;
      o.detune.value = (i - 1) * 4;                               // leve coro
      o.connect(f);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  function sparkle(t) {
    [1568, 2093, 2637, 3136].forEach((fr, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const at = t + i * 0.12;
      o.type = 'triangle'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.03, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      o.connect(g).connect(amb.out);
      o.start(at); o.stop(at + 0.55);
    });
  }

  function scheduleStep(s, t) {
    const inBar = s % 16;
    // Bombo de tribuna: negra a negra, acento en el 1 + síncope en el "y"
    // del 2 para el bounce de cancha.
    if (inBar % 4 === 0) kick(t, inBar === 0 ? 0.6 : 0.4);
    if (inBar === 6) kick(t, 0.32);
    // Palmas en el backbeat (2 y 4) — la hinchada acompañando.
    if (inBar === 4 || inBar === 12) clap(t, 0.1);
    // Pad: acorde nuevo al inicio de cada compás.
    if (inBar === 0) padChord(CHORDS[(s / 16) | 0], t, 16 * S16);
    // Brillo de gala cada 4 compases.
    if (s === 0) sparkle(t);
  }

  function startAmbient() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (amb) return;

    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.connect(master);
    amb = { out, nodes: [], timer: null, next: 0, step: 0 };

    // Murmullo de hinchada por debajo (rosa filtrado + oleadas lentas).
    const src = ctx.createBufferSource();
    src.buffer = pinkBuf(4); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const mg = ctx.createGain(); mg.gain.value = 0.45;
    src.connect(bp).connect(lp).connect(mg).connect(out);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.22;
    lfo.connect(lfoG).connect(mg.gain);
    src.start(); lfo.start();
    amb.nodes.push(src, lfo);

    out.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 2); // fade-in

    // Secuenciador.
    amb.next = ctx.currentTime + 0.15;
    amb.step = 0;
    amb.timer = setInterval(() => {
      if (!amb) return;
      while (amb.next < ctx.currentTime + 0.12) {
        try { scheduleStep(amb.step, amb.next); } catch (e) { /* noop */ }
        amb.next += S16;
        amb.step = (amb.step + 1) % 64;       // bucle de 4 compases
      }
    }, 25);
  }

  function stopAmbient() {
    if (!amb) return;
    const a = amb; amb = null;
    if (a.timer) clearInterval(a.timer);
    const t = ctx.currentTime;
    try {
      a.out.gain.cancelScheduledValues(t);
      a.out.gain.setValueAtTime(Math.max(a.out.gain.value, 0.0001), t);
      a.out.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); // fade-out
      a.nodes.forEach((n) => { try { n.stop(t + 1.4); } catch (e) { /* noop */ } });
    } catch (e) { /* noop */ }
  }

  // --- API ---
  function play(name) {
    if (muted) return;
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const fn = SOUNDS[name];
    if (!fn) return;
    try { fn(); } catch (e) { /* no romper la UI por audio */ }
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* noop */ }
    applyMute();
    return muted;
  }

  C.audio = {
    play,
    isMuted: () => muted,
    toggleMute() {
      setMuted(!muted);
      if (!muted) play('tap'); // feedback al reactivar
      return muted;
    },
    setMuted,
    isAmbient: () => ambOn,
    toggleAmbient() {
      ambOn = !ambOn;
      try { localStorage.setItem(AMB_KEY, ambOn ? '1' : '0'); } catch (e) { /* noop */ }
      if (ambOn) startAmbient(); else stopAmbient();
      return ambOn;
    }
  };

  // Desbloqueo del contexto con el primer gesto (autoplay policy).
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
    document.addEventListener(ev, unlock, { once: true, capture: true, passive: true }));
})();
