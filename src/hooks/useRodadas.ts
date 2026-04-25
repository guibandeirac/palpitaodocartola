import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Rodada {
  id: string;
  numero: number;
  rodada_cartola: number | null;
  status: string | null;
}

export function useRodadas() {
  const query = useQuery({
    queryKey: ["rodadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rodadas")
        .select("*")
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as Rodada[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("rodadas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rodadas" },
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
