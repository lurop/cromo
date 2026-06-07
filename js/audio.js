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
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* noop */ }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
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
    setMuted
  };

  // Desbloqueo del contexto con el primer gesto (autoplay policy).
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
    document.addEventListener(ev, unlock, { once: true, capture: true, passive: true }));
})();
