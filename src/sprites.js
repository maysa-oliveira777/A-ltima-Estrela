// Sprites em pixel art desenhados por matrizes de caracteres

const PALETA_SPRITES = {
  '.': null,
  // Lumi (personagem)
  C: '#342c78', // Capuz azul-roxo escuro
  B: '#5e56c2', // Capuz destaque azul-lilás
  P: '#f9e7ff', // Rosto claro
  E: '#191438', // Olhos escuros
  R: '#f279b8', // Cachecol rosa mágico
  L: '#b995ff', // Cachecol lilás
  M: '#261f59', // Manto roxo
  S: '#ffe58f', // Broche / brilho dourado
  F: '#8f72e0', // Bota / pé

  // Estrelas
  Y: '#ffe58f', // Amarelo estrela
  W: '#fff8db', // Brilho branco
  O: '#f7b7d2', // Contorno rosa claro

  // Flores / Cristais
  T: '#3b2b6b', // Caule
  G: '#5869bf', // Folha azulada
  K: '#f788c6', // Pétala rosa
  V: '#c299ff', // Pétala lilás
};

// Lumi parado (12x16)
export const SPRITE_LUMI_PARADO = [
  '....CCCC....',
  '...CBBBBC...',
  '..CBBBBBBC..',
  '..CBPPPPEC..',
  '..CBPPPPEC..',
  '...CPPPPC...',
  '..RRRRRLL...',
  '.RRLMMMMRR..',
  '..CMMSSMMC..',
  '..CMMMMMMC..',
  '..CMMMMMMC..',
  '...MMMMMM...',
  '...MM..MM...',
  '...FF..FF...',
  '..FFF..FFF..',
  '............',
];

// Lumi andando quadro 1 (12x16)
export const SPRITE_LUMI_ANDANDO_1 = [
  '....CCCC....',
  '...CBBBBC...',
  '..CBBBBBBC..',
  '..CBPPPPEC..',
  '..CBPPPPEC..',
  '...CPPPPC...',
  '.RRRRRRLL...',
  'RRL.MMMMMC..',
  '....MSSMMC..',
  '...CMMMMMC..',
  '...CMMMMM...',
  '...MM..MM...',
  '..FF....FF..',
  '.FFF....FFF.',
  '............',
  '............',
];

// Lumi andando quadro 2 (12x16)
export const SPRITE_LUMI_ANDANDO_2 = [
  '....CCCC....',
  '...CBBBBC...',
  '..CBBBBBBC..',
  '..CBPPPPEC..',
  '..CBPPPPEC..',
  '...CPPPPC...',
  '..RRRRRRLL..',
  '.RRLMMMMMC..',
  '...CMSSMMC..',
  '...CMMMMMC..',
  '...CMMMMM...',
  '....MM.MM...',
  '....FF.FF...',
  '...FFF.FFF..',
  '............',
  '............',
];

// Lumi pulando (12x16)
export const SPRITE_LUMI_PULANDO = [
  '....CCCC....',
  '...CBBBBC...',
  '..CBBBBBBC..',
  '..CBPPPPEC..',
  '..CBPPPPEC..',
  '..RCPPPPCR..',
  '.RRLLLLLLRR.',
  '.R.CMMMMC.R.',
  '...CMSSMC...',
  '...CMMMMC...',
  '..FFMMMMFF..',
  '.FFF....FFF.',
  '............',
  '............',
  '............',
  '............',
];

// Estrela normal quadro 1 (10x10)
export const SPRITE_ESTRELA_1 = [
  '....YY....',
  '....YY....',
  '...YWWY...',
  'YYYYWWYYYY',
  '.YYWWWWYY.',
  '..YWWWWY..',
  '..YYWWYY..',
  '.YYY..YYY.',
  'YY......YY',
  '..........',
];

// Estrela normal quadro 2 (10x10)
export const SPRITE_ESTRELA_2 = [
  '....OO....',
  '....YY....',
  '...YWWY...',
  '.YYYWWYYY.',
  '..YWWWWY..',
  '..YWWWWY..',
  '..YYWWYY..',
  '..YY..YY..',
  '.Y......Y.',
  '..........',
];

// Última Estrela especial (14x14)
export const SPRITE_ULTIMA_ESTRELA = [
  '......OO......',
  '......YY......',
  '.....YWWY.....',
  '....YYWWYY....',
  'OOOOYYWWYYOOOO',
  '.YYYYWWWWYYYY.',
  '..YYWWWWWWYY..',
  '...YWWWWWWY...',
  '...YYWWWWYY...',
  '..YYYWWWWYYY..',
  '..YYY....YYY..',
  '.YY........YY.',
  '.O..........O.',
  '..............',
];

// Flor mágica em pixel art (7x9)
export const SPRITE_FLOR = [
  '..K.K..',
  '.KVVVK.',
  '..KYK..',
  '.KVVVK.',
  '...G...',
  '..GG...',
  '...G.G.',
  '...GG..',
  '...T...',
];

/**
 * Desenha um sprite de matriz de pixels no canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} matriz
 * @param {number} x
 * @param {number} y
 * @param {number} escala
 * @param {boolean} espelhado
 */
export function desenharSprite(ctx, matriz, x, y, escala = 1, espelhado = false) {
  const altura = matriz.length;
  const largura = matriz[0].length;
  const baseX = Math.round(x);
  const baseY = Math.round(y);

  for (let linha = 0; linha < altura; linha += 1) {
    const textoLinha = matriz[linha];
    for (let col = 0; col < largura; col += 1) {
      const char = textoLinha[col];
      const cor = PALETA_SPRITES[char];
      if (!cor) continue;

      ctx.fillStyle = cor;
      const drawCol = espelhado ? largura - 1 - col : col;
      ctx.fillRect(baseX + drawCol * escala, baseY + linha * escala, escala, escala);
    }
  }
}
