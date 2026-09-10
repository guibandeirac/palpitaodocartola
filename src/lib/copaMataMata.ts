import { supabase } from "@/integrations/supabase/client";

export type CopaMataMataLog = (
  type: "info" | "success" | "warning" | "error",
  message: string
) => void;

type Origem =
  | { tipo: "seed"; pos: number }
  | { tipo: "vencedor"; fase: string; chave: string | null };

interface ChaveSpec {
  fase: string;
  chave: string | null;
  label: string;
  jogoUnico: boolean;
  equipe1: Origem;
  equipe2: Origem;
}

/**
 * Chaveamento do mata-mata da Copa, na ordem em que precisa ser resolvido —
 * cada chave só depende das anteriores.
 *
 *   Repescagem (jogo único): 6º x 7º
 *   Quartas 01 (ida/volta):  3º x vencedor da repescagem
 *   Quartas 02 (ida/volta):  4º x 5º
 *   Semifinal A (ida/volta): 1º x vencedor das Quartas 02
 *   Semifinal B (ida/volta): 2º x vencedor das Quartas 01
 *   Final (jogo único):      vencedores das semifinais
 */
export const CHAVEAMENTO_COPA: ChaveSpec[] = [
  {
    fase: "repescagem",
    chave: null,
    label: "Repescagem (6º x 7º)",
    jogoUnico: true,
    equipe1: { tipo: "seed", pos: 6 },
    equipe2: { tipo: "seed", pos: 7 },
  },
  {
    fase: "quartas",
    chave: "A",
    label: "Quartas 01 (3º x vencedor da repescagem)",
    jogoUnico: false,
    equipe1: { tipo: "seed", pos: 3 },
    equipe2: { tipo: "vencedor", fase: "repescagem", chave: null },
  },
  {
    fase: "quartas",
    chave: "B",
    label: "Quartas 02 (4º x 5º)",
    jogoUnico: false,
    equipe1: { tipo: "seed", pos: 4 },
    equipe2: { tipo: "seed", pos: 5 },
  },
  {
    fase: "semifinal",
    chave: "A",
    label: "Semifinal A (1º x vencedor das Quartas 02)",
    jogoUnico: false,
    equipe1: { tipo: "seed", pos: 1 },
    equipe2: { tipo: "vencedor", fase: "quartas", chave: "B" },
  },
  {
    fase: "semifinal",
    chave: "B",
    label: "Semifinal B (2º x vencedor das Quartas 01)",
    jogoUnico: false,
    equipe1: { tipo: "seed", pos: 2 },
    equipe2: { tipo: "vencedor", fase: "quartas", chave: "A" },
  },
  {
    fase: "final",
    chave: null,
    label: "Final (vencedores das semifinais)",
    jogoUnico: true,
    equipe1: { tipo: "vencedor", fase: "semifinal", chave: "A" },
    equipe2: { tipo: "vencedor", fase: "semifinal", chave: "B" },
  },
];

interface RodadaRow {
  id: string;
  numero: number;
  fase: string;
  fase_detalhe: string | null;
  status: string;
}

interface ConfrontoRow {
  id: string;
  rodada_id: string | null;
  equipe1_id: string | null;
  equipe2_id: string | null;
  pontuacao_equipe1: number | null;
  pontuacao_equipe2: number | null;
}

interface PlayoffRow {
  id: string;
  fase: string;
  chave: string | null;
  equipe1_id: string | null;
  equipe2_id: string | null;
  vencedor_id: string | null;
}

const chaveKey = (fase: string, chave: string | null) => `${fase}|${chave ?? ""}`;

function acharRodada(
  rodadas: RodadaRow[],
  fase: string,
  detalhe: "unico" | "ida" | "volta"
): RodadaRow | undefined {
  return rodadas.find((r) => r.fase === fase && r.fase_detalhe === detalhe);
}

