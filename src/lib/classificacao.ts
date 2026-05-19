import { supabase } from "@/integrations/supabase/client";

export type Serie = "A" | "B";

export interface RecalcularClassificacaoCallbacks {
  onInfo?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  onWarning?: (msg: string) => void;
  onError?: (msg: string) => void;
}

/**
 * Séries que possuem classificação acumulada. Série A é "só ao vivo",
 * então não tem classificação nem artilheiros no banco.
 */
export const SERIES_COM_CLASSIFICACAO: Serie[] = ["B"];

export function serieTemClassificacao(serie: Serie): boolean {
  return SERIES_COM_CLASSIFICACAO.includes(serie);
}

export async function recalcularClassificacao(
  serie: Serie,
  cb: RecalcularClassificacaoCallbacks = {}
) {
  const log = {
    info: (m: string) => cb.onInfo?.(m),
    success: (m: string) => cb.onSuccess?.(m),
    warning: (m: string) => cb.onWarning?.(m),
    error: (m: string) => cb.onError?.(m),
  };

  if (!serieTemClassificacao(serie)) {
    log.info(`Série ${serie} não possui classificação — nada a recalcular.`);
    return;
  }

  log.info(`Recalculando classificação da Série ${serie}...`);

  const { data: equipes, error: eqError } = await supabase
    .from("equipes")
    .select("id, nome")
    .eq("serie", serie);

  if (eqError) throw eqError;
  if (!equipes || equipes.length === 0) {
    log.warning(`Nenhuma equipe na Série ${serie}`);
    return;
  }

  const equipeIds = new Set(equipes.map((e) => e.id));

  for (const equipe of equipes) {
    const { data: existente } = await supabase
      .from("classificacao")
      .select("id")
      .eq("equipe_id", equipe.id)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("classificacao")
        .update({
          pontos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          gf: 0,
          gc: 0,
          saldo_confrontos: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id);
    } else {
      await supabase.from("classificacao").insert({
        equipe_id: equipe.id,
        pontos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gf: 0,
        gc: 0,
        saldo_confrontos: 0,
      });
    }
  }

  // Apenas Série B tem classificação acumulada — usa status_b independente.
  const statusCol = serie === "A" ? "status_a" : "status_b";
  const { data: rodadasFin } = await supabase
    .from("rodadas")
    .select("id, numero")
    .eq(statusCol, "finalizada")
    .order("numero", { ascending: true });

  const stats = new Map<
    string,
    { pontos: number; vitorias: number; empates: number; derrotas: number; gf: number; gc: number }
  >();
  for (const equipe of equipes) {
    stats.set(equipe.id, { pontos: 0, vitorias: 0, empates: 0, derrotas: 0, gf: 0, gc: 0 });
  }

  for (const rodada of rodadasFin || []) {
    const { data: confrontos } = await supabase
      .from("confrontos_equipe")
      .select("equipe1_id, equipe2_id, resultado, vitorias_equipe1, vitorias_equipe2")
      .eq("rodada_id", rodada.id);

    for (const c of confrontos || []) {
      if (!c.equipe1_id || !c.equipe2_id) continue;
      if (!equipeIds.has(c.equipe1_id) || !equipeIds.has(c.equipe2_id)) continue;

      const s1 = stats.get(c.equipe1_id);
      const s2 = stats.get(c.equipe2_id);
      if (!s1 || !s2) continue;

      const v1 = c.vitorias_equipe1 || 0;
      const v2 = c.vitorias_equipe2 || 0;
      s1.gf += v1;
      s1.gc += v2;
      s2.gf += v2;
      s2.gc += v1;

      if (c.resultado === "equipe1") {
        s1.pontos += 3;
        s1.vitorias += 1;
        s2.derrotas += 1;
      } else if (c.resultado === "equipe2") {
        s2.pontos += 3;
        s2.vitorias += 1;
        s1.derrotas += 1;
      } else if (c.resultado === "empate") {
        s1.pontos += 1;
        s1.empates += 1;
        s2.pontos += 1;
        s2.empates += 1;
      } else if (!c.resultado) {
        log.warning(`Rodada ${rodada.numero}: confronto sem resultado ignorado`);
      }
    }
    log.success(`Rodada ${rodada.numero} processada`);
  }

  for (const [equipeId, s] of stats) {
    await supabase
      .from("classificacao")
      .update({
        pontos: s.pontos,
        vitorias: s.vitorias,
        empates: s.empates,
        derrotas: s.derrotas,
        gf: s.gf,
        gc: s.gc,
        saldo_confrontos: s.gf - s.gc,
        updated_at: new Date().toISOString(),
      })
      .eq("equipe_id", equipeId);
  }

  log.success(`Classificação da Série ${serie} recalculada`);
}
