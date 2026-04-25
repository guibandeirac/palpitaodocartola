import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";
import { TeamLogo } from "@/components/TeamLogo";
import type { CopaConfrontoParcial, CopaJogadorParcial } from "@/hooks/useCopaParciais";
import type { AtletaDetalhe, ReservaDetalhe } from "@/hooks/useParciais";

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

function AtletaRow({ atleta, saiu }: { atleta: AtletaDetalhe & { entrou?: boolean; substituiuNome?: string | null; ehLuxoEntrou?: boolean }; saiu?: boolean }) {
  let pontuacaoTexto: React.ReactNode;

  if (saiu) {
    pontuacaoTexto = <span className="text-destructive/70 text-[9px]">↓ saiu</span>;
  } else if (atleta.status === "jogo_invalido") {
    pontuacaoTexto = <span className="text-destructive/70">🚫</span>;
  } else if (atleta.status === "aguardando") {
    pontuacaoTexto = <span className="text-muted-foreground">⏳</span>;
  } else if (atleta.status === "nao_entrou") {
    pontuacaoTexto = <span>❌</span>;
  } else if (atleta.eh_capitao && atleta.pontuacao_base != null) {
    pontuacaoTexto = (
      <span className="tabular-nums">
        <span className="text-muted-foreground">{formatarPontuacao(atleta.pontuacao_base)}</span>
        <span className="text-[8px] text-muted-foreground mx-0.5">×1.5</span>
        <span className="font-bold">{formatarPontuacao(atleta.pontuacao)}</span>
      </span>
    );
  } else {
    pontuacaoTexto = <span className="tabular-nums font-medium">{formatarPontuacao(atleta.pontuacao)}</span>;
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-1 text-[10px] sm:text-xs leading-tight py-[1px]",
      saiu && "opacity-50",
    )}>
      <span className={cn(
        "truncate flex-1 flex items-center gap-0.5",
        atleta.status === "aguardando" && "text-muted-foreground",
        (atleta.status === "jogo_invalido" || atleta.status === "nao_entrou") && "text-muted-foreground line-through",
      )}>
        {atleta.eh_capitao && <span className="text-yellow-500 flex-shrink-0">⭐</span>}
        {atleta.eh_reserva_luxo && <span className="flex-shrink-0">🌟</span>}
        <span className="truncate font-bold">{atleta.nome}</span>
        <span className="text-muted-foreground flex-shrink-0 ml-0.5">{atleta.posicao}/{atleta.clube}</span>
        {atleta.entrou && !saiu && (
          <span className="text-[8px] sm:text-[9px] text-green-500 font-semibold flex-shrink-0 ml-0.5">
            ↑{atleta.ehLuxoEntrou && atleta.substituiuNome ? ` ${atleta.substituiuNome}` : ""}
          </span>
        )}
      </span>
      <span className="flex-shrink-0 ml-1">{pontuacaoTexto}</span>
    </div>
  );
}

function JogadorDetalhes({ jogador }: { jogador: CopaJogadorParcial }) {
  const atletas = jogador.atletas || [];
  const reservas = jogador.reservas || [];

  if (atletas.length === 0) return null;

  const enteredReserves = reservas.filter(r => r.entrou);
  const benchReserves = reservas.filter(r => !r.entrou);

  const displayTitulares = atletas.map(a => ({
    ...a,
    entrou: a.entrou_como_reserva,
    substituiuNome: null as string | null,
    ehLuxoEntrou: a.eh_reserva_luxo,
  }));

  for (const er of enteredReserves) {
    const match = displayTitulares.find(dt => dt.entrou && dt.eh_reserva_luxo === er.eh_reserva_luxo && dt.posicao === er.posicao);
    if (match && er.substituiu_nome) match.substituiuNome = er.substituiu_nome;
  }

  const replacedTitulares = enteredReserves.map(er => ({
    nome: er.substituiu_nome || "Atleta",
    clube: "", posicao: er.posicao, posicao_id: er.posicao_id,
    pontuacao: 0, pontuacao_base: 0,
    eh_capitao: false, eh_reserva_luxo: false,
    substituido: false, entrou_como_reserva: false,
    status: "banco" as const,
    saiu: true,
  }));

  const displayReserves = [
    ...replacedTitulares.map(rt => ({ ...rt, entrou: false, substituiuNome: null as string | null, ehLuxoEntrou: false })),
    ...benchReserves.map(br => ({
      nome: br.nome, clube: br.clube, posicao: br.posicao, posicao_id: br.posicao_id,
      pontuacao: br.pontuacao ?? 0, pontuacao_base: br.pontuacao ?? 0,
      eh_capitao: false, eh_reserva_luxo: br.eh_reserva_luxo,
      substituido: false, entrou_como_reserva: false,
      status: br.status as any,
      entrou: br.entrou, substituiuNome: br.substituiu_nome as string | null,
      ehLuxoEntrou: br.eh_luxo_entrou, saiu: false,
    })),
  ];

  const titularGroups = groupByPosition(displayTitulares);
  const reserveGroups = groupByPosition(displayReserves);

  return (
    <div className="mt-1 bg-muted/30 rounded-md p-2 text-[10px]">
      <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">Titulares</div>
      {titularGroups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="border-t border-border/30 my-0.5" />}
          {group.map((a, i) => <AtletaRow key={`${gi}-${i}`} atleta={a} />)}
        </div>
      ))}
      <div className="text-[9px] font-semibold text-muted-foreground uppercase mt-1 mb-0.5">Reservas</div>
      {reserveGroups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="border-t border-border/30 my-0.5" />}
          {group.map((r, i) => <AtletaRow key={`r${gi}-${i}`} atleta={r} saiu={(r as any).saiu} />)}
        </div>
      ))}
      <div className="flex items-center justify-between text-[10px] font-bold border-t border-border/50 pt-0.5 mt-1">
        <span>Total</span>
        <span className="tabular-nums">{formatarPontuacao(jogador.pontuacao)}</span>
      </div>
    </div>
  );
}

