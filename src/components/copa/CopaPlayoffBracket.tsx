import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const formatInt = (v: number) => String(Math.floor(v));
import type { CopaPlayoff } from "@/hooks/useCopaPlayoffs";
import { Trophy } from "lucide-react";

interface Props {
  playoffs: CopaPlayoff[];
  isLoading: boolean;
}

function getByFaseChave(playoffs: CopaPlayoff[], fase: string, chave?: string): CopaPlayoff | undefined {
  return playoffs.find(p => p.fase === fase && (!chave || p.chave === chave));
}

function MatchCard({ match, label, singleLeg }: { match?: CopaPlayoff; label: string; singleLeg?: boolean }) {
  if (!match) {
    return (
      <div className="border border-border/40 rounded-lg p-3 bg-card/50 min-w-[200px]">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
        <div className="text-xs text-muted-foreground italic">A definir</div>
      </div>
    );
  }

  const e1 = match.equipe1?.nome || "A definir";
  const e2 = match.equipe2?.nome || "A definir";
  const isE1Winner = match.vencedor_id && match.vencedor_id === match.equipe1_id;
  const isE2Winner = match.vencedor_id && match.vencedor_id === match.equipe2_id;

  return (
    <div className="border border-blue-500/20 rounded-lg p-3 bg-card min-w-[200px] hover:border-blue-500/40 transition-colors">
      <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-2 font-semibold">{label}</div>

      {/* Team 1 */}
      <div className={cn(
        "flex items-center justify-between py-1.5 text-sm",
        isE1Winner && "text-blue-400 font-bold"
      )}>
        <span className="truncate flex-1">{e1}</span>
        {match.equipe1_id && (
          <span className="flex items-center gap-2 tabular-nums text-xs">
            {!singleLeg && (
              <>
                <span className="text-muted-foreground">
                {match.pontuacao_equipe1_ida != null ? formatInt(match.pontuacao_equipe1_ida) : "-"}
                </span>
                <span className="text-muted-foreground">
                  {match.pontuacao_equipe1_volta != null ? formatInt(match.pontuacao_equipe1_volta) : "-"}
                </span>
              </>
            )}
            {singleLeg && (
              <span className="text-muted-foreground">
                {match.pontuacao_equipe1_ida != null ? formatInt(match.pontuacao_equipe1_ida) : "-"}
              </span>
            )}
            <span className={cn("font-bold min-w-[40px] text-right", isE1Winner ? "text-blue-400" : "text-foreground")}>
              {match.pontuacao_equipe1_total != null ? formatInt(match.pontuacao_equipe1_total) : "-"}
            </span>
          </span>
        )}
      </div>

      <div className="border-t border-border/30 my-0.5" />

      {/* Team 2 */}
      <div className={cn(
        "flex items-center justify-between py-1.5 text-sm",
        isE2Winner && "text-blue-400 font-bold"
      )}>
        <span className="truncate flex-1">{e2}</span>
        {match.equipe2_id && (
          <span className="flex items-center gap-2 tabular-nums text-xs">
            {!singleLeg && (
              <>
                <span className="text-muted-foreground">
                {match.pontuacao_equipe2_ida != null ? formatInt(match.pontuacao_equipe2_ida) : "-"}
                </span>
                <span className="text-muted-foreground">
                  {match.pontuacao_equipe2_volta != null ? formatInt(match.pontuacao_equipe2_volta) : "-"}
                </span>
              </>
            )}
            {singleLeg && (
              <span className="text-muted-foreground">
                {match.pontuacao_equipe2_ida != null ? formatInt(match.pontuacao_equipe2_ida) : "-"}
              </span>
            )}
            <span className={cn("font-bold min-w-[40px] text-right", isE2Winner ? "text-blue-400" : "text-foreground")}>
              {match.pontuacao_equipe2_total != null ? formatInt(match.pontuacao_equipe2_total) : "-"}
            </span>
          </span>
        )}
      </div>

      {!singleLeg && match.equipe1_id && (
        <div className="text-[9px] text-muted-foreground mt-1 text-right">
          Ida · Volta · Agregado
        </div>
      )}

      {match.vencedor && (
        <div className="text-[10px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          {match.vencedor.nome}
        </div>
      )}
    </div>
  );
}

export function CopaPlayoffBracket({ playoffs, isLoading }: Props) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Playoffs</h2>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (playoffs.length === 0) return null;

  const repescagem = getByFaseChave(playoffs, "repescagem");
  const quartas1 = getByFaseChave(playoffs, "quartas", "A");
  const quartas2 = getByFaseChave(playoffs, "quartas", "B");
  const semi1 = getByFaseChave(playoffs, "semifinal", "A");
  const semi2 = getByFaseChave(playoffs, "semifinal", "B");
  const final_ = getByFaseChave(playoffs, "final");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-blue-400 flex items-center gap-2">
        <Trophy className="h-5 w-5" />
        Playoffs
      </h2>

      {/* Desktop bracket - horizontal */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="flex items-center gap-6 min-w-[900px] pb-4">
          {/* Column 1: Repescagem */}
          <div className="flex flex-col gap-4 w-[220px] flex-shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-1">
              Repescagem
            </div>
            <MatchCard match={repescagem} label="6º × 7º" singleLeg />
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center justify-center self-stretch">
            <div className="w-8 border-t border-blue-500/30" />
          </div>

          {/* Column 2: Quartas */}
          <div className="flex flex-col gap-4 w-[220px] flex-shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-1">
              Quartas de Final
            </div>
            <MatchCard match={quartas1} label="Quartas A — 3º × Rep." />
            <MatchCard match={quartas2} label="Quartas B — 4º × 5º" />
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center justify-center self-stretch">
            <div className="w-8 border-t border-blue-500/30" />
          </div>

          {/* Column 3: Semifinal */}
          <div className="flex flex-col gap-4 w-[220px] flex-shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-1">
              Semifinal
            </div>
            <MatchCard match={semi1} label="Semi A — 1º × Quartas B" />
            <MatchCard match={semi2} label="Semi B — 2º × Quartas A" />
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center justify-center self-stretch">
            <div className="w-8 border-t border-blue-500/30" />
          </div>

          {/* Column 4: Final */}
          <div className="flex flex-col gap-4 w-[220px] flex-shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-1">
              Final
            </div>
            <MatchCard match={final_} label="🏆 Final" singleLeg />
          </div>
        </div>
      </div>

      {/* Mobile bracket - stacked */}
      <div className="lg:hidden space-y-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Repescagem</div>
          <MatchCard match={repescagem} label="6º × 7º" singleLeg />
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quartas de Final</div>
          <div className="space-y-3">
            <MatchCard match={quartas1} label="Quartas A — 3º × Rep." />
            <MatchCard match={quartas2} label="Quartas B — 4º × 5º" />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Semifinal</div>
          <div className="space-y-3">
            <MatchCard match={semi1} label="Semi A — 1º × Quartas B" />
            <MatchCard match={semi2} label="Semi B — 2º × Quartas A" />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Final</div>
          <MatchCard match={final_} label="🏆 Final" singleLeg />
        </div>
      </div>
    </div>
  );
}
