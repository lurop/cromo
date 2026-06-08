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

  // --- Ambiente: "gala teatral" ---
  // Bed cinematográfico y envolvente, SIN ruido: pad de cuerdas/coro con
  // acordes mayores7 que evolucionan + reverb de sala (teatro) + un timbal
  // grave y majestuoso por compás. Tonal puro — nada de ruido blanco/rosa.
  // Sin melodías ni cantos identificables (§2). Secuenciador look-ahead.
  const BPM = 70;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const CHORDS = [                          // progresión cálida que evoluciona
    [261.63, 329.63, 392.00, 493.88],       // Do maj7
    [220.00, 261.63, 329.63, 392.00],       // La m7
    [174.61, 261.63, 329.63, 440.00],       // Fa maj7
    [196.00, 293.66, 392.00, 493.88]        // Sol (add)
  ];

  // Respuesta al impulso para el reverb de sala (ruido que decae → cola).
  function reverbIR(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return ir;
  }

  // Timbal majestuoso (tonal, con caída de tono) — la pulsación teatral.
  function timpani(freq, t, gain) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g).connect(amb.bus);            // a través del reverb → "sala"
    o.start(t); o.stop(t + 1.2);
  }

  // Acorde de cuerdas: 2 saw detuneados por nota (coro) + sub grave.
  function padChord(freqs, t, dur) {
    freqs.forEach((fr) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = det;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.02, t + 0.9);     // attack lento
        g.gain.setValueAtTime(0.02, t + dur - 1.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);   // release largo
        o.connect(g).connect(amb.pad);
        o.start(t); o.stop(t + dur + 0.1);
      });
    });
    const sub = ctx.createOscillator(); const sg = ctx.createGain();
    sub.type = 'sine'; sub.frequency.value = freqs[0] / 2;
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.05, t + 0.9);
    sg.gain.setValueAtTime(0.05, t + dur - 1.1);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    sub.connect(sg).connect(amb.pad);
    sub.start(t); sub.stop(t + dur + 0.1);
  }

  // Brillo de gala (campanas suaves) cada tanto, a través del reverb.
  function sparkle(t) {
    [1568, 2093, 2637, 3136].forEach((fr, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const at = t + i * 0.16;
      o.type = 'triangle'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.018, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
      o.connect(g).connect(amb.bus);
      o.start(at); o.stop(at + 0.85);
    });
  }

  function scheduleBar(bar, t) {
    padChord(CHORDS[bar], t, BAR + 0.8);          // acordes legato (se solapan)
    timpani(CHORDS[bar][0] / 2, t, 0.3);          // timbal en el 1 de cada compás
    if (bar === 0) sparkle(t + BEAT * 2);         // brillo cada 4 compases
  }

  function startAmbient() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (amb) return;

    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.connect(master);

    // Reverb de sala (teatro) — la clave del "envolvente".
    const conv = ctx.createConvolver();
    conv.buffer = reverbIR(3.2, 2.5);
    const wet = ctx.createGain(); wet.gain.value = 0.7;
    const dry = ctx.createGain(); dry.gain.value = 0.55;
    conv.connect(wet).connect(out);
    dry.connect(out);

    // 'bus' = mezcla con reverb + dry (timbal, brillo).
    const bus = ctx.createGain(); bus.gain.value = 1;
    bus.connect(conv); bus.connect(dry);

    // 'pad' = cuerdas con un lowpass que respira (LFO) antes del bus.
    const padLp = ctx.createBiquadFilter(); padLp.type = 'lowpass';
    padLp.frequency.value = 1100; padLp.Q.value = 0.3;
    padLp.connect(bus);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain(); lfoG.gain.value = 350;
    lfo.connect(lfoG).connect(padLp.frequency);
    lfo.start();

    amb = { out, pad: padLp, bus, nodes: [lfo], timer: null, nextBar: 0, bar: 0 };

    out.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2.5); // fade-in

    amb.nextBar = ctx.currentTime + 0.25;
    amb.bar = 0;
    amb.timer = setInterval(() => {
      if (!amb) return;
      while (amb.nextBar < ctx.currentTime + 0.6) {
        try { scheduleBar(amb.bar, amb.nextBar); } catch (e) { /* noop */ }
        amb.nextBar += BAR;
        amb.bar = (amb.bar + 1) % 4;
      }
    }, 120);
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