function JogadorRow({ jogador }: { jogador: CopaJogadorParcial }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = jogador.atletas && jogador.atletas.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between py-1 px-2 rounded-md bg-secondary/20 text-xs sm:text-sm",
          hasDetails && "cursor-pointer hover:bg-secondary/40"
        )}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1">
          <span className="font-medium">{jogador.nome}</span>
          {jogador.eh_coringa && <span title="Coringa">🃏</span>}
          {!jogador.escalou && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-destructive text-destructive">
              N/E
            </Badge>
          )}
          {hasDetails && (
            expanded
              ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
              : <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
        <span className={cn(
          "font-semibold tabular-nums",
          jogador.pontuacao > 0 ? "text-[hsl(var(--warning))]" : "text-muted-foreground"
        )}>
          {formatarPontuacao(jogador.pontuacao)}
        </span>
      </div>
      {expanded && hasDetails && <JogadorDetalhes jogador={jogador} />}
    </div>
  );
}

function sortJogadores(jogadores: CopaJogadorParcial[]): CopaJogadorParcial[] {
  return [...jogadores].sort((a, b) => {
    if (a.eh_coringa && !b.eh_coringa) return 1;
    if (!a.eh_coringa && b.eh_coringa) return -1;
    return 0;
  });
}

interface Props {
  confronto: CopaConfrontoParcial;
}

export function CopaParcialConfrontoCard({ confronto }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { equipe1, equipe2, pontuacao_equipe1, pontuacao_equipe2, resultado } = confronto;
  const winner = resultado === "equipe1" ? 1 : resultado === "equipe2" ? 2 : 0;

  return (
    <Card className="bg-card border-blue-500/20 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader
        className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-3 sm:p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={equipe1?.logo_url} nome={equipe1?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              winner === 1 && "text-[hsl(var(--warning))]"
            )}>
              {equipe1?.nome || "Equipe 1"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={cn(
              "text-2xl sm:text-4xl font-bold tabular-nums text-[hsl(var(--warning))]",
              winner !== 1 && "text-muted-foreground"
            )}>
              {Math.floor(pontuacao_equipe1)}
            </span>
            <span className="text-muted-foreground text-xl sm:text-3xl font-light">×</span>
            <span className={cn(
              "text-2xl sm:text-4xl font-bold tabular-nums text-[hsl(var(--warning))]",
              winner !== 2 && "text-muted-foreground"
            )}>
              {Math.floor(pontuacao_equipe2)}
            </span>
          </div>
          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <TeamLogo logoUrl={equipe2?.logo_url} nome={equipe2?.nome || ""} size="md" />
            <p className={cn(
              "font-bold text-sm sm:text-xl break-words",
              winner === 2 && "text-[hsl(var(--warning))]"
            )}>
              {equipe2?.nome || "Equipe 2"}
            </p>
          </div>
          <div className="text-muted-foreground ml-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
                {equipe1?.nome}
              </h4>
              <div className="space-y-1">
                {sortJogadores(confronto.jogadores_equipe1).map((j) => (
                  <JogadorRow key={j.id} jogador={j} />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-bold border-t border-border/50 pt-1 mt-2 px-2">
                <span>Total</span>
                <span className="tabular-nums">{Math.floor(pontuacao_equipe1)}</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
                {equipe2?.nome}
              </h4>
              <div className="space-y-1">
                {sortJogadores(confronto.jogadores_equipe2).map((j) => (
                  <JogadorRow key={j.id} jogador={j} />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-bold border-t border-border/50 pt-1 mt-2 px-2">
                <span>Total</span>
                <span className="tabular-nums">{Math.floor(pontuacao_equipe2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
