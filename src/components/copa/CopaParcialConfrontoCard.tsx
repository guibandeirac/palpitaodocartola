import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";
import { TeamLogo } from "@/components/TeamLogo";
import type { CopaConfrontoParcial, CopaJogadorParcial } from "@/hooks/useCopaParciais";
import { CampoFutebol } from "@/components/CampoFutebol";

function JogadorDetalhes({ jogador }: { jogador: CopaJogadorParcial }) {
  if (!jogador.atletas || jogador.atletas.length === 0) return null;

  return (
    <div className="mt-1 bg-muted/40 rounded-md px-1 py-3 animate-fade-in">
      <CampoFutebol
        atletas={jogador.atletas}
        reservas={jogador.reservas || []}
        total={jogador.pontuacao}
      />
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
