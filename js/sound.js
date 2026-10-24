"use strict";
/* =====================================================================
   MUSIQUE ET BRUITAGES, façon jeu vidéo rétro (Web Audio, rien à
   télécharger) :
   - une petite musique en boucle, composée ici même : mélodie en signal
     carré, basse en triangle et charleston en bruit blanc. Elle joue sur
     l'écran d'accueil (bouton 🎵) et, si le réglage « Musique » est coché,
     plus doucement pendant la partie ;
   - des bruitages (réglage « Bruitages ») : carte posée, pli gagné ou
     perdu, résultat de la donne, bonne ou mauvaise réponse, cadeau,
     distribution.
   Les navigateurs n'autorisent le son qu'après un premier clic ou une
   touche : tout démarre à ce moment-là. La musique baisse quand la voix
   parle.
   ===================================================================== */
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master, musicGain, sfxGain, noiseBuf;
  let want = null;                    // musique demandée : null, "intro" ou "game"
  let loop = null;                    // planificateur de la musique en cours

  // Le son ne peut démarrer qu'après un geste du joueur.
  function unlock() {
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.32; sfxGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    if (want && !loop) startLoop();
  }
  for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, unlock, { capture: true });

  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  // Une note : oscillateur avec une petite enveloppe, éventuellement glissée vers `to`.
  function tone(out, { f, t, d, type = "square", v = 0.3, to = null }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  function noise(out, { t, d, v = 0.2, hp = 6000 }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(out);
    s.start(t);
    s.stop(t + d + 0.02);
  }

  /* ---------- La musique ---------- */
  // 8 mesures en croches (0 = silence) ; basse en noires. Do majeur : Do, La mineur, Fa, Sol.
  const MELODY = [
    72, 76, 79, 76, 72, 76, 79, 84,   81, 79, 76, 72, 74, 76, 72, 0,
    77, 81, 84, 81, 77, 81, 84, 86,   83, 79, 74, 79, 83, 86, 83, 79,
    84, 0, 79, 0, 76, 79, 84, 88,     86, 84, 81, 76, 81, 84, 81, 0,
    77, 81, 84, 81, 79, 83, 86, 83,   84, 0, 79, 0, 72, 0, 0, 0,
  ];
  const BASS = [
    48, 55, 48, 55,  45, 52, 45, 52,  41, 48, 41, 48,  43, 50, 43, 50,
    48, 55, 48, 55,  45, 52, 45, 52,  41, 48, 43, 50,  48, 55, 48, 0,
  ];
  const STYLE = {
    intro: { tempo: 140, volume: 0.16, melody: 0.18 },
    game: { tempo: 112, volume: 0.07, melody: 0.12 },
  };

  function startLoop() {
    const st = STYLE[want];
    const eighth = 60 / st.tempo / 2;
    let step = 0, next = ctx.currentTime + 0.1;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(st.volume, ctx.currentTime, 0.3);
    // On planifie un peu d'avance, toutes les 100 ms.
    const timer = setInterval(() => {
      while (next < ctx.currentTime + 0.4) {
        const m = MELODY[step % MELODY.length];
        if (m) tone(musicGain, { f: hz(m), t: next, d: eighth * 0.9, type: "square", v: st.melody });
        if (step % 2 === 0) {
          const b = BASS[(step / 2) % BASS.length];
          if (b) tone(musicGain, { f: hz(b), t: next, d: eighth * 1.8, type: "triangle", v: 0.5 });
        }
        if (step % 2 === 1) noise(musicGain, { t: next, d: 0.04, v: 0.08 });
        step++;
        next += eighth;
      }
    }, 100);
    loop = { timer, style: want };
  }
  function stopLoop() {
    if (!loop) return;
    clearInterval(loop.timer);
    loop = null;
    if (ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  }

  // style : "intro", "game" ou null (silence).
  function music(style) {
    if (want === style) return;
    want = style;
    stopLoop();
    if (style && ctx && ctx.state === "running") startLoop();
  }

  // La voix parle : la musique baisse, puis remonte.
  function duck(on) {
    if (!ctx || !loop) return;
    const v = on ? STYLE[loop.style].volume * 0.3 : STYLE[loop.style].volume;
    musicGain.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
  }

  /* ---------- Les bruitages ---------- */
  const SFX = {
    card: t => { noise(sfxGain, { t, d: 0.05, v: 0.25, hp: 2500 }); tone(sfxGain, { f: 660, t, d: 0.05, type: "square", v: 0.06 }); },
    deal: t => noise(sfxGain, { t, d: 0.03, v: 0.12, hp: 4000 }),
    trickWin: t => [72, 76, 79].forEach((n, i) => tone(sfxGain, { f: hz(n), t: t + i * 0.07, d: 0.12, v: 0.18 })),
    trickLose: t => tone(sfxGain, { f: hz(60), t, d: 0.22, type: "triangle", v: 0.35, to: hz(55) }),
    ok: t => { tone(sfxGain, { f: hz(76), t, d: 0.1, v: 0.2 }); tone(sfxGain, { f: hz(84), t: t + 0.09, d: 0.22, v: 0.2 }); },
    ko: t => { tone(sfxGain, { f: hz(64), t, d: 0.14, type: "triangle", v: 0.35 }); tone(sfxGain, { f: hz(60), t: t + 0.13, d: 0.25, type: "triangle", v: 0.35 }); },
    gift: t => [79, 84, 88, 91, 96].forEach((n, i) => tone(sfxGain, { f: hz(n), t: t + i * 0.06, d: 0.18, v: 0.15 })),
    win: t => [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.5], [84, 0.62]].forEach(([n, d], i) =>
      tone(sfxGain, { f: hz(n), t: t + d, d: i === 5 ? 0.5 : 0.13, v: 0.2 })),
    tie: t => { tone(sfxGain, { f: hz(72), t, d: 0.18, v: 0.18 }); tone(sfxGain, { f: hz(72), t: t + 0.22, d: 0.3, v: 0.18 }); },
    lose: t => [[67, 0], [66, 0.22], [65, 0.44]].forEach(([n, d], i) =>
      tone(sfxGain, { f: hz(n), t: t + d, d: i === 2 ? 0.6 : 0.2, type: "triangle", v: 0.35, to: i === 2 ? hz(60) : null })),
    click: t => tone(sfxGain, { f: 880, t, d: 0.04, v: 0.08 }),
  };
  // Un bruitage, éventuellement décalé de `delay` secondes.
  function sfx(name, delay = 0) {
    if (!config.sfx || !ctx || ctx.state !== "running" || !SFX[name]) return;
    SFX[name](ctx.currentTime + 0.01 + delay);
  }

  return { music, sfx, duck, unlock };
})();
