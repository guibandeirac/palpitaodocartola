import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AtletaDetalhe {
  nome: string;
  clube: string;
  posicao: string;
  posicao_id: number;
  pontuacao: number;
  pontuacao_base: number;
  eh_capitao: boolean;
  eh_reserva_luxo: boolean;
  substituido: boolean;
  entrou_como_reserva: boolean;
  status: "ok" | "aguardando" | "nao_entrou" | "jogo_invalido";
}

export interface ReservaDetalhe {
  nome: string;
  clube: string;
  posicao: string;
  posicao_id: number;
  pontuacao: number | null;
  entrou_em_campo: boolean;
  eh_reserva_luxo: boolean;
  entrou: boolean;
  substituiu_nome: string | null;
  eh_luxo_entrou: boolean;
  status: "banco" | "aguardando" | "nao_entrou" | "jogo_invalido";
}

export interface JogadorParcial {
  id: string;
  nome: string;
  pontuacao: number;
  eh_coringa: boolean;
  escalou: boolean;
  jogador_original_nome: string | null;
  pontos_campeonato?: number;
  atletas?: AtletaDetalhe[] | null;
  reservas?: ReservaDetalhe[] | null;
}

export interface ConfrontoIndividualParcial {
  id: string;
  ordem: number;
  jogador1: JogadorParcial;
  jogador2: JogadorParcial;
  vencedor: string | null;
}

export interface ConfrontoEquipeParcial {
  id: string;
  equipe1: { id: string; nome: string };
  equipe2: { id: string; nome: string };
  vitorias_equipe1: number;
  vitorias_equipe2: number;
  confrontos_individuais: ConfrontoIndividualParcial[];
}

export interface ParciaisData {
  rodada: { numero: number; rodada_cartola: number };
  confrontos: ConfrontoEquipeParcial[];
  atualizado_em: string;
}

export function useParciais() {
  const [data, setData] = useState<ParciaisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchParciais = useCallback(async (rodadaNumero: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "calcular-parciais",
        { body: { rodada_numero: rodadaNumero } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!result?.success) throw new Error(result?.error || "Erro desconhecido");

      setData(result as ParciaisData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  const rodadaNumeroRef = useRef<number | null>(null);

  const startAutoRefresh = useCallback(
    (rodadaNumero: number) => {
      rodadaNumeroRef.current = rodadaNumero;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (rodadaNumeroRef.current) {
          fetchParciais(rodadaNumeroRef.current);
        }
      }, 5 * 60 * 1000);
    },
    [fetchParciais]
  );

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleAutoRefresh = useCallback(
    (rodadaNumero: number) => {
      setAutoRefresh((prev) => {
        const next = !prev;
        if (next) {
          startAutoRefresh(rodadaNumero);
        } else {
          stopAutoRefresh();
        }
        return next;
      });
    },
    [startAutoRefresh, stopAutoRefresh]
  );

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    data,
    isLoading,
    error,
    fetchParciais,
    autoRefresh,
    toggleAutoRefresh,
  };
}
