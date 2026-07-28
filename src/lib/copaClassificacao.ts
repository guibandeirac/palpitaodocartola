import { supabase } from "@/integrations/supabase/client";

export type CopaRecalcLog = (
  type: "info" | "success" | "warning" | "error",
  message: string
) => void;

interface EquipeStats {
  nome: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  pontos_pro: number;
  pontos_contra: number;
}

const initStats = (nome: string): EquipeStats => ({
  nome,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  pontos_pro: 0,
  pontos_contra: 0,
});

/**
 * Recalcula copa_classificacao do zero a partir de TODOS os confrontos das
 * rodadas de grupos com status 'finalizada'.
 *
 * Fonte única da verdade: qualquer lugar que mude o status de uma rodada da
 * Copa precisa chamar isso, senão a tabela fica congelada numa foto antiga
 * (foi o que aconteceu com a Rodada 15, finalizada pelo dropdown de status
 * sem passar pelo "Finalizar Rodada").
 */
export async function recalcularCopaClassificacao(addLog: CopaRecalcLog = () => {}) {
  addLog("info", "Recalculando classificação da Copa...");

  const { data: equipes, error: eqError } = await supabase
    .from("equipes")
    .select("id, nome");
  if (eqError) throw eqError;

  const { data: rodadasFinalizadas, error: rodError } = await supabase
    .from("copa_rodadas")
    .select("id, numero")
    .eq("status", "finalizada")
    .eq("fase", "grupos")
    .order("numero");
  if (rodError) throw rodError;

  const rodadaIds = (rodadasFinalizadas || []).map((r) => r.id);
  addLog(
    "info",
    `${rodadaIds.length} rodadas de grupos finalizadas (até a ${
      rodadasFinalizadas?.[rodadaIds.length - 1]?.numero ?? 0
    })`
  );

  const stats = new Map<string, EquipeStats>();
  for (const eq of equipes || []) stats.set(eq.id, initStats(eq.nome));

  if (rodadaIds.length > 0) {
    const { data: confrontos, error: confError } = await supabase
      .from("copa_confrontos")
      .select("equipe1_id, equipe2_id, pontuacao_equipe1, pontuacao_equipe2, resultado")
      .in("rodada_id", rodadaIds);
    if (confError) throw confError;

    for (const c of confrontos || []) {
      const s1 = c.equipe1_id ? stats.get(c.equipe1_id) : undefined;
      const s2 = c.equipe2_id ? stats.get(c.equipe2_id) : undefined;
      if (!s1 || !s2) continue;

      const p1 = Number(c.pontuacao_equipe1 ?? 0);
      const p2 = Number(c.pontuacao_equipe2 ?? 0);

      s1.jogos++;
      s2.jogos++;
      s1.pontos_pro += p1;
      s1.pontos_contra += p2;
      s2.pontos_pro += p2;
      s2.pontos_contra += p1;

      if (c.resultado === "equipe1") {
        s1.pontos += 3;
        s1.vitorias++;
        s2.derrotas++;
      } else if (c.resultado === "equipe2") {
        s2.pontos += 3;
        s2.vitorias++;
        s1.derrotas++;
      } else if (c.resultado === "empate") {
        s1.pontos += 1;
        s1.empates++;
        s2.pontos += 1;
        s2.empates++;
      }
    }
  }

  for (const [equipeId, s] of stats) {
    if (s.jogos === 0) continue;

    const pontos_pro = Math.floor(s.pontos_pro);
    const pontos_contra = Math.floor(s.pontos_contra);
    const saldo_pontos = pontos_pro - pontos_contra;
    const aproveitamento = Math.round((s.pontos / (s.jogos * 3)) * 10000) / 100;

    const payload = {
      equipe_id: equipeId,
      pontos: s.pontos,
      jogos: s.jogos,
      vitorias: s.vitorias,
      empates: s.empates,
      derrotas: s.derrotas,
      pontos_pro,
      pontos_contra,
      saldo_pontos,
      aproveitamento,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("copa_classificacao")
      .select("id")
      .eq("equipe_id", equipeId)
      .maybeSingle();

    const { error: writeError } = existing
      ? await supabase.from("copa_classificacao").update(payload).eq("id", existing.id)
      : await supabase.from("copa_classificacao").insert(payload);

    if (writeError) throw writeError;

    addLog(
      "success",
      `${s.nome}: ${s.pontos}pts, ${s.jogos}J, ${s.vitorias}V-${s.empates}E-${s.derrotas}D, SP:${saldo_pontos}, ${aproveitamento}%`
    );
  }

  addLog("success", "Classificação da Copa recalculada com sucesso!");
}
