import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfrontoEquipe } from "@/hooks/useConfrontosRodada";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";
import { TeamLogo } from "@/components/TeamLogo";

interface ConfrontoCardProps {
  confronto: ConfrontoEquipe;
}

export function ConfrontoCard({ confronto }: ConfrontoCardProps) {
  const { equipe1, equipe2, vitorias_equipe1, vitorias_equipe2, confrontos_individuais } = confronto;

  const vitorias1 = vitorias_equipe1 || 0;
  const vitorias2 = vitorias_equipe2 || 0;

  return (
    <Card className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header - Placar estilo futebol */}
      <CardHeader className="bg-gradient-to-r from-secondary/50 to-secondary/30 p-3 sm:pb-6 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={equipe1?.logo_url} nome={equipe1?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              vitorias1 > vitorias2 && "text-primary"
            )}>
              {equipe1?.nome || "Equipe 1"}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={cn(
              "text-3xl sm:text-5xl font-bold tabular-nums",
              vitorias1 > vitorias2 ? "text-primary" : "text-muted-foreground"
            )}>
              {vitorias1}
            </span>
            <span className="text-muted-foreground text-xl sm:text-3xl font-light">×</span>
            <span className={cn(
              "text-3xl sm:text-5xl font-bold tabular-nums",
              vitorias2 > vitorias1 ? "text-primary" : "text-muted-foreground"
            )}>
              {vitorias2}
            </span>
          </div>

          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={equipe2?.logo_url} nome={equipe2?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              vitorias2 > vitorias1 && "text-primary"
            )}>
              {equipe2?.nome || "Equipe 2"}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Confrontos individuais */}
      <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-6">
        <div className="space-y-1">
          {/* Header da tabela - hidden em mobile */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground mb-2 border-b border-border/50">
            <div className="col-span-4">Jogador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-1 text-center">vs</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-3 text-right">Jogador</div>
          </div>

          {confrontos_individuais.map((individual) => {
            const pontos1 = individual.pontuacao_jogador1 ?? 0;
            const pontos2 = individual.pontuacao_jogador2 ?? 0;
            const vencedor = individual.vencedor;

            // Show original player name + 🃏 when coringa substituted
            const coringa1 = individual.jogador1_efetivo?.eh_coringa && 
              individual.jogador1_original && 
              individual.jogador1_efetivo?.id !== individual.jogador1_original?.id;
            const coringa2 = individual.jogador2_efetivo?.eh_coringa && 
              individual.jogador2_original && 
              individual.jogador2_efetivo?.id !== individual.jogador2_original?.id;

            const jogador1Nome = coringa1 
              ? individual.jogador1_original!.nome 
              : (individual.jogador1_original?.nome || individual.jogador1_efetivo?.nome || "Jogador 1");
            const jogador2Nome = coringa2 
              ? individual.jogador2_original!.nome 
              : (individual.jogador2_original?.nome || individual.jogador2_efetivo?.nome || "Jogador 2");

            return (
              <div
                key={individual.id}
                className="flex items-center gap-1 py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors duration-150 sm:grid sm:grid-cols-12 sm:gap-2"
              >
                {/* Jogador 1 - nome */}
                <div className="flex-1 min-w-0 sm:col-span-4 flex items-center gap-1">
                  <span className={cn(
                    "text-[11px] sm:text-xs font-medium break-words leading-tight",
                    vencedor === "jogador1" && "text-primary font-bold"
                  )}>
                    {jogador1Nome}
                  </span>
                  {coringa1 && <span className="text-[10px] sm:text-sm flex-shrink-0">🃏</span>}
                </div>

                {/* Pontos Jogador 1 */}
                <div className="flex-shrink-0 w-[42px] sm:w-auto sm:col-span-2 flex items-center justify-center">
                  <span className={cn(
                    "text-[11px] sm:text-sm font-semibold text-center tabular-nums",
                    vencedor === "jogador1" 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}>
                    {formatarPontuacao(pontos1)}
                  </span>
                </div>

                {/* VS */}
                <div className="flex-shrink-0 w-[12px] sm:w-auto sm:col-span-1 flex items-center justify-center text-muted-foreground text-[10px] sm:text-xs font-light">
                  ×
                </div>

                {/* Pontos Jogador 2 */}
                <div className="flex-shrink-0 w-[42px] sm:w-auto sm:col-span-2 flex items-center justify-center">
                  <span className={cn(
                    "text-[11px] sm:text-sm font-semibold text-center tabular-nums",
                    vencedor === "jogador2" 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}>
                    {formatarPontuacao(pontos2)}
                  </span>
                </div>

                {/* Jogador 2 - nome */}
                <div className="flex-1 min-w-0 sm:col-span-3 flex items-center justify-end gap-1">
                  {coringa2 && <span className="text-[10px] sm:text-sm flex-shrink-0">🃏</span>}
                  <span className={cn(
                    "text-[11px] sm:text-xs font-medium break-words leading-tight text-right",
                    vencedor === "jogador2" && "text-primary font-bold"
                  )}>
                    {jogador2Nome}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
