import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfrontoEquipeParcial, ConfrontoIndividualParcial, AtletaDetalhe, ReservaDetalhe } from "@/hooks/useParciais";
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

interface ParcialConfrontoCardProps {
  confronto: ConfrontoEquipeParcial;
}

// Position display order: GOL, ZAG, LAT, MEI, ATA, TEC
const POSICAO_ORDER: Record<string, number> = {
  GOL: 0, ZAG: 1, LAT: 2, MEI: 3, ATA: 4, TEC: 5,
};

function sortByPosition<T extends { posicao: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (POSICAO_ORDER[a.posicao] ?? 99) - (POSICAO_ORDER[b.posicao] ?? 99));
}

function groupByPosition<T extends { posicao: string }>(items: T[]): T[][] {
  const sorted = sortByPosition(items);
  const groups: T[][] = [];
  let currentPos = "";
  for (const item of sorted) {
    if (item.posicao !== currentPos) {
      groups.push([]);
      currentPos = item.posicao;
    }
    groups[groups.length - 1].push(item);
  }
  return groups;
}

function AtletaRow({ nome, clube, posicao, pontuacao, pontuacaoBase, ehCapitao, ehReservaLuxo, status, entrou, substituiuNome, ehLuxoEntrou, saiu }: {
  nome: string;
  clube: string;
  posicao: string;
  pontuacao: number | null;
  pontuacaoBase?: number;
  ehCapitao?: boolean;
  ehReservaLuxo?: boolean;
  status: string;
  entrou?: boolean;
  substituiuNome?: string | null;
  ehLuxoEntrou?: boolean;
  saiu?: boolean;
}) {
  let pontuacaoTexto: React.ReactNode;

  if (saiu) {
    pontuacaoTexto = <span className="text-destructive/70 text-[9px]">↓ saiu</span>;
  } else if (status === "jogo_invalido") {
    pontuacaoTexto = <span className="text-destructive/70">🚫</span>;
  } else if (status === "aguardando") {
    pontuacaoTexto = <span className="text-muted-foreground">⏳</span>;
  } else if (status === "nao_entrou") {
    pontuacaoTexto = <span>❌</span>;
  } else if (ehCapitao && pontuacaoBase != null && pontuacao != null) {
    pontuacaoTexto = (
      <span className="tabular-nums">
        <span className="text-muted-foreground">{formatarPontuacao(pontuacaoBase)}</span>
        <span className="text-[8px] text-muted-foreground mx-0.5">×1.5</span>
        <span className="font-bold">{formatarPontuacao(pontuacao)}</span>
      </span>
    );
  } else {
    pontuacaoTexto = <span className="tabular-nums font-medium">{pontuacao != null ? formatarPontuacao(pontuacao) : "-"}</span>;
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-1 text-[10px] sm:text-xs leading-tight py-[1px]",
      saiu && "opacity-50",
    )}>
      <span className={cn(
        "truncate flex-1 flex items-center gap-0.5",
        status === "aguardando" && "text-muted-foreground",
        status === "jogo_invalido" && "text-muted-foreground line-through",
        status === "nao_entrou" && "text-muted-foreground line-through",
      )}>
        {ehCapitao && <span className="text-yellow-500 flex-shrink-0">⭐</span>}
        {ehReservaLuxo && <span className="flex-shrink-0">🌟</span>}
        <span className="truncate font-bold">{nome}</span>
        <span className="text-muted-foreground flex-shrink-0 ml-0.5">{posicao}/{clube}</span>
        {entrou && !saiu && (
          <span className="text-[8px] sm:text-[9px] text-green-500 font-semibold flex-shrink-0 ml-0.5">
            ↑{ehLuxoEntrou && substituiuNome ? ` ${substituiuNome}` : ""}
          </span>
        )}
      </span>
      <span className="flex-shrink-0 ml-1">
        {pontuacaoTexto}
      </span>
    </div>
  );
}

