import { FASES } from './levels.js';
import {
  SPRITE_LUMI_PARADO,
  SPRITE_LUMI_ANDANDO_1,
  SPRITE_LUMI_ANDANDO_2,
  SPRITE_LUMI_PULANDO,
  SPRITE_ESTRELA_1,
  SPRITE_ESTRELA_2,
  SPRITE_ULTIMA_ESTRELA,
  SPRITE_FLOR,
  desenharSprite,
} from './sprites.js';
import {
  iniciarMusica,
  alternarMusica,
  estaMusicaLigada,
  tocarSomPulo,
  tocarSomEstrela,
  tocarSomDano,
  tocarSomFaseConcluida,
  tocarSomClique,
} from './audio.js';

// ==========================================
// 1. CONSTANTES E VARIÁVEIS DE ESTADO
// ==========================================
const LARGURA_TELA = 480;
const ALTURA_TELA = 270;
const GRAVIDADE = 0.38;
const VELOCIDADE_ANDAR = 2.4;
const FORCA_PULO = -7.2;

/** @type {HTMLCanvasElement} */
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('gameCanvas'));
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Referências de interface (HTML)
const hudBar = document.getElementById('hudBar');
const hudPhase = document.getElementById('hudPhase');
const hudStars = document.getElementById('hudStars');
const hudTotal = document.getElementById('hudTotal');
const touchControls = document.getElementById('touchControls');

const screenStart = document.getElementById('screenStart');
const screenHowTo = document.getElementById('screenHowTo');
const screenIntro = document.getElementById('screenIntro');
const screenPause = document.getElementById('screenPause');
const screenStageClear = document.getElementById('screenStageClear');
const screenVictory = document.getElementById('screenVictory');

const btnMusicStart = document.getElementById('btnMusicStart');
const btnHudMusic = document.getElementById('btnHudMusic');
const btnPauseMusic = document.getElementById('btnPauseMusic');

// Variáveis principais de pontuação, fase e fluxo do jogo
let estadoJogo = 'MENU'; // 'MENU' | 'COMO_JOGAR' | 'INTRO' | 'JOGANDO' | 'PAUSADO' | 'FASE_CONCLUIDA' | 'VITORIA'
let indiceFaseAtual = 0;
let pontuacaoTotal = 0;
let estrelasColetadasNaFase = 0;
let frameGlobal = 0;
let cameraX = 0;

// Arrays de elementos dinâmicos do jogo
let plataformas = [];
let obstaculos = [];
let estrelas = [];
let decoracoes = [];
let particulas = [];
let estrelasFundo = [];

// Estado do jogador (Lumi)
const jogador = {
  x: 42,
  y: 200,
  largura: 12,
  altura: 15,
  vx: 0,
  vy: 0,
  noChao: false,
  coyoteFrames: 0,
  olhandoEsquerda: false,
  invulneravelFrames: 0,
  quadroAnimacao: 0,
};

// Teclas pressionadas
const teclas = {
  esquerda: false,
  direita: false,
  pulo: false,
  puloTravado: false,
};

// ==========================================
// 2. INICIALIZAÇÃO DE CENÁRIO E FASES
// ==========================================

function criarEstrelasDeFundo() {
  estrelasFundo = [];
  const cores = ['#ffffff', '#c7b3ff', '#f7a6d7', '#9cc2ff', '#ffe58f'];
  for (let i = 0; i < 64; i += 1) {
    estrelasFundo.push({
      x: (i * 73 + 19) % LARGURA_TELA,
      y: (i * 41 + 11) % 185,
      tamanho: i % 5 === 0 ? 2 : 1,
      fasePiscar: i * 0.6,
      cor: cores[i % cores.length],
    });
  }
}

function carregarFase(indice) {
  indiceFaseAtual = indice;
  const dadosFase = FASES[indiceFaseAtual];

  // Clona arrays da fase para manter os originais intactos
  plataformas = dadosFase.plataformas.map((p) => ({ ...p, deltaX: 0 }));
  obstaculos = dadosFase.obstaculos.map((o) => ({ ...o }));
  estrelas = dadosFase.estrelas.map((e) => ({
    x: e.x,
    y: e.y,
    ultima: Boolean(e.ultima),
    coletada: false,
    flutuacao: Math.random() * Math.PI * 2,
  }));
  decoracoes = dadosFase.decoracoes.map((d) => ({ ...d }));
  particulas = [];

  estrelasColetadasNaFase = 0;
  reposicionarJogador();
  atualizarHud();
}

