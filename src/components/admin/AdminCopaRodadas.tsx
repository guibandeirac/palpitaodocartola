import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { supabase } from "@/integrations/supabase/client";
import { recalcularCopaClassificacao } from "@/lib/copaClassificacao";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

export function AdminCopaRodadas() {
  const { data: rodadas = [], isLoading } = useCopaRodadas();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAlterarStatus = async (rodadaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from("copa_rodadas")
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq("id", rodadaId);

      if (error) throw error;

      // O status da rodada é o que define quais confrontos entram na
      // classificação — sem recalcular aqui, a tabela congela na última vez
      // que o "Finalizar Rodada" foi usado.
      await recalcularCopaClassificacao();

      toast({ title: "Sucesso", description: "Status atualizado e classificação recalculada!" });
      queryClient.invalidateQueries({ queryKey: ["copa_rodadas"] });
      queryClient.invalidateQueries({ queryKey: ["copa_classificacao"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || String(error), variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "em_andamento":
        return <Badge className="bg-yellow-600">Em Andamento</Badge>;
      case "finalizada":
        return <Badge className="bg-blue-600">Finalizada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-400" />
          Rodadas da Copa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Rodada</TableHead>
              <TableHead>Cartola</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rodadas.map((rodada) => (
              <TableRow key={rodada.id} className="border-border">
                <TableCell className="font-medium">Rodada {rodada.numero}</TableCell>
                <TableCell>{rodada.rodada_cartola}</TableCell>
                <TableCell className="text-muted-foreground">
                  {rodada.fase}{rodada.fase_detalhe ? ` - ${rodada.fase_detalhe}` : ""}
                </TableCell>
                <TableCell>{getStatusBadge(rodada.status)}</TableCell>
                <TableCell>
                  <Select
                    value={rodada.status}
                    onValueChange={(value) => handleAlterarStatus(rodada.id, value)}
                  >
                    <SelectTrigger className="w-40 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {rodadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma rodada cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
