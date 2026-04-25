import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Jogador {
  id: string;
  nome: string;
  id_cartola: number;
  equipe_id: string | null;
  eh_coringa: boolean | null;
  ativo: boolean | null;
  rodada_entrada: number | null;
  rodada_saida: number | null;
}

export function useJogadores() {
  return useQuery({
    queryKey: ["jogadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Jogador[];
    },
  });
}

export function useJogadoresByEquipe(equipeId: string | null) {
  return useQuery({
    queryKey: ["jogadores", equipeId],
    queryFn: async () => {
      if (!equipeId) return [];

      const { data, error } = await supabase
        .from("jogadores")
        .select("*")
        .eq("equipe_id", equipeId)
        .order("nome");

      if (error) throw error;
      return data as Jogador[];
    },
    enabled: !!equipeId,
  });
}
