import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Artilheiro {
  jogador_id: string;
  jogador_nome: string;
  equipe_nome: string;
  vitorias: number;
  pontuacao_total: number;
}

export function useArtilheiros(serie?: string) {
  const query = useQuery({
    queryKey: ["artilheiros", serie],
    queryFn: async () => {
      // Get equipe IDs for the serie if filtered
      let equipeIds: string[] | null = null;
      if (serie) {
        const { data: equipes } = await supabase
          .from("equipes")
          .select("id")
          .eq("serie", serie);
        equipeIds = (equipes || []).map((e) => e.id);
      }

      // Fetch all non-coringa players
      let jogadoresQuery = supabase
        .from("jogadores")
        .select("id, nome, eh_coringa, equipe_id, equipe:equipes!jogadores_equipe_id_fkey(nome)")
        .eq("eh_coringa", false);

      if (equipeIds) {
        jogadoresQuery = jogadoresQuery.in("equipe_id", equipeIds);
      }

      const { data: jogadores, error: jogadoresError } = await jogadoresQuery;

      if (jogadoresError) throw jogadoresError;

      // Fetch all individual confrontations
      const { data: confrontos, error } = await supabase
        .from("confrontos_individuais")
        .select("vencedor, jogador1_original_id, jogador2_original_id, pontuacao_jogador1, pontuacao_jogador2");

      if (error) throw error;

      // Build map with victories and total score per original player
      const statsMap = new Map<string, { vitorias: number; pontuacao_total: number }>();

      for (const c of confrontos || []) {
        // Jogador 1 stats
        if (c.jogador1_original_id) {
          const s = statsMap.get(c.jogador1_original_id) || { vitorias: 0, pontuacao_total: 0 };
          if (c.vencedor === "jogador1") s.vitorias++;
          s.pontuacao_total += Number(c.pontuacao_jogador1 || 0);
          statsMap.set(c.jogador1_original_id, s);
        }
        // Jogador 2 stats
        if (c.jogador2_original_id) {
          const s = statsMap.get(c.jogador2_original_id) || { vitorias: 0, pontuacao_total: 0 };
          if (c.vencedor === "jogador2") s.vitorias++;
          s.pontuacao_total += Number(c.pontuacao_jogador2 || 0);
          statsMap.set(c.jogador2_original_id, s);
        }
      }

      // Build artilheiros list from all titular players
      const artilheiros: Artilheiro[] = (jogadores || []).map((j) => {
        const stats = statsMap.get(j.id) || { vitorias: 0, pontuacao_total: 0 };
        return {
          jogador_id: j.id,
          jogador_nome: j.nome,
          equipe_nome: (j.equipe as any)?.nome || "Sem equipe",
          vitorias: stats.vitorias,
          pontuacao_total: Math.round(stats.pontuacao_total * 100) / 100,
        };
      });

      return artilheiros.sort((a, b) => {
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        if (b.pontuacao_total !== a.pontuacao_total) return b.pontuacao_total - a.pontuacao_total;
        return a.jogador_nome.localeCompare(b.jogador_nome);
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("artilheiros-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confrontos_individuais" },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return query;
}