/** Placar de um confronto na ordem (equipe1, equipe2) da chave do playoff. */
function placarNaOrdemDaChave(
  confronto: ConfrontoRow | undefined,
  equipe1Id: string,
  equipe2Id: string
): { p1: number | null; p2: number | null } {
  if (!confronto) return { p1: null, p2: null };

  const pe1 =
    confronto.pontuacao_equipe1 != null ? Number(confronto.pontuacao_equipe1) : null;
  const pe2 =
    confronto.pontuacao_equipe2 != null ? Number(confronto.pontuacao_equipe2) : null;

  if (confronto.equipe1_id === equipe1Id && confronto.equipe2_id === equipe2Id) {
    return { p1: pe1, p2: pe2 };
  }
  if (confronto.equipe1_id === equipe2Id && confronto.equipe2_id === equipe1Id) {
    return { p1: pe2, p2: pe1 };
  }
  return { p1: null, p2: null };
}

/** Confronto da rodada que casa com o par de equipes, em qualquer ordem. */
function acharConfronto(
  confrontos: ConfrontoRow[],
  rodadaId: string,
  equipe1Id: string,
  equipe2Id: string
): ConfrontoRow | undefined {
  return confrontos.find(
    (c) =>
      c.rodada_id === rodadaId &&
      ((c.equipe1_id === equipe1Id && c.equipe2_id === equipe2Id) ||
        (c.equipe1_id === equipe2Id && c.equipe2_id === equipe1Id))
  );
}

/**
 * Sincroniza o mata-mata da Copa: cria/atualiza as chaves em copa_playoffs,
 * cria em copa_confrontos os confrontos que faltam, importa os placares das
 * rodadas e propaga os vencedores para a fase seguinte.
 *
 * É idempotente: pode ser chamada quantas vezes for preciso e o resultado é
 * sempre derivado dos confrontos das rodadas — se um placar for corrigido, a
 * chave e as fases seguintes se corrigem na próxima sincronização.
 *
 * Regras:
 *  - o vencedor só é definido quando a(s) rodada(s) do confronto estão
 *    'finalizada' — enquanto a rodada está em andamento, só os placares sobem;
 *  - nos confrontos de ida e volta vale o agregado (ida + volta);
 *  - empate no agregado (ou no jogo único): avança o melhor colocado na fase
 *    de grupos;
 *  - o vencedor é sempre calculado, nunca preservado: uma escolha manual no
 *    editor de playoffs vale até a próxima sincronização.
 */
