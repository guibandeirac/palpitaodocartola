import { useQuery, useQueryClient } from "@tanstack/react-query";
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
      const { data, error } = await supabase.rpc("get_artilheiros", {
        p_serie: serie ?? null,
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        jogador_id: row.jogador_id as string,
        jogador_nome: row.jogador_nome as string,
        equipe_nome: row.equipe_nome as string,
        vitorias: Number(row.vitorias),
        pontuacao_total: Math.round(Number(row.pontuacao_total) * 100) / 100,
      })) as Artilheiro[];
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("artilheiros-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confrontos_individuais" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["artilheiros"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
