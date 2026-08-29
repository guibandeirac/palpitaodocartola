// Substituições de elenco (jogador que saiu × jogador que entrou).
//
// O elenco é versionado por rodada através de `rodada_entrada` / `rodada_saida`
// em `jogadores`. Os confrontos de uma rodada futura, porém, já foram criados
// apontando para o jogador antigo, e nada os atualiza sozinho — por isso o PDF
// e, pior, o cálculo de pontuação (que lê `jogador*_original`) continuavam
// usando quem já saiu. Este módulo detecta essas trocas.

export interface JogadorElenco {
  id: string;
  nome: string;
  equipe_id: string | null;
  eh_coringa: boolean | null;
  rodada_entrada: number | null;
  rodada_saida: number | null;
}

interface JogadorRef {
  id: string;
  nome: string;
}

interface ConfrontoIndividualRef {
  id: string;
  ordem: number;
  jogador1_original: JogadorRef | null;
  jogador2_original: JogadorRef | null;
  jogador1_efetivo: JogadorRef | null;
  jogador2_efetivo: JogadorRef | null;
}

interface ConfrontoEquipeRef {
  id: string;
  equipe1: { id: string; nome: string };
  equipe2: { id: string; nome: string };
  confrontos_individuais: ConfrontoIndividualRef[];
}

export type Lado = "jogador1" | "jogador2";

export interface Substituicao {
  confrontoIndividualId: string;
  confrontoEquipeId: string;
  lado: Lado;
  equipeNome: string;
  ordem: number;
  sai: JogadorRef;
  entra: JogadorRef;
  /** O efetivo aponta para quem saiu (ou está vazio) e deve acompanhar a troca. */
  atualizarEfetivo: boolean;
}

/** Vaga de um jogador que saiu sem ninguém disponível para substituí-lo. */
export interface VagaSemReposicao {
  confrontoEquipeId: string;
  equipeNome: string;
  ordem: number;
  sai: JogadorRef;
}

export interface ResultadoSubstituicoes {
  substituicoes: Substituicao[];
  semReposicao: VagaSemReposicao[];
}

// Mesma regra usada no cálculo da Copa: o jogador vale da rodada de entrada até
// a rodada de saída, ambas inclusive.
export function jogadorValidoNaRodada(
  jogador: Pick<JogadorElenco, "rodada_entrada" | "rodada_saida">,
  numeroRodada: number
): boolean {
  const entrada = jogador.rodada_entrada ?? 1;
  const saida = jogador.rodada_saida;
  return entrada <= numeroRodada && (saida == null || saida >= numeroRodada);
}

/**
 * Compara a escalação gravada nos confrontos com o elenco válido na rodada e
 * devolve as trocas necessárias. Quem saiu é pareado, na ordem dos confrontos,
 * com quem entrou e ainda não está escalado — coringas nunca entram nesse
 * pareamento, já que têm regra própria no cálculo da pontuação.
 */
export function calcularSubstituicoes(
  confrontos: ConfrontoEquipeRef[],
  jogadores: JogadorElenco[],
  numeroRodada: number
): ResultadoSubstituicoes {
  const substituicoes: Substituicao[] = [];
  const semReposicao: VagaSemReposicao[] = [];

  const porId = new Map(jogadores.map((j) => [j.id, j]));

  for (const confronto of confrontos) {
    for (const lado of ["jogador1", "jogador2"] as const) {
      const equipe = lado === "jogador1" ? confronto.equipe1 : confronto.equipe2;
      const originalKey = `${lado}_original` as const;
      const efetivoKey = `${lado}_efetivo` as const;

      const escalacao = [...confronto.confrontos_individuais].sort(
        (a, b) => a.ordem - b.ordem
      );

      // Ids já ocupados nesta escalação — evita escalar duas vezes o mesmo jogador.
      const ocupados = new Set<string>();
      for (const ci of escalacao) {
        if (ci[originalKey]) ocupados.add(ci[originalKey]!.id);
        if (ci[efetivoKey]) ocupados.add(ci[efetivoKey]!.id);
      }

      const vagas = escalacao.filter((ci) => {
        const ref = ci[originalKey] ?? ci[efetivoKey];
        if (!ref) return false;
        const jogador = porId.get(ref.id);
        // Jogador desconhecido no elenco carregado: não há como decidir, ignora.
        if (!jogador) return false;
        return !jogadorValidoNaRodada(jogador, numeroRodada);
      });

      if (vagas.length === 0) continue;

      const disponiveis = jogadores
        .filter(
          (j) =>
            j.equipe_id === equipe.id &&
            !j.eh_coringa &&
            !ocupados.has(j.id) &&
            jogadorValidoNaRodada(j, numeroRodada)
        )
        .sort((a, b) => {
          const ea = a.rodada_entrada ?? 1;
          const eb = b.rodada_entrada ?? 1;
          if (ea !== eb) return ea - eb;
          return a.nome.localeCompare(b.nome);
        });

      vagas.forEach((ci, i) => {
        const sai = (ci[originalKey] ?? ci[efetivoKey])!;
        const entra = disponiveis[i];

        if (!entra) {
          semReposicao.push({
            confrontoEquipeId: confronto.id,
            equipeNome: equipe.nome,
            ordem: ci.ordem,
            sai,
          });
          return;
        }

        const efetivo = ci[efetivoKey];
        substituicoes.push({
          confrontoIndividualId: ci.id,
          confrontoEquipeId: confronto.id,
          lado,
          equipeNome: equipe.nome,
          ordem: ci.ordem,
          sai,
          entra: { id: entra.id, nome: entra.nome },
          atualizarEfetivo: !efetivo || efetivo.id === sai.id,
        });
      });
    }
  }

  return { substituicoes, semReposicao };
}
