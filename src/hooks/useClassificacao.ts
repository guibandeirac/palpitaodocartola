import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ClassificacaoEquipe {
  id: string;
  pontos: number | null;
  vitorias: number | null;
  empates: number | null;
  derrotas: number | null;
  gf: number | null;
  gc: number | null;
  saldo_confrontos: number | null;
  equipe: {
    id: string;
    nome: string;
    logo_url: string | null;
  };
}

export function useClassificacao(serie?: string) {
  const query = useQuery({
    queryKey: ["classificacao", serie],
    queryFn: async () => {
      // First get equipe IDs for the serie if filtered
      let equipeIds: string[] | null = null;
      if (serie) {
        const { data: equipes } = await supabase
          .from("equipes")
          .select("id")
          .eq("serie", serie);
        equipeIds = (equipes || []).map((e) => e.id);
      }

      let query = supabase
        .from("classificacao")
        .select(`
          id,
          pontos,
          vitorias,
          empates,
          derrotas,
          gf,
          gc,
          saldo_confrontos,
          equipe:equipes!classificacao_equipe_id_fkey(id, nome, logo_url)
        `)
        .order("pontos", { ascending: false });

      if (equipeIds) {
        query = query.in("equipe_id", equipeIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const sorted = (data as ClassificacaoEquipe[]).sort((a, b) => {
        const pDiff = (b.pontos ?? 0) - (a.pontos ?? 0);
        if (pDiff !== 0) return pDiff;
        const sgDiff = (b.saldo_confrontos ?? 0) - (a.saldo_confrontos ?? 0);
        if (sgDiff !== 0) return sgDiff;
        return (b.gf ?? 0) - (a.gf ?? 0);
      });
      return sorted;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("classificacao-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classificacao" },
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