function reposicionarJogador() {
  const dadosFase = FASES[indiceFaseAtual];
  jogador.x = dadosFase.spawn.x;
  jogador.y = dadosFase.spawn.y;
  jogador.vx = 0;
  jogador.vy = 0;
  jogador.noChao = false;
  jogador.coyoteFrames = 0;
  jogador.olhandoEsquerda = false;
  jogador.invulneravelFrames = 45;
  cameraX = 0;
}

function criarParticulas(x, y, cores, quantidade = 12) {
  for (let i = 0; i < quantidade; i += 1) {
    const angulo = (Math.PI * 2 * i) / quantidade + Math.random() * 0.4;
    const velocidade = 0.7 + Math.random() * 1.9;
    particulas.push({
      x,
      y,
      vx: Math.cos(angulo) * velocidade,
      vy: Math.sin(angulo) * velocidade - 0.6,
      vida: 22 + Math.floor(Math.random() * 16),
      cor: cores[i % cores.length],
      tamanho: Math.random() > 0.5 ? 2 : 1,
    });
  }
}

// ==========================================
// 3. INTERFACE E TELAS
// ==========================================

function esconderTodasTelas() {
  screenStart.classList.add('hidden');
  screenHowTo.classList.add('hidden');
  screenIntro.classList.add('hidden');
  screenPause.classList.add('hidden');
  screenStageClear.classList.add('hidden');
  screenVictory.classList.add('hidden');
}

function atualizarRotulosMusica() {
  const texto = estaMusicaLigada() ? 'Música: Ligada' : 'Música: Desligada';
  btnMusicStart.textContent = texto;
  btnHudMusic.textContent = texto;
  btnPauseMusic.textContent = texto;
}

function atualizarHud() {
  const fase = FASES[indiceFaseAtual];
  hudPhase.textContent = fase.nome;
  hudStars.textContent = `Estrelas: ${estrelasColetadasNaFase} / ${estrelas.length}`;
  hudTotal.textContent = `Total: ${pontuacaoTotal}`;
}

function mostrarTela(nomeEstado) {
  estadoJogo = nomeEstado;
  esconderTodasTelas();

  if (nomeEstado === 'MENU') {
    hudBar.classList.add('hidden');
    touchControls.classList.add('hidden');
    screenStart.classList.remove('hidden');
  } else if (nomeEstado === 'COMO_JOGAR') {
    hudBar.classList.add('hidden');
    touchControls.classList.add('hidden');
    screenHowTo.classList.remove('hidden');
  } else if (nomeEstado === 'INTRO') {
    hudBar.classList.add('hidden');
    touchControls.classList.add('hidden');
    screenIntro.classList.remove('hidden');
  } else if (nomeEstado === 'JOGANDO') {
    hudBar.classList.remove('hidden');
    atualizarVisibilidadeControlesMoveis();
  } else if (nomeEstado === 'PAUSADO') {
    hudBar.classList.remove('hidden');
    screenPause.classList.remove('hidden');
  } else if (nomeEstado === 'FASE_CONCLUIDA') {
    hudBar.classList.remove('hidden');
    const faseAtual = FASES[indiceFaseAtual];
    const proximaFase = FASES[indiceFaseAtual + 1];
    document.getElementById('stageClearTitle').textContent = `${faseAtual.nome} Concluída!`;
    document.getElementById('stageClearText').textContent =
      `Você recuperou todas as ${estrelas.length} estrelas deste cenário. A caminho de: ${proximaFase.nome}.`;
    screenStageClear.classList.remove('hidden');
  } else if (nomeEstado === 'VITORIA') {
    hudBar.classList.add('hidden');
    touchControls.classList.add('hidden');
    document.getElementById('victoryStats').textContent = `Estrelas recuperadas: ${pontuacaoTotal}`;
    screenVictory.classList.remove('hidden');
  }
}

function atualizarVisibilidadeControlesMoveis() {
  const telaPequena = window.innerWidth <= 860 || 'ontouchstart' in window;
  if (telaPequena && estadoJogo === 'JOGANDO') {
    touchControls.classList.remove('hidden');
  } else {
    touchControls.classList.add('hidden');
  }
}

