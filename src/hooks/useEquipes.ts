import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Equipe {
  id: string;
  nome: string;
  logo_url: string | null;
  serie?: string;
}

export function useEquipes(serie?: string) {
  return useQuery({
    queryKey: ["equipes", serie],
    queryFn: async () => {
      let query = supabase
        .from("equipes")
        .select("id, nome, logo_url, serie")
        .order("nome");

      if (serie) {
        query = query.eq("serie", serie);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Equipe[];
    },
  });
}
