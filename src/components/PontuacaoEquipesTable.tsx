import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PontuacaoEquipe } from "@/hooks/usePontuacaoEquipes";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";

interface PontuacaoEquipesTableProps {
  pontuacoes: PontuacaoEquipe[];
  isLoading: boolean;
}

export function PontuacaoEquipesTable({ pontuacoes, isLoading }: PontuacaoEquipesTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Pontuação Total das Equipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Pontuação Total das Equipes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-8 sm:w-12 text-center px-1 sm:px-4 text-[10px] sm:text-sm">#</TableHead>
                <TableHead className="px-1 sm:px-4 text-xs sm:text-sm">Equipe</TableHead>
                <TableHead className="text-center px-1 sm:px-4 text-[10px] sm:text-sm">Total</TableHead>
                <TableHead className="text-center px-1 sm:px-4 text-[10px] sm:text-sm hidden sm:table-cell">Rodadas</TableHead>
                <TableHead className="text-center px-1 sm:px-4 text-[10px] sm:text-sm">Média</TableHead>
                <TableHead className="text-center px-1 sm:px-4 text-[10px] sm:text-sm">
                  <span className="hidden sm:inline">Última Rod.</span>
                  <span className="sm:hidden">Últ.</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pontuacoes.map((item, index) => (
                <TableRow
                  key={item.equipe_id}
                  className={cn(
                    "border-border transition-colors duration-150",
                    index % 2 === 1 && "bg-secondary/20",
                    "hover:bg-secondary/40"
                  )}
                >
                  <TableCell className="text-center font-medium px-1 sm:px-4 py-2 sm:py-4">
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm",
                      index === 0 && "bg-yellow-500/30 text-yellow-500 font-bold",
                      index === 1 && "bg-gray-400/30 text-gray-400 font-bold",
                      index === 2 && "bg-amber-600/30 text-amber-600 font-bold",
                      index > 2 && "text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium px-1 sm:px-4 py-2 sm:py-4">
                    <span className="text-xs sm:text-sm break-words">{item.equipe_nome}</span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm tabular-nums">
                    {formatarPontuacao(item.pontuacao_total)}
                  </TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">
                    {item.rodadas_jogadas}
                  </TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm tabular-nums text-muted-foreground">
                    {formatarPontuacao(item.media_por_rodada)}
                  </TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm tabular-nums text-muted-foreground">
                    {formatarPontuacao(item.pontuacao_ultima_rodada)}
                  </TableCell>
                </TableRow>
              ))}
              {pontuacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma rodada finalizada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
