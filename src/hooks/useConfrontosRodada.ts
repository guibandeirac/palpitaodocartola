import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ConfrontoIndividual {
  id: string;
  ordem: number;
  pontuacao_jogador1: number | null;
  pontuacao_jogador2: number | null;
  vencedor: string | null;
  jogador1_efetivo: {
    id: string;
    nome: string;
    eh_coringa: boolean | null;
  } | null;
  jogador2_efetivo: {
    id: string;
    nome: string;
    eh_coringa: boolean | null;
  } | null;
  jogador1_original: {
    id: string;
    nome: string;
  } | null;
  jogador2_original: {
    id: string;
    nome: string;
  } | null;
}

export interface ConfrontoEquipe {
  id: string;
  vitorias_equipe1: number | null;
  vitorias_equipe2: number | null;
  resultado: string | null;
  equipe1: {
    id: string;
    nome: string;
    logo_url: string | null;
  };
  equipe2: {
    id: string;
    nome: string;
    logo_url: string | null;
  };
  confrontos_individuais: ConfrontoIndividual[];
}

export function useConfrontosRodada(rodadaId: string | null) {
  const query = useQuery({
    queryKey: ["confrontos-rodada", rodadaId],
    queryFn: async () => {
      if (!rodadaId) return [];

      const { data, error } = await supabase
        .from("confrontos_equipe")
        .select(`
          id,
          vitorias_equipe1,
          vitorias_equipe2,
          resultado,
          equipe1:equipes!confrontos_equipe_equipe1_id_fkey(id, nome, logo_url),
          equipe2:equipes!confrontos_equipe_equipe2_id_fkey(id, nome, logo_url),
          confrontos_individuais(
            id,
            ordem,
            pontuacao_jogador1,
            pontuacao_jogador2,
            vencedor,
            jogador1_efetivo:jogadores!confrontos_individuais_jogador1_efetivo_id_fkey(id, nome, eh_coringa),
            jogador2_efetivo:jogadores!confrontos_individuais_jogador2_efetivo_id_fkey(id, nome, eh_coringa),
            jogador1_original:jogadores!confrontos_individuais_jogador1_original_id_fkey(id, nome),
            jogador2_original:jogadores!confrontos_individuais_jogador2_original_id_fkey(id, nome)
          )
        `)
        .eq("rodada_id", rodadaId);

      if (error) throw error;
      
      return (data || []).map((confronto) => ({
        ...confronto,
        equipe1: confronto.equipe1,
        equipe2: confronto.equipe2,
        confrontos_individuais: (confronto.confrontos_individuais || []).sort(
          (a, b) => a.ordem - b.ordem
        ),
      })) as ConfrontoEquipe[];
    },
    enabled: !!rodadaId,
  });

  useEffect(() => {
    if (!rodadaId) return;

    const channel = supabase
      .channel(`confrontos-rodada-${rodadaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confrontos_equipe" },
        () => {
          query.refetch();
        }
      )
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
  }, [rodadaId, query]);

  return query;
}
