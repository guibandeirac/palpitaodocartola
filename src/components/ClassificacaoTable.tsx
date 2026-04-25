import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassificacaoEquipe } from "@/hooks/useClassificacao";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/TeamLogo";

interface ClassificacaoTableProps {
  classificacao: ClassificacaoEquipe[];
  isLoading: boolean;
}

export function ClassificacaoTable({
  classificacao,
  isLoading,
}: ClassificacaoTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Classificação
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
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-primary" />
          Classificação
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-8 sm:w-12 text-center px-1 sm:px-4 text-[10px] sm:text-sm">#</TableHead>
                <TableHead className="px-1 sm:px-4 text-xs sm:text-sm">Equipe</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">P</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">V</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">E</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">D</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">GF</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">GC</TableHead>
                <TableHead className="w-8 sm:w-auto text-center px-1 sm:px-4 text-[10px] sm:text-sm">SG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificacao.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "border-border transition-colors duration-150",
                    index < 2 && "bg-green-500/15 border-l-4 border-l-green-500 font-semibold",
                    index >= 2 && index % 2 === 1 && "bg-secondary/20",
                    index >= 2 && "hover:bg-secondary/40"
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <div className="flex items-center gap-1.5">
                        <TeamLogo logoUrl={item.equipe?.logo_url} nome={item.equipe?.nome || ""} />
                        <span className="text-xs sm:text-sm break-words">
                          {item.equipe?.nome || "Equipe desconhecida"}
                          <span className="hidden sm:inline"> {index === 0 && "👑"}</span>
                        </span>
                      </div>
                      {index < 2 && (
                        <span className="text-[9px] sm:text-xs bg-green-500/30 text-green-400 px-1 sm:px-2 py-0.5 rounded-full font-semibold w-fit whitespace-nowrap">
                          ↑ Série A
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">
                    {item.pontos ?? 0}
                  </TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">{item.vitorias ?? 0}</TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">{item.empates ?? 0}</TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">{item.derrotas ?? 0}</TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">{item.gf ?? 0}</TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">{item.gc ?? 0}</TableCell>
                  <TableCell className="text-center px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">
                    <span className={cn(
                      "font-semibold",
                      (item.saldo_confrontos ?? 0) > 0 && "text-primary",
                      (item.saldo_confrontos ?? 0) < 0 && "text-destructive",
                      (item.saldo_confrontos ?? 0) === 0 && "text-muted-foreground"
                    )}>
                      {(item.saldo_confrontos ?? 0) > 0 ? "+" : ""}
                      {item.saldo_confrontos ?? 0}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {classificacao.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma classificação encontrada
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
