import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CopaClassificacaoRow {
  id: string;
  equipe_id: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  pontos_pro: number;
  pontos_contra: number;
  saldo_pontos: number;
  aproveitamento: number;
  equipe: { id: string; nome: string; logo_url: string | null };
}

export function useCopaClassificacao() {
  return useQuery({
    queryKey: ["copa_classificacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copa_classificacao")
        .select(`
          *,
          equipe:equipes!copa_classificacao_equipe_id_fkey(id, nome, logo_url)
        `)
        .order("pontos", { ascending: false });

      if (error) throw error;

      // Sort: P desc, SP desc, PP desc
      const sorted = (data as CopaClassificacaoRow[]).sort((a, b) => {
        if ((b.pontos ?? 0) !== (a.pontos ?? 0)) return (b.pontos ?? 0) - (a.pontos ?? 0);
        if ((b.saldo_pontos ?? 0) !== (a.saldo_pontos ?? 0)) return (b.saldo_pontos ?? 0) - (a.saldo_pontos ?? 0);
        return (b.pontos_pro ?? 0) - (a.pontos_pro ?? 0);
      });

      return sorted;
    },
  });
}