function TeamColumn({
  nomeJogador,
  atletas,
  reservas,
  total,
}: {
  nomeJogador: string;
  atletas: AtletaDetalhe[];
  reservas: ReservaDetalhe[];
  total: number;
}) {
  // Separate: reserves that entered go to titulares section, replaced titulares go to reserves section
  const enteredReserves = reservas.filter(r => r.entrou);
  const benchReserves = reservas.filter(r => !r.entrou);

  // Build display titulares: original titulares (non-substituted) + entered reserves
  // The atletas array from backend already has the substituted player in the titular slot
  // So we just need to mark which ones are reserves that entered
  const displayTitulares = atletas.map(a => ({
    ...a,
    entrou: a.entrou_como_reserva,
    substituiuNome: null as string | null,
    ehLuxoEntrou: a.eh_reserva_luxo,
  }));

  // Find entered reserves to get substituiu_nome for display
  for (const er of enteredReserves) {
    const match = displayTitulares.find(dt => dt.entrou && dt.eh_reserva_luxo === er.eh_reserva_luxo && dt.posicao === er.posicao);
    if (match && er.substituiu_nome) {
      match.substituiuNome = er.substituiu_nome;
    }
  }

  // Build display reserves: titulares that were replaced (show as "↓ saiu") + bench reserves
  const replacedTitulares = enteredReserves.map(er => ({
    nome: er.substituiu_nome || "Atleta",
    clube: "",
    posicao: er.posicao,
    posicao_id: er.posicao_id,
    pontuacao: null as number | null,
    saiu: true,
  }));

  const titularGroups = groupByPosition(displayTitulares);

  // Combine replaced titulares + bench reserves for display
  const displayReserves = [
    ...replacedTitulares.map(rt => ({ nome: rt.nome, clube: rt.clube, posicao: rt.posicao, posicao_id: rt.posicao_id, pontuacao: null as number | null, ehReservaLuxo: false, entrou: false, substituiuNome: null as string | null, ehLuxoEntrou: false, status: "banco" as string, saiu: true })),
    ...benchReserves.map(br => ({ nome: br.nome, clube: br.clube, posicao: br.posicao, posicao_id: br.posicao_id, pontuacao: br.pontuacao, ehReservaLuxo: br.eh_reserva_luxo, entrou: br.entrou, substituiuNome: br.substituiu_nome as string | null, ehLuxoEntrou: br.eh_luxo_entrou, status: br.status as string, saiu: false })),
  ];
  const reserveGroups = groupByPosition(displayReserves);

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Titulares</div>
      {titularGroups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="border-t border-border/30 my-0.5" />}
          {group.map((a, i) => (
            <AtletaRow
              key={`${gi}-${i}`}
              nome={a.nome}
              clube={a.clube}
              posicao={a.posicao}
              pontuacao={a.pontuacao}
              pontuacaoBase={a.pontuacao_base}
              ehCapitao={a.eh_capitao}
              ehReservaLuxo={a.eh_reserva_luxo}
              status={a.status}
              entrou={a.entrou}
              substituiuNome={a.substituiuNome}
              ehLuxoEntrou={a.ehLuxoEntrou}
            />
          ))}
        </div>
      ))}

      <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 mb-0.5">Reservas</div>
      {reserveGroups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="border-t border-border/30 my-0.5" />}
          {group.map((r, i) => (
            <AtletaRow
              key={`r${gi}-${i}`}
              nome={r.nome}
              clube={r.clube}
              posicao={r.posicao}
              pontuacao={r.saiu ? null : r.pontuacao}
              ehReservaLuxo={r.ehReservaLuxo}
              status={r.status}
              entrou={r.entrou}
              substituiuNome={r.substituiuNome}
              ehLuxoEntrou={r.ehLuxoEntrou}
              saiu={r.saiu}
            />
          ))}
        </div>
      ))}

      <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold border-t border-border/50 pt-1 mt-1.5">
        <span>Total</span>
        <span className="tabular-nums">{formatarPontuacao(total)}</span>
      </div>
    </div>
  );
}

function ConfrontoDetalhes({ individual }: { individual: ConfrontoIndividualParcial }) {
  const { jogador1, jogador2 } = individual;
  const hasData = (jogador1.atletas && jogador1.atletas.length > 0) || (jogador2.atletas && jogador2.atletas.length > 0);

  if (!hasData) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-muted/40 rounded-md px-2.5 py-2 mt-1 animate-fade-in">
      {jogador1.atletas && jogador1.atletas.length > 0 && (
        <TeamColumn
          nomeJogador={jogador1.nome}
          atletas={jogador1.atletas}
          reservas={jogador1.reservas || []}
          total={jogador1.pontuacao}
        />
      )}
      {jogador1.atletas && jogador2.atletas && (
        <div className="hidden sm:block w-px bg-border/60 self-stretch" />
      )}
      {jogador2.atletas && jogador2.atletas.length > 0 && (
        <TeamColumn
          nomeJogador={jogador2.nome}
          atletas={jogador2.atletas}
          reservas={jogador2.reservas || []}
          total={jogador2.pontuacao}
        />
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
