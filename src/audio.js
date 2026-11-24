// Sistema de áudio opcional em Web Audio API (música chiptune suave e efeitos sonoros)

let audioCtx = null;
let musicInterval = null;
let musicEnabled = true;
let noteIndex = 0;

// Melodia mágica noturna em Lá menor / Dó maior (frequências em Hz)
const MELODIA_NOTURNA = [
  440.0, 523.25, 659.25, 587.33,
  523.25, 440.0, 392.0, 440.0,
  349.23, 440.0, 523.25, 659.25,
  587.33, 523.25, 493.88, 392.0,
];

function garantirAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tocarNota(freq, duracao, tipo = 'triangle', volume = 0.045) {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const agora = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, agora);

  gain.gain.setValueAtTime(0.001, agora);
  gain.gain.linearRampToValueAtTime(volume, agora + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, agora + duracao);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(agora);
  osc.stop(agora + duracao + 0.02);
}

export function iniciarMusica() {
  garantirAudioContext();
  if (!musicEnabled || musicInterval !== null) return;

  musicInterval = window.setInterval(() => {
    if (!musicEnabled) return;
    const freq = MELODIA_NOTURNA[noteIndex % MELODIA_NOTURNA.length];
    tocarNota(freq, 0.34, 'triangle', 0.04);

    // Nota grave de acompanhamento a cada 4 tempos
    if (noteIndex % 4 === 0) {
      tocarNota(freq / 2, 0.72, 'sine', 0.035);
    }
    noteIndex += 1;
  }, 380);
}

export function pararMusica() {
  if (musicInterval !== null) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function alternarMusica() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    iniciarMusica();
  } else {
    pararMusica();
  }
  return musicEnabled;
}

export function estaMusicaLigada() {
  return musicEnabled;
}

export function tocarSomPulo() {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const agora = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(240, agora);
  osc.frequency.exponentialRampToValueAtTime(520, agora + 0.12);

  gain.gain.setValueAtTime(0.05, agora);
  gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(agora);
  osc.stop(agora + 0.15);
}

export function tocarSomEstrela() {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const notas = [587.33, 783.99, 1046.5];
  for (let i = 0; i < notas.length; i += 1) {
    const inicio = ctx.currentTime + i * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notas[i], inicio);

    gain.gain.setValueAtTime(0.08, inicio);
    gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + 0.24);
  }
}

export function tocarSomDano() {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const agora = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(190, agora);
  osc.frequency.linearRampToValueAtTime(95, agora + 0.2);

  gain.gain.setValueAtTime(0.06, agora);
  gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(agora);
  osc.stop(agora + 0.24);
}

export function tocarSomFaseConcluida() {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const notas = [523.25, 659.25, 783.99, 1046.5];
  for (let i = 0; i < notas.length; i += 1) {
    const inicio = ctx.currentTime + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notas[i], inicio);

    gain.gain.setValueAtTime(0.09, inicio);
    gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + 0.36);
  }
}

export function tocarSomClique() {
  const ctx = garantirAudioContext();
  if (!ctx || !musicEnabled) return;

  const agora = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(620, agora);
  gain.gain.setValueAtTime(0.04, agora);
  gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(agora);
  osc.stop(agora + 0.06);
}
