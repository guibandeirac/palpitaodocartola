import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CopaRodada {
  id: string;
  numero: number;
  rodada_cartola: number;
  fase: string;
  fase_detalhe: string | null;
  status: string;
}

export function useCopaRodadas() {
  return useQuery({
    queryKey: ["copa_rodadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copa_rodadas")
        .select("*")
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as CopaRodada[];
    },
  });
}