// ==========================================
// 4. LÓGICA DE MOVIMENTAÇÃO, COLISÕES E FASES
// ==========================================

function verificarSobreposicao(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.largura > b.x &&
    a.y < b.y + b.h &&
    a.y + a.altura > b.y
  );
}

function atualizarPlataformasEObstaculos() {
  // Atualiza plataformas móveis
  for (let i = 0; i < plataformas.length; i += 1) {
    const plat = plataformas[i];
    if (plat.movel && typeof plat.vx === 'number') {
      const xAnterior = plat.x;
      plat.x += plat.vx;
      if (plat.x <= plat.minX || plat.x >= plat.maxX) {
        plat.vx *= -1;
        plat.x = Math.max(plat.minX, Math.min(plat.maxX, plat.x));
      }
      plat.deltaX = plat.x - xAnterior;
    } else {
      plat.deltaX = 0;
    }
  }

  // Atualiza obstáculos móveis (nuvens elétricas e orbes sombrios)
  for (let i = 0; i < obstaculos.length; i += 1) {
    const obs = obstaculos[i];
    if (obs.movel) {
      if (typeof obs.vx === 'number') {
        obs.x += obs.vx;
        if (obs.x <= obs.minX || obs.x >= obs.maxX) {
          obs.vx *= -1;
        }
      }
      if (typeof obs.vy === 'number') {
        obs.y += obs.vy;
        if (obs.y <= obs.minY || obs.y >= obs.maxY) {
          obs.vy *= -1;
        }
      }
    }
  }
}

function atualizarMovimento() {
  const dadosFase = FASES[indiceFaseAtual];

  // Movimento horizontal
  if (teclas.esquerda && !teclas.direita) {
    jogador.vx = -VELOCIDADE_ANDAR;
    jogador.olhandoEsquerda = true;
    jogador.quadroAnimacao += 0.18;
  } else if (teclas.direita && !teclas.esquerda) {
    jogador.vx = VELOCIDADE_ANDAR;
    jogador.olhandoEsquerda = false;
    jogador.quadroAnimacao += 0.18;
  } else {
    jogador.vx = 0;
    jogador.quadroAnimacao = 0;
  }

  // Coyote time para saltos mais confortáveis
  if (jogador.noChao) {
    jogador.coyoteFrames = 6;
  } else if (jogador.coyoteFrames > 0) {
    jogador.coyoteFrames -= 1;
  }

  // Pulo
  if (teclas.pulo && !teclas.puloTravado && jogador.coyoteFrames > 0) {
    jogador.vy = FORCA_PULO;
    jogador.noChao = false;
    jogador.coyoteFrames = 0;
    teclas.puloTravado = true;
    tocarSomPulo();
    criarParticulas(jogador.x + jogador.largura / 2, jogador.y + jogador.altura, ['#a98df2', '#f279b8'], 6);
  }
  if (!teclas.pulo) {
    teclas.puloTravado = false;
  }

  // Gravidade
  jogador.vy = Math.min(jogador.vy + GRAVIDADE, 7.5);

  // Movimento X e colisão horizontal com plataformas
  jogador.x += jogador.vx;
  if (jogador.x < 0) jogador.x = 0;
  if (jogador.x + jogador.largura > dadosFase.larguraMundo) {
    jogador.x = dadosFase.larguraMundo - jogador.largura;
  }

  for (let i = 0; i < plataformas.length; i += 1) {
    const plat = plataformas[i];
    if (verificarSobreposicao(jogador, plat)) {
      if (jogador.vx > 0) {
        jogador.x = plat.x - jogador.largura;
      } else if (jogador.vx < 0) {
        jogador.x = plat.x + plat.w;
      }
    }
  }

  // Movimento Y e colisão vertical com plataformas
  const yAntes = jogador.y;
  jogador.y += jogador.vy;
  jogador.noChao = false;

  for (let i = 0; i < plataformas.length; i += 1) {
    const plat = plataformas[i];
    if (verificarSobreposicao(jogador, plat)) {
      if (jogador.vy >= 0 && yAntes + jogador.altura <= plat.y + 6) {
        jogador.y = plat.y - jogador.altura;
        jogador.vy = 0;
        jogador.noChao = true;
        // Acompanha plataforma móvel
        if (plat.deltaX) {
          jogador.x += plat.deltaX;
        }
      } else if (jogador.vy < 0 && yAntes >= plat.y + plat.h - 6) {
        jogador.y = plat.y + plat.h;
        jogador.vy = 0;
      }
    }
  }

  // Queda no vazio retorna suavemente ao início da fase
  if (jogador.y > ALTURA_TELA + 26) {
    tocarSomDano();
    reposicionarJogador();
  }

  if (jogador.invulneravelFrames > 0) {
    jogador.invulneravelFrames -= 1;
  }

  // Atualiza câmera acompanhando Lumi
  const alvoCamera = jogador.x + jogador.largura / 2 - LARGURA_TELA / 2;
  const maxCamera = Math.max(0, dadosFase.larguraMundo - LARGURA_TELA);
  cameraX += (Math.max(0, Math.min(maxCamera, alvoCamera)) - cameraX) * 0.16;
}

