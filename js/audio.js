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
  try { ambOn = localStorage.getItem(AMB_KEY) === '1'; } catch (e) { /* noop */ }

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

  // --- Ambiente: "estadio de noche" ---
  // Murmullo de hinchada (ruido marrón filtrado) con oleadas lentas + un
  // grave cálido que da la sensación del espacio. Procedural: no loopea de
  // forma audible. Volumen bajo, por debajo de los SFX.
  function makeBrownNoise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function startAmbient() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (amb) return;

    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.connect(master);

    // Murmullo filtrado.
    const src = ctx.createBufferSource();
    src.buffer = makeBrownNoise(4);
    src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const swell = ctx.createGain(); swell.gain.value = 0.8;
    src.connect(bp).connect(lp).connect(swell).connect(out);

    // Dos LFOs de distinta velocidad = oleadas que nunca se repiten igual.
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.18;
    lfo.connect(lfoG).connect(swell.gain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.021;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.12;
    lfo2.connect(lfo2G).connect(swell.gain);

    // Grave cálido (el "espacio" del estadio).
    const drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = 55;
    const droneG = ctx.createGain(); droneG.gain.value = 0.022;
    drone.connect(droneG).connect(out);

    src.start(); lfo.start(); lfo2.start(); drone.start();
    out.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 2.5); // fade-in suave

    amb = { out, nodes: [src, lfo, lfo2, drone] };
  }

  function stopAmbient() {
    if (!amb) return;
    const a = amb; amb = null;
    const t = ctx.currentTime;
    try {
      a.out.gain.cancelScheduledValues(t);
      a.out.gain.setValueAtTime(Math.max(a.out.gain.value, 0.0001), t);
      a.out.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); // fade-out
      a.nodes.forEach((n) => { try { n.stop(t + 1.7); } catch (e) { /* noop */ } });
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
