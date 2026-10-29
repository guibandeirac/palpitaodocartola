// Galeria de títulos do Grupo Palpitão.
// Fonte original: site PalpiScore (Canva), atualizado até 2024.
// Para adicionar um título novo, basta incluir uma entrada em TITULOS.

export type CompeticaoId =
  | "champions"
  | "champions_b"
  | "copa"
  | "liga_classica"
  | "palpite"
  | "super_copa"
  | "pontos_corridos"
  | "artilheiro"
  | "artilheiro_b";

export interface Competicao {
  id: CompeticaoId;
  nome: string;
  emoji: string;
  /** Logo em public/logos; sem logo, usa o emoji */
  logo?: string;
  /** Títulos de clube contam para a galeria dos clubes; individuais só para jogadores. */
  tipo: "clube" | "individual";
}

export const COMPETICOES: Record<CompeticaoId, Competicao> = {
  champions: { id: "champions", nome: "Palpitão Champions League", emoji: "🏆", logo: "/logos/champions.jpg", tipo: "clube" },
  champions_b: { id: "champions_b", nome: "Palpitão Champions League B", emoji: "🥈", logo: "/logos/champions.jpg", tipo: "clube" },
  copa: { id: "copa", nome: "Copa Palpitão", emoji: "🏅", logo: "/logos/copa-palpitao.jpg", tipo: "clube" },
  liga_classica: { id: "liga_classica", nome: "Liga Clássica", emoji: "📜", logo: "/logos/liga.jpg", tipo: "individual" },
  palpite: { id: "palpite", nome: "Palpite", emoji: "🎯", logo: "/logos/palpites.jpg", tipo: "individual" },
  super_copa: { id: "super_copa", nome: "Super Copa", emoji: "⭐", logo: "/logos/supercopa.jpg", tipo: "individual" },
  pontos_corridos: { id: "pontos_corridos", nome: "Liga de Pontos Corridos Palpitão", emoji: "📊", tipo: "individual" },
  artilheiro: { id: "artilheiro", nome: "Artilheiro Champions League", emoji: "⚽", tipo: "individual" },
  artilheiro_b: { id: "artilheiro_b", nome: "Artilheiro Champions League B", emoji: "⚽", tipo: "individual" },
};

export interface Titulo {
  competicao: CompeticaoId;
  ano: number;
  /** Clube campeão (somente títulos de clube). */
  clube?: string;
  jogadores: string[];
}

