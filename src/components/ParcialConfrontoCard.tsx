import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfrontoEquipeParcial, ConfrontoIndividualParcial } from "@/hooks/useParciais";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { TeamLogo } from "@/components/TeamLogo";
import { CampoFutebol } from "@/components/CampoFutebol";

interface ParcialConfrontoCardProps {
  confronto: ConfrontoEquipeParcial;
}

function contarJogados(atletas: { status: string }[] | null | undefined): { jogados: number; total: number } | null {
  if (!atletas || atletas.length === 0) return null;
  const jogados = atletas.filter((a) => a.status === "ok").length;
  return { jogados, total: atletas.length };
}

function ConfrontoDetalhes({ individual }: { individual: ConfrontoIndividualParcial }) {
  const { jogador1, jogador2 } = individual;
  const hasData = (jogador1.atletas && jogador1.atletas.length > 0) || (jogador2.atletas && jogador2.atletas.length > 0);

  if (!hasData) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 bg-muted/40 rounded-md px-1 py-3 mt-2 animate-fade-in">
      {jogador1.atletas && jogador1.atletas.length > 0 && (
        <div className="flex-1 min-w-0">
          <div className="text-center text-xs sm:text-sm font-semibold mb-2 truncate">
            {jogador1.nome}
          </div>
          <CampoFutebol
            atletas={jogador1.atletas}
            reservas={jogador1.reservas || []}
            total={jogador1.pontuacao}
          />
        </div>
      )}
      {jogador2.atletas && jogador2.atletas.length > 0 && (
        <div className="flex-1 min-w-0">
          <div className="text-center text-xs sm:text-sm font-semibold mb-2 truncate">
            {jogador2.nome}
          </div>
          <CampoFutebol
            atletas={jogador2.atletas}
            reservas={jogador2.reservas || []}
            total={jogador2.pontuacao}
          />
        </div>
      )}
    </div>
  );
}