export async function sincronizarCopaMataMata(addLog: CopaMataMataLog = () => {}) {
  addLog("info", "Sincronizando mata-mata da Copa...");

  // --- 1. Classificação de grupos: define as cabeças de chave e o desempate.
  const { data: equipes, error: eqError } = await supabase
    .from("equipes")
    .select("id, nome");
  if (eqError) throw eqError;
  const nomeDe = new Map<string, string>((equipes || []).map((e) => [e.id, e.nome]));

  const { data: classificacao, error: classError } = await supabase
    .from("copa_classificacao")
    .select("equipe_id, pontos, saldo_pontos, pontos_pro");
  if (classError) throw classError;

  const ordenada = [...(classificacao || [])].sort((a, b) => {
    if ((b.pontos ?? 0) !== (a.pontos ?? 0)) return (b.pontos ?? 0) - (a.pontos ?? 0);
    if ((b.saldo_pontos ?? 0) !== (a.saldo_pontos ?? 0))
      return (b.saldo_pontos ?? 0) - (a.saldo_pontos ?? 0);
    return (b.pontos_pro ?? 0) - (a.pontos_pro ?? 0);
  });

  if (ordenada.length < 7) {
    throw new Error(
      `Classificação insuficiente: ${ordenada.length} equipes (são necessárias 7)`
    );
  }

  const seed = (pos: number) => ordenada[pos - 1]?.equipe_id ?? null;
  const posicaoDe = new Map<string, number>();
  ordenada.forEach((row, i) => {
    if (row.equipe_id) posicaoDe.set(row.equipe_id, i + 1);
  });

  // --- 2. Rodadas do mata-mata (descobertas por fase/fase_detalhe).
  const { data: rodadasData, error: rodError } = await supabase
    .from("copa_rodadas")
    .select("id, numero, fase, fase_detalhe, status")
    .neq("fase", "grupos")
    .order("numero");
  if (rodError) throw rodError;
  const rodadas = (rodadasData || []) as RodadaRow[];

  // --- 3. Chaves e confrontos já existentes.
  const { data: playoffsData, error: poError } = await supabase
    .from("copa_playoffs")
    .select("id, fase, chave, equipe1_id, equipe2_id, vencedor_id");
  if (poError) throw poError;
  const playoffs = (playoffsData || []) as PlayoffRow[];

  const rodadaIds = rodadas.map((r) => r.id);
  let confrontos: ConfrontoRow[] = [];
  if (rodadaIds.length > 0) {
    const { data: confData, error: confError } = await supabase
      .from("copa_confrontos")
      .select(
        "id, rodada_id, equipe1_id, equipe2_id, pontuacao_equipe1, pontuacao_equipe2"
      )
      .in("rodada_id", rodadaIds);
    if (confError) throw confError;
    confrontos = (confData || []) as ConfrontoRow[];
  }

  const vencedores = new Map<string, string | null>();

  // --- 4. Resolve chave por chave, na ordem do chaveamento.
  for (const spec of CHAVEAMENTO_COPA) {
    const key = chaveKey(spec.fase, spec.chave);
    const existente = playoffs.find(
      (p) => p.fase === spec.fase && (p.chave ?? null) === spec.chave
    );

    const resolverOrigem = (origem: Origem, atual: string | null): string | null => {
      if (origem.tipo === "seed") return seed(origem.pos);
      // Vaga que depende de outra chave: só preenche quando já há vencedor.
      // Sem vencedor ainda, preserva o que estiver lá (pode ter sido posto à mão).
      return vencedores.get(chaveKey(origem.fase, origem.chave)) ?? atual;
    };

    const equipe1Id = resolverOrigem(spec.equipe1, existente?.equipe1_id ?? null);
    const equipe2Id = resolverOrigem(spec.equipe2, existente?.equipe2_id ?? null);

    const rodadaIda = acharRodada(rodadas, spec.fase, spec.jogoUnico ? "unico" : "ida");
    const rodadaVolta = spec.jogoUnico
      ? undefined
      : acharRodada(rodadas, spec.fase, "volta");

    if (!rodadaIda) {
      addLog("warning", `${spec.label}: rodada da fase '${spec.fase}' não cadastrada`);
    }

    // --- 4a. Cria os confrontos que faltam (só com os dois times definidos).
    if (equipe1Id && equipe2Id) {
      for (const rodada of [rodadaIda, rodadaVolta]) {
        if (!rodada) continue;
        if (acharConfronto(confrontos, rodada.id, equipe1Id, equipe2Id)) continue;

        const { data: novo, error: insError } = await supabase
          .from("copa_confrontos")
          .insert({
            rodada_id: rodada.id,
            equipe1_id: equipe1Id,
            equipe2_id: equipe2Id,
          })
          .select(
            "id, rodada_id, equipe1_id, equipe2_id, pontuacao_equipe1, pontuacao_equipe2"
          )
          .single();
        if (insError) throw insError;

        confrontos.push(novo as ConfrontoRow);
        addLog(
          "success",
          `Confronto criado na Rodada ${rodada.numero} (${rodada.fase}${
            rodada.fase_detalhe ? " " + rodada.fase_detalhe : ""
          }): ${nomeDe.get(equipe1Id)} x ${nomeDe.get(equipe2Id)}`
        );
      }
    }

    // --- 4b. Importa os placares das rodadas para a chave.
    let p1Ida: number | null = null;
    let p2Ida: number | null = null;
    let p1Volta: number | null = null;
    let p2Volta: number | null = null;

    if (equipe1Id && equipe2Id && rodadaIda) {
      const c = acharConfronto(confrontos, rodadaIda.id, equipe1Id, equipe2Id);
      const placar = placarNaOrdemDaChave(c, equipe1Id, equipe2Id);
      p1Ida = placar.p1;
      p2Ida = placar.p2;
    }
    if (equipe1Id && equipe2Id && rodadaVolta) {
      const c = acharConfronto(confrontos, rodadaVolta.id, equipe1Id, equipe2Id);
      const placar = placarNaOrdemDaChave(c, equipe1Id, equipe2Id);
      p1Volta = placar.p1;
      p2Volta = placar.p2;
    }

    let p1Total: number | null = null;
    let p2Total: number | null = null;
    if (spec.jogoUnico) {
      p1Total = p1Ida;
      p2Total = p2Ida;
    } else if (p1Ida != null && p1Volta != null && p2Ida != null && p2Volta != null) {
      p1Total = p1Ida + p1Volta;
      p2Total = p2Ida + p2Volta;
    }

    // --- 4c. Define o vencedor (só com todas as pernas finalizadas).
    const pernasFinalizadas = [rodadaIda, rodadaVolta]
      .filter((r): r is RodadaRow => !!r)
      .every((r) => r.status === "finalizada");

    let vencedorId: string | null = null;

    if (
      equipe1Id &&
      equipe2Id &&
      pernasFinalizadas &&
      p1Total != null &&
      p2Total != null
    ) {
      if (p1Total > p2Total) vencedorId = equipe1Id;
      else if (p2Total > p1Total) vencedorId = equipe2Id;
      else {
        // Empate: avança o melhor colocado na fase de grupos.
        const pos1 = posicaoDe.get(equipe1Id) ?? Number.MAX_SAFE_INTEGER;
        const pos2 = posicaoDe.get(equipe2Id) ?? Number.MAX_SAFE_INTEGER;
        vencedorId = pos1 <= pos2 ? equipe1Id : equipe2Id;
        addLog(
          "warning",
          `${spec.label}: empate (${p1Total} x ${p2Total}) — avança o melhor colocado na fase de grupos: ${nomeDe.get(
            vencedorId
          )}`
        );
      }
    }

    if (
      existente?.vencedor_id &&
      existente.vencedor_id !== vencedorId
    ) {
      addLog(
        "warning",
        `${spec.label}: vencedor corrigido de ${
          nomeDe.get(existente.vencedor_id) ?? "?"
        } para ${vencedorId ? nomeDe.get(vencedorId) : "a definir"} (o resultado das rodadas manda)`
      );
    }

    vencedores.set(key, vencedorId);

    // --- 4d. Grava a chave.
    const payload = {
      fase: spec.fase,
      chave: spec.chave,
      equipe1_id: equipe1Id,
      equipe2_id: equipe2Id,
      pontuacao_equipe1_ida: p1Ida,
      pontuacao_equipe1_volta: spec.jogoUnico ? null : p1Volta,
      pontuacao_equipe1_total: p1Total,
      pontuacao_equipe2_ida: p2Ida,
      pontuacao_equipe2_volta: spec.jogoUnico ? null : p2Volta,
      pontuacao_equipe2_total: p2Total,
      vencedor_id: vencedorId,
      rodada_ida_id: rodadaIda?.id ?? null,
      rodada_volta_id: rodadaVolta?.id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existente) {
      const { error } = await supabase
        .from("copa_playoffs")
        .update(payload)
        .eq("id", existente.id);
      if (error) throw error;
    } else {
      const { data: nova, error } = await supabase
        .from("copa_playoffs")
        .insert(payload)
        .select("id, fase, chave, equipe1_id, equipe2_id, vencedor_id")
        .single();
      if (error) throw error;
      playoffs.push(nova as PlayoffRow);
    }

    const desc = `${equipe1Id ? nomeDe.get(equipe1Id) : "A definir"} x ${
      equipe2Id ? nomeDe.get(equipe2Id) : "A definir"
    }`;
    const placarDesc =
      p1Total != null && p2Total != null ? ` — ${p1Total} x ${p2Total}` : "";
    const vencedorDesc = vencedorId ? ` -> ${nomeDe.get(vencedorId)}` : "";
    addLog("success", `${spec.label}: ${desc}${placarDesc}${vencedorDesc}`);
  }

  const campeao = vencedores.get(chaveKey("final", null));
  if (campeao) {
    addLog("success", `Campeão da Copa Palpitão: ${nomeDe.get(campeao)}`);
  }

  addLog("success", "Mata-mata da Copa sincronizado!");
}