export const TITULOS: Titulo[] = [
  // Palpitão Champions League
  { competicao: "champions", ano: 2018, clube: "Dynamo", jogadores: ["Felipe Gonçalves", "Pedro Henrik", "Anthony", "Enzo Puglia", "Lucas Henrique", "Advaldo"] },
  { competicao: "champions", ano: 2019, clube: "Galácticos", jogadores: ["Samuel", "Bruno Rodrigues", "Carol Lopes", "Cleverson Pires", "Daniel Alves", "João Vitor (31)", "Nicolas Santos"] },
  { competicao: "champions", ano: 2020, clube: "Jumentus", jogadores: ["Felipe Silva", "Kauã Silva", "Paulo Lagranha", "Saulo", "Braço", "Ítalo Obermuller", "Leo Ferracini", "Pablo Campos"] },
  { competicao: "champions", ano: 2021, clube: "Irreal Madrid", jogadores: ["Fernando", "Rubens Bandeira", "Ertal", "Kaka", "Pedro Bhering", "Pedro Henrique"] },
  { competicao: "champions", ano: 2022, clube: "Galácticos", jogadores: ["Henrique Souza", "Rubens Bandeira", "Samuel", "Carlos Eduardo", "Dinho", "Vinicius"] },
  { competicao: "champions", ano: 2023, clube: "Galácticos", jogadores: ["Diller Felicio", "Samuel", "Dinho", "Saulo", "Bernardo", "Tito Jacobina"] },
  { competicao: "champions", ano: 2024, clube: "Dynamo", jogadores: ["Diller Felicio", "Italo Costa", "Vitor Salzman", "Andre Gustavo", "Felipe Varela", "Pedro Henrik"] },

  // Palpitão Champions League B
  { competicao: "champions_b", ano: 2024, clube: "Legends", jogadores: ["Felipe Barbosa", "Raphael Rosário", "Antonio Gui", "Gui Bandeira", "João Vitor (84)", "Nattan Sollived"] },

  // Copa Palpitão
  { competicao: "copa", ano: 2021, clube: "Irreal Madrid", jogadores: ["Fernando", "Rubens Bandeira", "Ertal", "Kaka", "Pedro Bhering", "Pedro Henrique"] },
  { competicao: "copa", ano: 2022, clube: "Jumentus", jogadores: ["Felipe Silva", "Kauã Silva", "Bruno Sampaio", "Cauã MB", "Mateus", "Willian Silvah"] },
  { competicao: "copa", ano: 2023, clube: "Baile de Munique", jogadores: ["Felipe Gonçalves", "Italo Costa", "Carlos Eduardo", "Paulo Lagranha", "Edy", "Moisés"] },
  { competicao: "copa", ano: 2024, clube: "Legends", jogadores: ["Felipe Barbosa", "Raphael Rosário", "Antonio Gui", "Gui Bandeira", "João Vitor (84)", "Nattan Sollived"] },

  // Liga Clássica
  { competicao: "liga_classica", ano: 2016, jogadores: ["Diller Felicio"] },
  { competicao: "liga_classica", ano: 2017, jogadores: ["Caipira Matheus"] },
  { competicao: "liga_classica", ano: 2018, jogadores: ["Amós"] },
  { competicao: "liga_classica", ano: 2019, jogadores: ["Thiago"] },
  { competicao: "liga_classica", ano: 2020, jogadores: ["Matheus Mota"] },
  { competicao: "liga_classica", ano: 2021, jogadores: ["Thiago"] },
  { competicao: "liga_classica", ano: 2022, jogadores: ["Felipe Silva"] },
  { competicao: "liga_classica", ano: 2023, jogadores: ["Felipe Gonçalves"] },
  { competicao: "liga_classica", ano: 2024, jogadores: ["Felipe Barbosa"] },

  // Palpite
  { competicao: "palpite", ano: 2019, jogadores: ["Felipe Gonçalves"] },
  { competicao: "palpite", ano: 2020, jogadores: ["Raphael Rosário", "Andico"] },
  { competicao: "palpite", ano: 2021, jogadores: ["Felipe Silva"] },
  { competicao: "palpite", ano: 2022, jogadores: ["Fernando"] },
  { competicao: "palpite", ano: 2023, jogadores: ["Felipe Gonçalves"] },
  { competicao: "palpite", ano: 2024, jogadores: ["Fernando"] },

  // Super Copa
  { competicao: "super_copa", ano: 2023, jogadores: ["Vitor Salzman", "Sávio"] },
  { competicao: "super_copa", ano: 2024, jogadores: ["Felipe Silva", "Henrique Souza"] },

  // Liga de Pontos Corridos
  { competicao: "pontos_corridos", ano: 2024, jogadores: ["Felipe Silva"] },

  // Artilharia
  { competicao: "artilheiro", ano: 2021, jogadores: ["Kauã Silva"] },
  { competicao: "artilheiro", ano: 2022, jogadores: ["Felipe Silva"] },
  { competicao: "artilheiro", ano: 2023, jogadores: ["Felipe Gonçalves", "Henrique Souza"] },
  { competicao: "artilheiro", ano: 2024, jogadores: ["Italo Costa", "Vitor Salzman"] },
  { competicao: "artilheiro_b", ano: 2024, jogadores: ["Felipe Barbosa"] },

  // Temporada 2025
  { competicao: "champions", ano: 2025, clube: "Dynamo", jogadores: ["Pedro Henrik", "Italo Costa", "Gerson Luz", "Paulo Lagranha", "Gabriell (82)", "Gui Bandeira"] },
  { competicao: "copa", ano: 2025, clube: "Dynamo", jogadores: ["Pedro Henrik", "Italo Costa", "Gerson Luz", "Paulo Lagranha", "Gabriell (82)", "Gui Bandeira"] },
  { competicao: "champions_b", ano: 2025, clube: "Malfica", jogadores: ["Andre Gustavo", "Mateus", "Luan", "Luiz Gustavo", "Gabe", "Will"] },
  { competicao: "liga_classica", ano: 2025, jogadores: ["Francis Vieira"] },
  { competicao: "palpite", ano: 2025, jogadores: ["Gabriell (82)"] },
  { competicao: "super_copa", ano: 2025, jogadores: ["Allaf", "Nicolas Santos"] },
  { competicao: "pontos_corridos", ano: 2025, jogadores: ["Felipe Silva"] },
  { competicao: "artilheiro", ano: 2025, jogadores: ["Gui Bandeira"] },
  { competicao: "artilheiro_b", ano: 2025, jogadores: ["Francis Vieira"] },
];

