import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AtletaDetalhe, ReservaDetalhe } from "@/hooks/useParciais";

export interface CopaJogadorParcial {
  id: string;
  nome: string;
  pontuacao: number;
  escalou: boolean;
  eh_coringa: boolean;
  atletas?: AtletaDetalhe[] | null;
  reservas?: ReservaDetalhe[] | null;
}

export interface CopaConfrontoParcial {
  id: string;
  equipe1: { id: string; nome: string; logo_url?: string | null };
  equipe2: { id: string; nome: string; logo_url?: string | null };
  pontuacao_equipe1: number;
  pontuacao_equipe2: number;
  resultado: string | null;
  jogadores_equipe1: CopaJogadorParcial[];
  jogadores_equipe2: CopaJogadorParcial[];
}

export interface CopaParciaisData {
  rodada: { numero: number; rodada_cartola: number };
  confrontos: CopaConfrontoParcial[];
  atualizado_em: string;
}

export function useCopaParciais() {
  const [data, setData] = useState<CopaParciaisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rodadaNumeroRef = useRef<number | null>(null);

  const fetchParciais = useCallback(async (rodadaNumero: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "calcular-parciais-copa",
        { body: { rodada_numero: rodadaNumero } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!result?.success) throw new Error(result?.error || "Erro desconhecido");

      setData(result as CopaParciaisData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAutoRefresh = useCallback(
    (rodadaNumero: number) => {
      rodadaNumeroRef.current = rodadaNumero;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (rodadaNumeroRef.current) fetchParciais(rodadaNumeroRef.current);
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
        if (next) startAutoRefresh(rodadaNumero);
        else stopAutoRefresh();
        return next;
      });
    },
    [startAutoRefresh, stopAutoRefresh]
  );

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return { data, isLoading, error, fetchParciais, autoRefresh, toggleAutoRefresh };
}