function verificarColisoesObstaculos() {
  if (jogador.invulneravelFrames > 0) return;

  for (let i = 0; i < obstaculos.length; i += 1) {
    const obs = obstaculos[i];
    // Caixa de colisão levemente menor para ser justa ao jogador
    const caixaObs = {
      x: obs.x + 2,
      y: obs.y + 2,
      w: Math.max(4, obs.w - 4),
      h: Math.max(4, obs.h - 3),
    };

    if (verificarSobreposicao(jogador, caixaObs)) {
      tocarSomDano();
      criarParticulas(
        jogador.x + jogador.largura / 2,
        jogador.y + jogador.altura / 2,
        ['#f279b8', '#a98df2', '#ffffff'],
        14
      );
      reposicionarJogador();
      return;
    }
  }
}

function coletarEstrelas() {
  for (let i = 0; i < estrelas.length; i += 1) {
    const estrela = estrelas[i];
    if (estrela.coletada) continue;

    const tamanho = estrela.ultima ? 14 : 10;
    const caixaEstrela = {
      x: estrela.x,
      y: estrela.y + Math.sin(frameGlobal * 0.08 + estrela.flutuacao) * 2.5,
      w: tamanho,
      h: tamanho,
    };

    if (verificarSobreposicao(jogador, caixaEstrela)) {
      estrela.coletada = true;
      estrelasColetadasNaFase += 1;
      pontuacaoTotal += 1;
      tocarSomEstrela();
      atualizarHud();

      criarParticulas(
        estrela.x + tamanho / 2,
        estrela.y + tamanho / 2,
        ['#ffe58f', '#f7a6d7', '#b995ff', '#ffffff'],
        estrela.ultima ? 24 : 14
      );

      // Verifica se todas as estrelas da fase foram coletadas
      if (estrelasColetadasNaFase === estrelas.length) {
        tocarSomFaseConcluida();
        if (indiceFaseAtual < FASES.length - 1) {
          mostrarTela('FASE_CONCLUIDA');
        } else {
          mostrarTela('VITORIA');
        }
      }
    }
  }
}

function avancarFase() {
  const proximoIndice = indiceFaseAtual + 1;
  if (proximoIndice < FASES.length) {
    carregarFase(proximoIndice);
    mostrarTela('JOGANDO');
  } else {
    mostrarTela('VITORIA');
  }
}