export interface GaleriaClube {
  clube: string;
  titulos: Titulo[];
}

export interface GaleriaJogador {
  jogador: string;
  titulos: Titulo[];
}

const porAno = (a: Titulo, b: Titulo) => a.ano - b.ano;

/** Remove acentos e caixa para comparar nomes ("Galácticos" == "galacticos"). */
export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Slug usado na URL da página do clube: "Baile de Munique" -> "baile-de-munique". */
export function slugClube(nome: string) {
  return normalizar(nome).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function titulosDoClube(nome: string): Titulo[] {
  const alvo = normalizar(nome);
  return TITULOS.filter((t) => t.clube && normalizar(t.clube) === alvo).sort((a, b) => b.ano - a.ano);
}

/**
 * Nome do jogador no cadastro (tabela jogadores) -> nome usado na galeria de títulos,
 * para quando o mesmo jogador está escrito de jeitos diferentes.
 */
const APELIDOS: Record<string, string> = {
  "Tito": "Tito Jacobina",
  "Varela": "Felipe Varela",
  "Nattan Solived": "Nattan Sollived",
  "Lagranha": "Paulo Lagranha",
  "Antônio G": "Antonio Gui",
  "Diller": "Diller Felicio",
  "Gabriell": "Gabriell (82)",
  "Nicolas": "Nicolas Santos",
};

export function titulosDoJogador(nome: string): Titulo[] {
  const alvo = normalizar(APELIDOS[nome] ?? nome);
  return TITULOS.filter((t) => t.jogadores.some((j) => normalizar(j) === alvo));
}

export function galeriaClubes(): GaleriaClube[] {
  const mapa = new Map<string, Titulo[]>();
  for (const t of TITULOS) {
    if (!t.clube) continue;
    mapa.set(t.clube, [...(mapa.get(t.clube) ?? []), t]);
  }
  return [...mapa.entries()]
    .map(([clube, titulos]) => ({ clube, titulos: titulos.sort(porAno) }))
    .sort((a, b) => b.titulos.length - a.titulos.length || a.clube.localeCompare(b.clube));
}

export function galeriaJogadores(): GaleriaJogador[] {
  const mapa = new Map<string, Titulo[]>();
  for (const t of TITULOS) {
    for (const j of t.jogadores) {
      mapa.set(j, [...(mapa.get(j) ?? []), t]);
    }
  }
  return [...mapa.entries()]
    .map(([jogador, titulos]) => ({ jogador, titulos: titulos.sort(porAno) }))
    .sort((a, b) => b.titulos.length - a.titulos.length || a.jogador.localeCompare(b.jogador));
}

/** Campeões agrupados por ano, do mais recente para o mais antigo. */
export function titulosPorAno(): { ano: number; titulos: Titulo[] }[] {
  const mapa = new Map<number, Titulo[]>();
  for (const t of TITULOS) {
    mapa.set(t.ano, [...(mapa.get(t.ano) ?? []), t]);
  }
  return [...mapa.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([ano, titulos]) => ({ ano, titulos }));
}
