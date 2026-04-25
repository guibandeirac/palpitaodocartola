import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Artilheiro } from "@/hooks/useArtilheiros";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtilheirosTableProps {
  artilheiros: Artilheiro[];
  isLoading: boolean;
}

export function ArtilheirosTable({
  artilheiros,
  isLoading,
}: ArtilheirosTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Artilheiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getMedalha = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Artilheiros
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="overflow-x-auto px-2 sm:px-6 pb-4 sm:pb-6">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8 sm:w-12 text-center px-1 sm:px-4 text-[10px] sm:text-sm">#</TableHead>
                  <TableHead className="px-1 sm:px-4 text-xs sm:text-sm">Jogador</TableHead>
                  <TableHead className="text-center px-1 sm:px-4 text-xs sm:text-sm">V</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artilheiros.map((artilheiro, index) => {
                  const medalha = getMedalha(index);
                  return (
                    <TableRow
                      key={artilheiro.jogador_id}
                      className={cn(
                        "border-border transition-colors duration-150",
                        index < 3 && "bg-primary/10 hover:bg-primary/15",
                        index % 2 === 1 && index >= 3 && "bg-secondary/20",
                        index >= 3 && "hover:bg-secondary/40"
                      )}
                    >
                      <TableCell className="text-center font-medium px-1 sm:px-4 py-2 sm:py-4">
                        <span className={cn(
                          "inline-flex items-center justify-center gap-1 text-xs sm:text-sm",
                          index < 3 && "font-bold"
                        )}>
                          {medalha && <span>{medalha}</span>}
                          {!medalha && (
                            <span className="text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="px-1 sm:px-4 py-2 sm:py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs sm:text-sm break-words">{artilheiro.jogador_nome}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">{artilheiro.equipe_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary px-1 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm">
                        {artilheiro.vitorias}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {artilheiros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum artilheiro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
