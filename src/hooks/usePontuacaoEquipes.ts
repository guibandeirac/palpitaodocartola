import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { arredondar2Decimais } from "@/lib/pontuacao";

export interface PontuacaoEquipe {
  equipe_id: string;
  equipe_nome: string;
  pontuacao_total: number;
  rodadas_jogadas: number;
  media_por_rodada: number;
  pontuacao_ultima_rodada: number;
}

export function usePontuacaoEquipes(serie?: string) {
  return useQuery({
    queryKey: ["pontuacao-equipes", serie],
    queryFn: async () => {
      // 1. Buscar rodadas finalizadas (Série B — única série com classificação)
      const { data: rodadas, error: rodadasError } = await supabase
        .from("rodadas")
        .select("id, numero")
        .eq("status_b", "finalizada")
        .order("numero", { ascending: true });

      if (rodadasError) throw rodadasError;
      if (!rodadas || rodadas.length === 0) return [];

      const rodadaIds = rodadas.map((r) => r.id);
      const ultimaRodadaId = rodadas[rodadas.length - 1].id;

      // 2. Buscar equipes (filtradas por série quando informada)
      let equipesQuery = supabase.from("equipes").select("id, nome, serie");
      if (serie) equipesQuery = equipesQuery.eq("serie", serie);
      const { data: equipes, error: eqError } = await equipesQuery;
      if (eqError) throw eqError;
      if (!equipes || equipes.length === 0) return [];

      const equipeIdsSerie = new Set(equipes.map((e) => e.id));

      // 3. Buscar confrontos_equipe das rodadas finalizadas, somente entre equipes da série
      let ceQuery = supabase
        .from("confrontos_equipe")
        .select("id, equipe1_id, equipe2_id, rodada_id")
        .in("rodada_id", rodadaIds);
      if (serie) {
        const ids = Array.from(equipeIdsSerie);
        ceQuery = ceQuery.in("equipe1_id", ids).in("equipe2_id", ids);
      }
      const { data: confrontosEquipe, error: ceError } = await ceQuery;

      if (ceError) throw ceError;
      if (!confrontosEquipe || confrontosEquipe.length === 0) return [];

      const ceIds = confrontosEquipe.map((ce) => ce.id);

      // 4. Buscar confrontos_individuais desses confrontos
      const { data: confrontosInd, error: ciError } = await supabase
        .from("confrontos_individuais")
        .select("confronto_equipe_id, pontuacao_jogador1, pontuacao_jogador2")
        .in("confronto_equipe_id", ceIds);

      if (ciError) throw ciError;

      // 5. Calcular pontuações por equipe
      const equipeTotais = new Map<string, { total: number; rodadas: Set<string>; ultimaRodada: number }>();

      // Init
      equipes?.forEach((eq) => {
        equipeTotais.set(eq.id, { total: 0, rodadas: new Set(), ultimaRodada: 0 });
      });

      // Map confronto_equipe_id -> confronto info
      const ceMap = new Map<string, { equipe1_id: string | null; equipe2_id: string | null; rodada_id: string | null }>();
      confrontosEquipe.forEach((ce) => ceMap.set(ce.id, ce));

      confrontosInd?.forEach((ci) => {
        const ce = ceMap.get(ci.confronto_equipe_id!);
        if (!ce) return;

        const p1 = ci.pontuacao_jogador1 ?? 0;
        const p2 = ci.pontuacao_jogador2 ?? 0;

        if (ce.equipe1_id) {
          const entry = equipeTotais.get(ce.equipe1_id);
          if (entry) {
            entry.total += Number(p1);
            if (ce.rodada_id) entry.rodadas.add(ce.rodada_id);
            if (ce.rodada_id === ultimaRodadaId) entry.ultimaRodada += Number(p1);
          }
        }

        if (ce.equipe2_id) {
          const entry = equipeTotais.get(ce.equipe2_id);
          if (entry) {
            entry.total += Number(p2);
            if (ce.rodada_id) entry.rodadas.add(ce.rodada_id);
            if (ce.rodada_id === ultimaRodadaId) entry.ultimaRodada += Number(p2);
          }
        }
      });

      // 6. Montar resultado
      const resultado: PontuacaoEquipe[] = [];
      equipes?.forEach((eq) => {
        const entry = equipeTotais.get(eq.id);
        if (!entry || entry.rodadas.size === 0) return;
        const rodadasJogadas = entry.rodadas.size;
        resultado.push({
          equipe_id: eq.id,
          equipe_nome: eq.nome,
          pontuacao_total: arredondar2Decimais(entry.total),
          rodadas_jogadas: rodadasJogadas,
          media_por_rodada: arredondar2Decimais(entry.total / rodadasJogadas),
          pontuacao_ultima_rodada: arredondar2Decimais(entry.ultimaRodada),
        });
      });

      resultado.sort((a, b) => b.pontuacao_total - a.pontuacao_total);
      return resultado;
    },
  });
}
