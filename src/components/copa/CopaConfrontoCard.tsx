import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CopaConfronto, CopaPontuacaoJogador } from "@/hooks/useCopaConfrontos";
import { formatarPontuacao } from "@/lib/pontuacao";
import { TeamLogo } from "@/components/TeamLogo";

interface Props {
  confronto: CopaConfronto;
  pontuacoes: CopaPontuacaoJogador[];
}

const formatInteiro = (v: number) => String(Math.floor(v));

export function CopaConfrontoCard({ confronto, pontuacoes }: Props) {
  const [expanded, setExpanded] = useState(false);

  const p1 = confronto.pontuacao_equipe1 ?? 0;
  const p2 = confronto.pontuacao_equipe2 ?? 0;
  const winner =
    confronto.resultado === "equipe1"
      ? 1
      : confronto.resultado === "equipe2"
      ? 2
      : confronto.resultado === "empate"
      ? 0
      : null;

  const pontosEquipe1 = pontuacoes.filter(
    (p) => p.equipe_id === confronto.equipe1_id
  );
  const pontosEquipe2 = pontuacoes.filter(
    (p) => p.equipe_id === confronto.equipe2_id
  );

  return (
    <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
      <CardContent className="p-0">
        {/* Score row */}
        <button
          className="w-full px-4 py-4 flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="flex items-center gap-2">
              <TeamLogo logoUrl={confronto.equipe1?.logo_url} nome={confronto.equipe1?.nome || ""} size="md" />
              <span
                className={`text-sm sm:text-base font-medium text-right ${
                  winner === 1 ? "text-blue-400 font-bold" : "text-foreground"
                }`}
              >
                {confronto.equipe1?.nome}
              </span>
            </div>
            <span
              className={`text-lg sm:text-xl font-bold min-w-[3rem] text-center rounded px-2 py-0.5 ${
                winner === 1
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-secondary text-foreground"
              }`}
            >
              {formatInteiro(p1)}
            </span>
          </div>

          <span className="text-muted-foreground text-xs mx-2">×</span>

          <div className="flex items-center gap-3 flex-1">
            <span
              className={`text-lg sm:text-xl font-bold min-w-[3rem] text-center rounded px-2 py-0.5 ${
                winner === 2
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-secondary text-foreground"
              }`}
            >
              {formatInteiro(p2)}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm sm:text-base font-medium ${
                  winner === 2 ? "text-blue-400 font-bold" : "text-foreground"
                }`}
              >
                {confronto.equipe2?.nome}
              </span>
              <TeamLogo logoUrl={confronto.equipe2?.logo_url} nome={confronto.equipe2?.nome || ""} size="md" />
            </div>
          </div>

          <div className="ml-2 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-border px-4 py-3 grid grid-cols-2 gap-4">
            <PlayerList players={pontosEquipe1} teamName={confronto.equipe1?.nome} />
            <PlayerList players={pontosEquipe2} teamName={confronto.equipe2?.nome} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerList({
  players,
  teamName,
}: {
  players: CopaPontuacaoJogador[];
  teamName: string;
}) {
  const sorted = [...players].sort((a, b) => {
    // coringa last
    if (a.jogador?.eh_coringa && !b.jogador?.eh_coringa) return 1;
    if (!a.jogador?.eh_coringa && b.jogador?.eh_coringa) return -1;
    return 0;
  });

  const total = Math.floor(players.reduce((sum, p) => sum + (p.pontuacao ?? 0), 0));

  return (
    <div>
      <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
        {teamName}
      </h4>
      <ul className="space-y-1">
        {sorted.map((p) => (
          <li
            key={p.id}
            className="flex justify-between text-xs text-muted-foreground"
          >
            <span>
              {p.jogador?.nome}
              {p.jogador?.eh_coringa ? " 🃏" : ""}
              {p.escalou === false ? (
                <span className="text-destructive ml-1">(N/E)</span>
              ) : null}
            </span>
            <span className="font-mono">
              {p.pontuacao != null ? formatarPontuacao(p.pontuacao) : "-"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-xs font-bold text-foreground mt-2 pt-1 border-t border-border">
        <span>Total</span>
        <span className="font-mono">{total}</span>
      </div>
    </div>
  );
}