function atualizarParticulas() {
  for (let i = particulas.length - 1; i >= 0; i -= 1) {
    const p = particulas[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vida -= 1;
    if (p.vida <= 0) {
      particulas.splice(i, 1);
    }
  }
}

// ==========================================
// 5. RENDERIZAÇÃO EM PIXEL ART NO CANVAS
// ==========================================

function desenharCeuELuas(dadosFase) {
  // Gradiente vertical em faixas discretas estilo pixel art
  const grad = ctx.createLinearGradient(0, 0, 0, ALTURA_TELA);
  grad.addColorStop(0, dadosFase.cores.ceuTopo);
  grad.addColorStop(1, dadosFase.cores.ceuBase);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

  // Estrelas do fundo cintilantes
  const brilhoExtra = estadoJogo === 'VITORIA' ? 1 : 0;
  for (let i = 0; i < estrelasFundo.length; i += 1) {
    const est = estrelasFundo[i];
    const piscar = Math.sin(frameGlobal * 0.05 + est.fasePiscar);
    if (piscar > -0.65 || brilhoExtra) {
      const px = Math.floor((est.x - cameraX * 0.12 + LARGURA_TELA) % LARGURA_TELA);
      ctx.fillStyle = est.cor;
      ctx.fillRect(px, est.y, est.tamanho, est.tamanho);
    }
  }

  // Luas temáticas por fase
  if (dadosFase.tema === 'floresta') {
    const luaX = Math.round(375 - cameraX * 0.08);
    ctx.fillStyle = '#e7dcff';
    ctx.fillRect(luaX, 26, 26, 26);
    ctx.fillRect(luaX - 2, 30, 30, 18);
    ctx.fillRect(luaX + 4, 24, 18, 30);
    // Recorte crescente
    ctx.fillStyle = dadosFase.cores.ceuTopo;
    ctx.fillRect(luaX + 8, 22, 22, 26);
  } else if (dadosFase.tema === 'nuvens') {
    // Duas luas lilás e rosa
    const lua1X = Math.round(340 - cameraX * 0.08);
    ctx.fillStyle = '#f9c2e6';
    ctx.fillRect(lua1X, 24, 24, 24);
    ctx.fillRect(lua1X - 2, 28, 28, 16);
    ctx.fillStyle = '#d5b3ff';
    ctx.fillRect(lua1X - 42, 46, 12, 12);
  } else {
    // Grande lua mística com anel estelar
    const luaX = Math.round(230 - cameraX * 0.06);
    ctx.fillStyle = '#c8b0ff';
    ctx.fillRect(luaX, 22, 32, 32);
    ctx.fillRect(luaX - 3, 27, 38, 22);
    ctx.fillStyle = '#f279b8';
    ctx.fillRect(luaX - 10, 37, 52, 3);
  }

  // Montanhas distantes em parallax
  ctx.fillStyle = dadosFase.cores.montanhaFundo;
  for (let m = -1; m < 6; m += 1) {
    const mx = Math.round(m * 120 - (cameraX * 0.22) % 120);
    ctx.beginPath();
    ctx.moveTo(mx, ALTURA_TELA);
    ctx.lineTo(mx + 60, 148 + (m % 2) * 16);
    ctx.lineTo(mx + 125, ALTURA_TELA);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = dadosFase.cores.montanhaFrente;
  for (let m = -1; m < 6; m += 1) {
    const mx = Math.round(m * 105 - (cameraX * 0.38) % 105);
    ctx.beginPath();
    ctx.moveTo(mx, ALTURA_TELA);
    ctx.lineTo(mx + 52, 175 + ((m + 1) % 2) * 18);
    ctx.lineTo(mx + 110, ALTURA_TELA);
    ctx.closePath();
    ctx.fill();
  }
}

function desenharDecoracoes(dadosFase) {
  for (let i = 0; i < decoracoes.length; i += 1) {
    const d = decoracoes[i];
    const dx = Math.round(d.x - cameraX);
    if (dx < -40 || dx > LARGURA_TELA + 40) continue;

    if (d.tipo === 'arvore') {
      const h = d.altura || 54;
      // Tronco
      ctx.fillStyle = '#2d1c4d';
      ctx.fillRect(dx - 3, d.y - 18, 6, 18);
      // Copa em camadas pixel art
      ctx.fillStyle = '#33296b';
      ctx.fillRect(dx - 16, d.y - h + 22, 32, 16);
      ctx.fillStyle = '#483b91';
      ctx.fillRect(dx - 12, d.y - h + 10, 24, 14);
      ctx.fillStyle = '#6c56bd';
      ctx.fillRect(dx - 7, d.y - h, 14, 12);
      // Pontinhos mágicos na copa
      ctx.fillStyle = '#f279b8';
      ctx.fillRect(dx - 6, d.y - h + 14, 2, 2);
      ctx.fillStyle = '#ffe58f';
      ctx.fillRect(dx + 5, d.y - h + 25, 2, 2);
    } else if (d.tipo === 'flor') {
      desenharSprite(ctx, SPRITE_FLOR, dx - 3, d.y - 9, 1, false);
    } else if (d.tipo === 'cristal_deco') {
      ctx.fillStyle = '#8b57d6';
      ctx.fillRect(dx - 3, d.y - 14, 6, 14);
      ctx.fillStyle = '#f279b8';
      ctx.fillRect(dx - 2, d.y - 18, 4, 6);
      ctx.fillStyle = '#ffe58f';
      ctx.fillRect(dx - 1, d.y - 16, 2, 2);
    }
  }

  // Vaga-lumes sutis na Floresta Encantada
  if (dadosFase.tema === 'floresta') {
    for (let v = 0; v < 8; v += 1) {
      const vx = Math.round(((v * 117 + frameGlobal * 0.4) % dadosFase.larguraMundo) - cameraX);
      const vy = Math.round(140 + Math.sin(frameGlobal * 0.05 + v) * 28);
      ctx.fillStyle = v % 2 === 0 ? '#ffe58f' : '#f279b8';
      ctx.fillRect(vx, vy, 2, 2);
    }
  }
}

function desenharPlataformas(dadosFase) {
  for (let i = 0; i < plataformas.length; i += 1) {
    const p = plataformas[i];
    const px = Math.round(p.x - cameraX);
    if (px + p.w < -10 || px > LARGURA_TELA + 10) continue;

    if (p.tipo === 'nuvem') {
      // Nuvem fofa em pixel art
      ctx.fillStyle = dadosFase.cores.chaoCorpo;
      ctx.fillRect(px + 2, p.y + 3, p.w - 4, p.h - 3);
      ctx.fillStyle = dadosFase.cores.chaoTopo;
      ctx.fillRect(px, p.y, p.w, 6);
      ctx.fillRect(px + 6, p.y - 3, p.w - 12, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 8, p.y - 2, Math.max(8, p.w - 22), 2);
    } else if (p.tipo === 'cristal') {
      ctx.fillStyle = dadosFase.cores.plataformaCorpo;
      ctx.fillRect(px, p.y + 3, p.w, p.h - 3);
      ctx.fillStyle = dadosFase.cores.plataformaTopo;
      ctx.fillRect(px, p.y, p.w, 4);
      ctx.fillStyle = '#f279b8';
      ctx.fillRect(px + 2, p.y + 1, p.w - 4, 1);
    } else {
      const ehChao = p.tipo === 'chao';
      ctx.fillStyle = ehChao ? dadosFase.cores.chaoCorpo : dadosFase.cores.plataformaCorpo;
      ctx.fillRect(px, p.y + 4, p.w, p.h - 4);
      ctx.fillStyle = ehChao ? dadosFase.cores.chaoTopo : dadosFase.cores.plataformaTopo;
      ctx.fillRect(px, p.y, p.w, 4);
      // Detalhes de pixel na borda
      ctx.fillStyle = '#c7b3ff';
      for (let gx = 4; gx < p.w - 6; gx += 12) {
        ctx.fillRect(px + gx, p.y + 1, 4, 1);
      }
    }
  }
}

function desenharObstaculos() {
  for (let i = 0; i < obstaculos.length; i += 1) {
    const o = obstaculos[i];
    const ox = Math.round(o.x - cameraX);
    if (ox + o.w < -10 || ox > LARGURA_TELA + 10) continue;

    if (o.tipo === 'espinho') {
      // Espinhos sombrios com ponta rosa
      for (let sx = 0; sx < o.w; sx += 8) {
        ctx.fillStyle = '#361a4f';
        ctx.fillRect(ox + sx, o.y + 4, 8, 6);
        ctx.fillRect(ox + sx + 2, o.y + 2, 4, 2);
        ctx.fillStyle = '#f25ca7';
        ctx.fillRect(ox + sx + 3, o.y, 2, 2);
      }
    } else if (o.tipo === 'nuvem_eletrica') {
      ctx.fillStyle = '#311a54';
      ctx.fillRect(ox, o.y + 3, o.w, o.h - 3);
      ctx.fillRect(ox + 3, o.y, o.w - 6, 4);
      // Faísca alternando
      if (Math.floor(frameGlobal / 8) % 2 === 0) {
        ctx.fillStyle = '#ff6ec7';
        ctx.fillRect(ox + 5, o.y + o.h - 2, 3, 4);
        ctx.fillRect(ox + o.w - 8, o.y + 4, 2, 4);
      }
    } else if (o.tipo === 'orbe') {
      ctx.fillStyle = '#200f3d';
      ctx.fillRect(ox + 2, o.y, o.w - 4, o.h);
      ctx.fillRect(ox, o.y + 2, o.w, o.h - 4);
      ctx.fillStyle = Math.floor(frameGlobal / 6) % 2 === 0 ? '#f25ca7' : '#a98df2';
      ctx.fillRect(ox + 5, o.y + 5, 4, 4);
    }
  }
}

function desenharEstrelas() {
  for (let i = 0; i < estrelas.length; i += 1) {
    const e = estrelas[i];
    if (e.coletada) continue;

    const ex = Math.round(e.x - cameraX);
    if (ex < -24 || ex > LARGURA_TELA + 24) continue;

    const flutuacaoY = Math.round(Math.sin(frameGlobal * 0.08 + e.flutuacao) * 2.5);
    const ey = Math.round(e.y + flutuacaoY);

    // Aura luminosa sutil atrás da estrela
    ctx.fillStyle = e.ultima ? 'rgba(242, 121, 184, 0.25)' : 'rgba(255, 229, 143, 0.2)';
    ctx.fillRect(ex - 2, ey - 2, e.ultima ? 18 : 14, e.ultima ? 18 : 14);

    if (e.ultima) {
      desenharSprite(ctx, SPRITE_ULTIMA_ESTRELA, ex, ey, 1, false);
    } else {
      const spriteEstrela = Math.floor(frameGlobal / 14 + i) % 2 === 0 ? SPRITE_ESTRELA_1 : SPRITE_ESTRELA_2;
      desenharSprite(ctx, spriteEstrela, ex, ey, 1, false);
    }
  }
}

function desenharJogador() {
  // Piscar quando invulnerável após dano
  if (jogador.invulneravelFrames > 0 && Math.floor(jogador.invulneravelFrames / 4) % 2 === 1) {
    return;
  }

  let sprite = SPRITE_LUMI_PARADO;
  if (!jogador.noChao) {
    sprite = SPRITE_LUMI_PULANDO;
  } else if (Math.abs(jogador.vx) > 0.1) {
    sprite = Math.floor(jogador.quadroAnimacao) % 2 === 0 ? SPRITE_LUMI_ANDANDO_1 : SPRITE_LUMI_ANDANDO_2;
  }

  const px = Math.round(jogador.x - cameraX);
  const py = Math.round(jogador.y);
  desenharSprite(ctx, sprite, px, py, 1, jogador.olhandoEsquerda);
}

function desenharParticulas() {
  for (let i = 0; i < particulas.length; i += 1) {
    const p = particulas[i];
    ctx.fillStyle = p.cor;
    ctx.fillRect(Math.round(p.x - cameraX), Math.round(p.y), p.tamanho, p.tamanho);
  }
}

function desenharCena() {
  const dadosFase = FASES[indiceFaseAtual];
  desenharCeuELuas(dadosFase);
  desenharDecoracoes(dadosFase);
  desenharPlataformas(dadosFase);
  desenharObstaculos();
  desenharEstrelas();

  if (estadoJogo === 'JOGANDO' || estadoJogo === 'PAUSADO' || estadoJogo === 'FASE_CONCLUIDA') {
    desenharJogador();
  }
  desenharParticulas();
}

// ==========================================
// 6. LOOP PRINCIPAL COM PASSO FIXO (60 FPS)
// ==========================================

let ultimoTempo = performance.now();
let acumulador = 0;
const PASSO_FIXO = 1000 / 60;

function loopPrincipal(tempoAtual) {
  const delta = Math.min(tempoAtual - ultimoTempo, 100);
  ultimoTempo = tempoAtual;
  acumulador += delta;

  while (acumulador >= PASSO_FIXO) {
    frameGlobal += 1;

    if (estadoJogo === 'JOGANDO') {
      atualizarPlataformasEObstaculos();
      atualizarMovimento();
      verificarColisoesObstaculos();
      coletarEstrelas();
      atualizarParticulas();
    } else if (estadoJogo === 'MENU' || estadoJogo === 'INTRO' || estadoJogo === 'VITORIA') {
      // Anima o cenário de fundo suavemente mesmo nos menus
      cameraX = (Math.sin(frameGlobal * 0.004) + 1) * 80;
      if (estadoJogo === 'VITORIA' && frameGlobal % 18 === 0) {
        criarParticulas(
          cameraX + 40 + Math.random() * (LARGURA_TELA - 80),
          35 + Math.random() * 120,
          ['#ffe58f', '#f279b8', '#c7b3ff', '#9cc2ff'],
          8
        );
      }
      atualizarParticulas();
    }

    acumulador -= PASSO_FIXO;
  }

  desenharCena();
  window.requestAnimationFrame(loopPrincipal);
}

// ==========================================
// 7. EVENTOS DE TECLADO, TOQUE E BOTÕES
// ==========================================

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    teclas.esquerda = true;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    teclas.direita = true;
  } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (estadoJogo === 'JOGANDO') {
      e.preventDefault();
    }
    teclas.pulo = true;
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    if (estadoJogo === 'JOGANDO') {
      tocarSomClique();
      mostrarTela('PAUSADO');
    } else if (estadoJogo === 'PAUSADO') {
      tocarSomClique();
      mostrarTela('JOGANDO');
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    teclas.esquerda = false;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    teclas.direita = false;
  } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    teclas.pulo = false;
  }
});

