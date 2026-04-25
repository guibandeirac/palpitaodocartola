import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CopaConfronto {
  id: string;
  rodada_id: string;
  equipe1_id: string;
  equipe2_id: string;
  pontuacao_equipe1: number | null;
  pontuacao_equipe2: number | null;
  resultado: string | null;
  equipe1: { id: string; nome: string; logo_url: string | null };
  equipe2: { id: string; nome: string; logo_url: string | null };
}

export interface CopaPontuacaoJogador {
  id: string;
  jogador_id: string;
  equipe_id: string;
  pontuacao: number | null;
  escalou: boolean | null;
  jogador: { id: string; nome: string; eh_coringa: boolean | null };
}

export function useCopaConfrontos(rodadaId: string | null) {
  return useQuery({
    queryKey: ["copa_confrontos", rodadaId],
    queryFn: async () => {
      if (!rodadaId) return [];

      const { data, error } = await supabase
        .from("copa_confrontos")
        .select(`
          *,
          equipe1:equipes!copa_confrontos_equipe1_id_fkey(id, nome, logo_url),
          equipe2:equipes!copa_confrontos_equipe2_id_fkey(id, nome, logo_url)
        `)
        .eq("rodada_id", rodadaId);

      if (error) throw error;
      return data as CopaConfronto[];
    },
    enabled: !!rodadaId,
  });
}

export function useCopaPontuacoes(rodadaId: string | null) {
  return useQuery({
    queryKey: ["copa_pontuacoes", rodadaId],
    queryFn: async () => {
      if (!rodadaId) return [];

      const { data, error } = await supabase
        .from("copa_pontuacoes")
        .select(`
          *,
          jogador:jogadores!copa_pontuacoes_jogador_id_fkey(id, nome, eh_coringa)
        `)
        .eq("rodada_id", rodadaId);

      if (error) throw error;
      return data as CopaPontuacaoJogador[];
    },
    enabled: !!rodadaId,
  });
}
