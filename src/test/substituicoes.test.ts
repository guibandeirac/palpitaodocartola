import { describe, it, expect } from "vitest";
import {
  calcularSubstituicoes,
  jogadorValidoNaRodada,
  type JogadorElenco,
} from "@/lib/substituicoes";

const jogador = (
  id: string,
  nome: string,
  equipe_id: string,
  extra: Partial<JogadorElenco> = {}
): JogadorElenco => ({
  id,
  nome,
  equipe_id,
  eh_coringa: false,
  rodada_entrada: 1,
  rodada_saida: null,
  ...extra,
});

const ref = (id: string, nome: string) => ({ id, nome });

// Confronto com uma única partida individual, para focar na regra de troca.
const confronto = (
  j1Original: { id: string; nome: string } | null,
  j2Original: { id: string; nome: string } | null,
  efetivos: { j1?: { id: string; nome: string } | null; j2?: { id: string; nome: string } | null } = {}
) => ({
  id: "ce-1",
  equipe1: { id: "e1", nome: "Futbreja" },
  equipe2: { id: "e2", nome: "Inter de Limão" },
  confrontos_individuais: [
    {
      id: "ci-1",
      ordem: 1,
      jogador1_original: j1Original,
      jogador2_original: j2Original,
      jogador1_efetivo: efetivos.j1 ?? null,
      jogador2_efetivo: efetivos.j2 ?? null,
    },
  ],
});

describe("jogadorValidoNaRodada", () => {
  it("vale na própria rodada de saída", () => {
    expect(jogadorValidoNaRodada({ rodada_entrada: 1, rodada_saida: 24 }, 24)).toBe(true);
  });

  it("não vale na rodada seguinte à saída", () => {
    expect(jogadorValidoNaRodada({ rodada_entrada: 1, rodada_saida: 24 }, 25)).toBe(false);
  });

  it("não vale antes da rodada de entrada", () => {
    expect(jogadorValidoNaRodada({ rodada_entrada: 25, rodada_saida: null }, 24)).toBe(false);
  });

  it("trata rodada_entrada nula como rodada 1", () => {
    expect(jogadorValidoNaRodada({ rodada_entrada: null, rodada_saida: null }, 1)).toBe(true);
  });
});

describe("calcularSubstituicoes", () => {
  it("troca quem saiu por quem entrou na mesma equipe", () => {
    const jogadores = [
      jogador("saiu", "Willian", "e1", { rodada_saida: 24 }),
      jogador("entrou", "Rafael Henrique", "e1", { rodada_entrada: 25 }),
      jogador("adv", "Gustavo B.", "e2"),
    ];

    const { substituicoes, semReposicao } = calcularSubstituicoes(
      [confronto(ref("saiu", "Willian"), ref("adv", "Gustavo B."))],
      jogadores,
      25
    );

    expect(semReposicao).toHaveLength(0);
    expect(substituicoes).toHaveLength(1);
    expect(substituicoes[0]).toMatchObject({
      confrontoIndividualId: "ci-1",
      lado: "jogador1",
      equipeNome: "Futbreja",
      sai: { id: "saiu", nome: "Willian" },
      entra: { id: "entrou", nome: "Rafael Henrique" },
      atualizarEfetivo: true,
    });
  });

  it("não mexe na rodada em que o jogador ainda era válido", () => {
    const jogadores = [
      jogador("saiu", "Willian", "e1", { rodada_saida: 24 }),
      jogador("entrou", "Rafael Henrique", "e1", { rodada_entrada: 25 }),
      jogador("adv", "Gustavo B.", "e2"),
    ];

    const { substituicoes } = calcularSubstituicoes(
      [confronto(ref("saiu", "Willian"), ref("adv", "Gustavo B."))],
      jogadores,
      24
    );

    expect(substituicoes).toHaveLength(0);
  });

  it("aponta a vaga quando não há reposição disponível", () => {
    const jogadores = [
      jogador("saiu", "Willian", "e1", { rodada_saida: 24 }),
      jogador("coringa", "Coringa Futbreja", "e1", { eh_coringa: true }),
      jogador("adv", "Gustavo B.", "e2"),
    ];

    const { substituicoes, semReposicao } = calcularSubstituicoes(
      [confronto(ref("saiu", "Willian"), ref("adv", "Gustavo B."))],
      jogadores,
      25
    );

    expect(substituicoes).toHaveLength(0);
    expect(semReposicao).toEqual([
      { confrontoEquipeId: "ce-1", equipeNome: "Futbreja", ordem: 1, sai: { id: "saiu", nome: "Willian" } },
    ]);
  });

  it("não escala quem já está em outra partida do mesmo confronto", () => {
    const jogadores = [
      jogador("saiu", "Willian", "e1", { rodada_saida: 24 }),
      jogador("ja-escalado", "Carlos", "e1"),
      jogador("adv", "Gustavo B.", "e2"),
      jogador("adv2", "Piit Bull", "e2"),
    ];

    const base = confronto(ref("saiu", "Willian"), ref("adv", "Gustavo B."));
    base.confrontos_individuais.push({
      id: "ci-2",
      ordem: 2,
      jogador1_original: ref("ja-escalado", "Carlos"),
      jogador2_original: ref("adv2", "Piit Bull"),
      jogador1_efetivo: null,
      jogador2_efetivo: null,
    });

    const { substituicoes, semReposicao } = calcularSubstituicoes([base], jogadores, 25);

    expect(substituicoes).toHaveLength(0);
    expect(semReposicao).toHaveLength(1);
  });

  it("preserva o efetivo quando ele é um coringa diferente de quem saiu", () => {
    const jogadores = [
      jogador("saiu", "Willian", "e1", { rodada_saida: 24 }),
      jogador("entrou", "Rafael Henrique", "e1", { rodada_entrada: 25 }),
      jogador("coringa", "Coringa Futbreja", "e1", { eh_coringa: true }),
      jogador("adv", "Gustavo B.", "e2"),
    ];

    const { substituicoes } = calcularSubstituicoes(
      [
        confronto(ref("saiu", "Willian"), ref("adv", "Gustavo B."), {
          j1: ref("coringa", "Coringa Futbreja"),
        }),
      ],
      jogadores,
      25
    );

    expect(substituicoes).toHaveLength(1);
    expect(substituicoes[0].atualizarEfetivo).toBe(false);
  });

  it("pareia múltiplas saídas e entradas na ordem dos confrontos", () => {
    const jogadores = [
      jogador("s1", "Willian", "e1", { rodada_saida: 24 }),
      jogador("s2", "Lucas Sales", "e1", { rodada_saida: 24 }),
      jogador("e-a", "Rafael Henrique", "e1", { rodada_entrada: 25 }),
      jogador("e-b", "Wagner", "e1", { rodada_entrada: 26 }),
      jogador("adv", "Gustavo B.", "e2"),
      jogador("adv2", "Piit Bull", "e2"),
    ];

    const base = confronto(ref("s1", "Willian"), ref("adv", "Gustavo B."));
    base.confrontos_individuais.push({
      id: "ci-2",
      ordem: 2,
      jogador1_original: ref("s2", "Lucas Sales"),
      jogador2_original: ref("adv2", "Piit Bull"),
      jogador1_efetivo: null,
      jogador2_efetivo: null,
    });

    const { substituicoes } = calcularSubstituicoes([base], jogadores, 26);

    expect(substituicoes.map((s) => [s.sai.nome, s.entra.nome])).toEqual([
      ["Willian", "Rafael Henrique"],
      ["Lucas Sales", "Wagner"],
    ]);
  });
});