// Botões táteis para telas pequenas
function configurarBotaoTatil(elementoId, propriedadeTecla) {
  const btn = document.getElementById(elementoId);
  const ativar = (ev) => {
    ev.preventDefault();
    teclas[propriedadeTecla] = true;
  };
  const desativar = (ev) => {
    ev.preventDefault();
    teclas[propriedadeTecla] = false;
  };
  btn.addEventListener('pointerdown', ativar);
  btn.addEventListener('pointerup', desativar);
  btn.addEventListener('pointerleave', desativar);
  btn.addEventListener('pointercancel', desativar);
}

configurarBotaoTatil('touchLeft', 'esquerda');
configurarBotaoTatil('touchRight', 'direita');
configurarBotaoTatil('touchJump', 'pulo');

window.addEventListener('resize', atualizarVisibilidadeControlesMoveis);

// Botões de navegação da interface
document.getElementById('btnStart').addEventListener('click', () => {
  iniciarMusica();
  tocarSomClique();
  mostrarTela('INTRO');
});

document.getElementById('btnHowTo').addEventListener('click', () => {
  tocarSomClique();
  mostrarTela('COMO_JOGAR');
});

document.getElementById('btnBackFromHowTo').addEventListener('click', () => {
  tocarSomClique();
  mostrarTela('MENU');
});

