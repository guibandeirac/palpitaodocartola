import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CopaClassificacaoRow } from "@/hooks/useCopaClassificacao";
import { TeamLogo } from "@/components/TeamLogo";

const formatInt = (v: number) => String(Math.floor(v));

function positionStyle(pos: number) {
  if (pos <= 2) return "border-l-2 border-l-blue-500 bg-blue-500/10";
  if (pos <= 5) return "border-l-2 border-l-blue-400/60 bg-blue-400/5";
  if (pos <= 7) return "border-l-2 border-l-orange-400 bg-orange-400/5";
  return "";
}

function positionBadge(pos: number) {
  if (pos <= 2) return <span className="text-[10px] text-blue-400 font-semibold ml-1">↑ Semi</span>;
  if (pos <= 5) return <span className="text-[10px] text-blue-300 font-semibold ml-1">↑ Quartas</span>;
  if (pos <= 7) return <span className="text-[10px] text-orange-400 font-semibold ml-1">↑ Repesc.</span>;
  return null;
}

interface Props {
  classificacao: CopaClassificacaoRow[];
  isLoading: boolean;
}

export function CopaClassificacaoTable({ classificacao, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Classificação</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400">📊 Classificação - Fase de Grupos</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead className="text-center w-10">P</TableHead>
              <TableHead className="text-center w-10">J</TableHead>
              <TableHead className="text-center w-10">V</TableHead>
              <TableHead className="text-center w-10">E</TableHead>
              <TableHead className="text-center w-10">D</TableHead>
              <TableHead className="text-center w-14">PP</TableHead>
              <TableHead className="text-center w-14">PC</TableHead>
              <TableHead className="text-center w-14">SP</TableHead>
              <TableHead className="text-center w-14">Aprov.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classificacao.map((row, idx) => {
              const pos = idx + 1;
              return (
                <TableRow key={row.id} className={positionStyle(pos)}>
                  <TableCell className="text-center font-bold text-xs">
                    {pos}
                    {positionBadge(pos)}
                  </TableCell>
                  <TableCell className="font-medium text-sm whitespace-normal break-words max-w-[120px]">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo logoUrl={row.equipe?.logo_url} nome={row.equipe?.nome || ""} />
                      {row.equipe?.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold">{row.pontos ?? 0}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.jogos ?? 0}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.vitorias ?? 0}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.empates ?? 0}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.derrotas ?? 0}</TableCell>
                  <TableCell className="text-center text-muted-foreground font-mono text-xs">
                    {formatInt(Number(row.pontos_pro ?? 0))}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground font-mono text-xs">
                    {formatInt(Number(row.pontos_contra ?? 0))}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {formatInt(Number(row.saldo_pontos ?? 0))}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {Math.round(Number(row.aproveitamento ?? 0))}%
                  </TableCell>
                </TableRow>
              );
            })}
            {classificacao.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nenhum dado de classificação disponível
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