export function ParcialConfrontoCard({ confronto }: ParcialConfrontoCardProps) {
  const { equipe1, equipe2, vitorias_equipe1, vitorias_equipe2, confrontos_individuais } = confronto;
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="bg-gradient-to-r from-secondary/50 to-secondary/30 p-3 sm:pb-6 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={(equipe1 as any)?.logo_url} nome={equipe1?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              vitorias_equipe1 > vitorias_equipe2 && "text-[hsl(var(--warning))]"
            )}>
              {equipe1?.nome || "Equipe 1"}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className={cn(
              "text-3xl sm:text-5xl font-bold tabular-nums text-[hsl(var(--warning))]",
              vitorias_equipe1 <= vitorias_equipe2 && "text-muted-foreground"
            )}>
              {vitorias_equipe1}
            </span>
            <span className="text-muted-foreground text-xl sm:text-3xl font-light">×</span>
            <span className={cn(
              "text-3xl sm:text-5xl font-bold tabular-nums text-[hsl(var(--warning))]",
              vitorias_equipe2 <= vitorias_equipe1 && "text-muted-foreground"
            )}>
              {vitorias_equipe2}
            </span>
          </div>

          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={(equipe2 as any)?.logo_url} nome={equipe2?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              vitorias_equipe2 > vitorias_equipe1 && "text-[hsl(var(--warning))]"
            )}>
              {equipe2?.nome || "Equipe 2"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-6">
        <div className="space-y-1">
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground mb-2 border-b border-border/50">
            <div className="col-span-4">Jogador</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-1 text-center">vs</div>
            <div className="col-span-2 text-center">Pts</div>
            <div className="col-span-3 text-right">Jogador</div>
          </div>

          <TooltipProvider delayDuration={200}>
            {confrontos_individuais.map((individual) => {
              const { jogador1, jogador2 } = individual;
              const isEmpate = jogador1.pontuacao === jogador2.pontuacao && individual.vencedor !== null;
              const isOpen = openIds.has(individual.id);
              const hasDetails = (jogador1.atletas && jogador1.atletas.length > 0) || (jogador2.atletas && jogador2.atletas.length > 0);

              // Show original player name + 🃏 when coringa substituted
              const jogador1DisplayName = jogador1.eh_coringa && jogador1.jogador_original_nome
                ? jogador1.jogador_original_nome
                : jogador1.nome;
              const jogador2DisplayName = jogador2.eh_coringa && jogador2.jogador_original_nome
                ? jogador2.jogador_original_nome
                : jogador2.nome;

              const jogados1 = contarJogados(jogador1.atletas);
              const jogados2 = contarJogados(jogador2.atletas);

              return (
                <div
                  key={individual.id}
                  className="py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors duration-150"
                >
                  <div
                    className={cn(
                      "flex items-center gap-1 sm:grid sm:grid-cols-12 sm:gap-2",
                      hasDetails && "cursor-pointer"
                    )}
                    onClick={() => hasDetails && toggle(individual.id)}
                  >
                    {/* Jogador 1 */}
                    <div className="flex-1 min-w-0 sm:col-span-4 flex items-center gap-1 flex-wrap">
                      <span className={cn(
                        "text-[11px] sm:text-xs font-medium break-words leading-tight",
                        individual.vencedor === "jogador1" && "text-[hsl(var(--warning))] font-bold"
                      )}>
                        {jogador1DisplayName}
                      </span>
                      {jogados1 && (
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground tabular-nums flex-shrink-0" title="Atletas que já jogaram">
                          {jogados1.jogados}/{jogados1.total}
                        </span>
                      )}
                      {jogador1.eh_coringa && (
                        <span className="text-[10px] sm:text-sm flex-shrink-0" title="Coringa entrou">🃏</span>
                      )}
                      {!jogador1.escalou && !jogador1.eh_coringa && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-destructive text-destructive">
                          Não escalou
                        </Badge>
                      )}
                    </div>

                    {/* Pontos 1 */}
                    <div className="flex-shrink-0 w-[42px] sm:w-auto sm:col-span-2 flex flex-col items-center justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "text-[11px] sm:text-sm font-semibold text-center tabular-nums text-[hsl(var(--warning))]",
                            individual.vencedor !== "jogador1" && "text-muted-foreground"
                          )}>
                            {formatarPontuacao(jogador1.pontuacao)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Pts Campeonato: {formatarPontuacao(jogador1.pontos_campeonato)}</p>
                        </TooltipContent>
                      </Tooltip>
                      {isEmpate && (
                        <span className="text-[8px] text-muted-foreground leading-none">
                          C: {formatarPontuacao(jogador1.pontos_campeonato)}
                        </span>
                      )}
                    </div>

                    <div className="flex-shrink-0 w-[12px] sm:w-auto sm:col-span-1 flex items-center justify-center text-muted-foreground text-[10px] sm:text-xs font-light">
                      ×
                    </div>

                    {/* Pontos 2 */}
                    <div className="flex-shrink-0 w-[42px] sm:w-auto sm:col-span-2 flex flex-col items-center justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "text-[11px] sm:text-sm font-semibold text-center tabular-nums text-[hsl(var(--warning))]",
                            individual.vencedor !== "jogador2" && "text-muted-foreground"
                          )}>
                            {formatarPontuacao(jogador2.pontuacao)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Pts Campeonato: {formatarPontuacao(jogador2.pontos_campeonato)}</p>
                        </TooltipContent>
                      </Tooltip>
                      {isEmpate && (
                        <span className="text-[8px] text-muted-foreground leading-none">
                          C: {formatarPontuacao(jogador2.pontos_campeonato)}
                        </span>
                      )}
                    </div>

                    {/* Jogador 2 */}
                    <div className="flex-1 min-w-0 sm:col-span-3 flex items-center justify-end gap-1 flex-wrap">
                      {!jogador2.escalou && !jogador2.eh_coringa && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-destructive text-destructive">
                          Não escalou
                        </Badge>
                      )}
                      {jogador2.eh_coringa && (
                        <span className="text-[10px] sm:text-sm flex-shrink-0" title="Coringa entrou">🃏</span>
                      )}
                      {jogados2 && (
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground tabular-nums flex-shrink-0" title="Atletas que já jogaram">
                          {jogados2.jogados}/{jogados2.total}
                        </span>
                      )}
                      <span className={cn(
                        "text-[11px] sm:text-xs font-medium break-words leading-tight text-right",
                        individual.vencedor === "jogador2" && "text-[hsl(var(--warning))] font-bold"
                      )}>
                        {jogador2DisplayName}
                      </span>
                      {hasDetails && (
                        <ChevronDown className={cn(
                          "h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180"
                        )} />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && <ConfrontoDetalhes individual={individual} />}
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