document.getElementById('btnBeginAdventure').addEventListener('click', () => {
  iniciarMusica();
  tocarSomClique();
  pontuacaoTotal = 0;
  carregarFase(0);
  mostrarTela('JOGANDO');
});

document.getElementById('btnPause').addEventListener('click', () => {
  if (estadoJogo === 'JOGANDO') {
    tocarSomClique();
    mostrarTela('PAUSADO');
  }
});

document.getElementById('btnResume').addEventListener('click', () => {
  tocarSomClique();
  mostrarTela('JOGANDO');
});

document.getElementById('btnRestartLevel').addEventListener('click', () => {
  tocarSomClique();
  // Desconta estrelas da fase atual caso o jogador reinicie a fase
  pontuacaoTotal = Math.max(0, pontuacaoTotal - estrelasColetadasNaFase);
  carregarFase(indiceFaseAtual);
  mostrarTela('JOGANDO');
});

document.getElementById('btnQuitToMenu').addEventListener('click', () => {
  tocarSomClique();
  carregarFase(0);
  mostrarTela('MENU');
});

document.getElementById('btnNextStage').addEventListener('click', () => {
  tocarSomClique();
  avancarFase();
});

document.getElementById('btnPlayAgain').addEventListener('click', () => {
  iniciarMusica();
  tocarSomClique();
  pontuacaoTotal = 0;
  carregarFase(0);
  mostrarTela('JOGANDO');
});

document.getElementById('btnVictoryMenu').addEventListener('click', () => {
  tocarSomClique();
  pontuacaoTotal = 0;
  carregarFase(0);
  mostrarTela('MENU');
});

function lidarComBotaoMusica() {
  alternarMusica();
  atualizarRotulosMusica();
  tocarSomClique();
}

btnMusicStart.addEventListener('click', lidarComBotaoMusica);
btnHudMusic.addEventListener('click', lidarComBotaoMusica);
btnPauseMusic.addEventListener('click', lidarComBotaoMusica);

// Inicialização
criarEstrelasDeFundo();
carregarFase(0);
atualizarRotulosMusica();
mostrarTela('MENU');
window.requestAnimationFrame(loopPrincipal);
