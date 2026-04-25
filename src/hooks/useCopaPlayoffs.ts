import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CopaPlayoff {
  id: string;
  fase: string;
  chave: string | null;
  equipe1_id: string | null;
  equipe2_id: string | null;
  pontuacao_equipe1_ida: number | null;
  pontuacao_equipe1_volta: number | null;
  pontuacao_equipe1_total: number | null;
  pontuacao_equipe2_ida: number | null;
  pontuacao_equipe2_volta: number | null;
  pontuacao_equipe2_total: number | null;
  vencedor_id: string | null;
  rodada_ida_id: string | null;
  rodada_volta_id: string | null;
  equipe1?: { id: string; nome: string } | null;
  equipe2?: { id: string; nome: string } | null;
  vencedor?: { id: string; nome: string } | null;
}

export function useCopaPlayoffs() {
  return useQuery({
    queryKey: ["copa_playoffs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copa_playoffs")
        .select(`
          *,
          equipe1:equipes!copa_playoffs_equipe1_id_fkey(id, nome),
          equipe2:equipes!copa_playoffs_equipe2_id_fkey(id, nome),
          vencedor:equipes!copa_playoffs_vencedor_id_fkey(id, nome)
        `)
        .order("fase", { ascending: true });

      if (error) throw error;
      return data as CopaPlayoff[];
    },
  });
}
