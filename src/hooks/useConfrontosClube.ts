import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConfrontoClube {
  id: string;
  competicao: "serie_b" | "copa";
  rodada: number;
  /** Ex.: "Grupos - ida" na Copa */
  fase?: string;
  adversario: { id: string; nome: string; logo_url: string | null };
  placarPro: number;
  placarContra: number;
  resultado: "V" | "E" | "D";
}

type EquipeRef = { id: string; nome: string; logo_url: string | null } | null;

function resultadoDe(pro: number, contra: number): ConfrontoClube["resultado"] {
  if (pro > contra) return "V";
  if (pro < contra) return "D";
  return "E";
}

/** Confrontos já finalizados do clube na Série B e na Copa, do mais recente para o mais antigo */
export function useConfrontosClube(equipeId: string | undefined) {
  return useQuery({
    queryKey: ["confrontos-clube", equipeId],
    enabled: !!equipeId,
    queryFn: async () => {
      const id = equipeId!;
      const filtro = `equipe1_id.eq.${id},equipe2_id.eq.${id}`;

      const [serieB, copa] = await Promise.all([
        supabase
          .from("confrontos_equipe")
          .select(
            `id, equipe1_id, vitorias_equipe1, vitorias_equipe2,
             rodada:rodadas!inner(numero, status_b),
             e1:equipes!confrontos_equipe_equipe1_id_fkey(id, nome, logo_url, serie),
             e2:equipes!confrontos_equipe_equipe2_id_fkey(id, nome, logo_url, serie)`,
          )
          .or(filtro)
          .eq("rodada.status_b", "finalizada"),
        supabase
          .from("copa_confrontos")
          .select(
            `id, equipe1_id, pontuacao_equipe1, pontuacao_equipe2,
             rodada:copa_rodadas!inner(numero, status, fase, fase_detalhe),
             e1:equipes!copa_confrontos_equipe1_id_fkey(id, nome, logo_url),
             e2:equipes!copa_confrontos_equipe2_id_fkey(id, nome, logo_url)`,
          )
          .or(filtro)
          .eq("rodada.status", "finalizada"),
      ]);

      if (serieB.error) throw serieB.error;
      if (copa.error) throw copa.error;

      const lista: ConfrontoClube[] = [];

      for (const c of serieB.data as any[]) {
        const e1 = c.e1 as (EquipeRef & { serie: string }) | null;
        const e2 = c.e2 as (EquipeRef & { serie: string }) | null;
        // Série B só conta confronto entre equipes da série (mesmo filtro da página da Série B)
        if (!e1 || !e2 || e1.serie !== "B" || e2.serie !== "B") continue;
        const casa = c.equipe1_id === id;
        const pro = Number(casa ? c.vitorias_equipe1 : c.vitorias_equipe2) || 0;
        const contra = Number(casa ? c.vitorias_equipe2 : c.vitorias_equipe1) || 0;
        const adv = casa ? e2 : e1;
        lista.push({
          id: c.id,
          competicao: "serie_b",
          rodada: c.rodada.numero,
          adversario: { id: adv.id, nome: adv.nome, logo_url: adv.logo_url },
          placarPro: pro,
          placarContra: contra,
          resultado: resultadoDe(pro, contra),
        });
      }

      for (const c of copa.data as any[]) {
        const adv = (c.equipe1_id === id ? c.e2 : c.e1) as EquipeRef;
        if (!adv) continue;
        const casa = c.equipe1_id === id;
        const pro = Math.round(Number(casa ? c.pontuacao_equipe1 : c.pontuacao_equipe2) || 0);
        const contra = Math.round(Number(casa ? c.pontuacao_equipe2 : c.pontuacao_equipe1) || 0);
        lista.push({
          id: c.id,
          competicao: "copa",
          rodada: c.rodada.numero,
          fase: c.rodada.fase_detalhe ? `${c.rodada.fase} - ${c.rodada.fase_detalhe}` : c.rodada.fase,
          adversario: adv,
          placarPro: pro,
          placarContra: contra,
          resultado: resultadoDe(pro, contra),
        });
      }

      return lista.sort((a, b) => b.rodada - a.rodada);
    },
  });
}
