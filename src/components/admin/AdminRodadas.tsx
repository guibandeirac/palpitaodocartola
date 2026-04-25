import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRodadas } from "@/hooks/useRodadas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";
import { recalcularClassificacao, serieTemClassificacao, Serie } from "@/lib/classificacao";

interface AdminRodadasProps {
  serie: Serie;
}

export function AdminRodadas({ serie }: AdminRodadasProps) {
  const { data: rodadas = [] } = useRodadas();
  const [novaRodadaNumero, setNovaRodadaNumero] = useState("");
  const [novaRodadaCartola, setNovaRodadaCartola] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const temClassificacao = serieTemClassificacao(serie);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCriarRodada = async () => {
    if (!novaRodadaNumero || !novaRodadaCartola) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("rodadas").insert({
        numero: parseInt(novaRodadaNumero),
        rodada_cartola: parseInt(novaRodadaCartola),
        status: "pendente",
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Rodada criada com sucesso!" });
      setNovaRodadaNumero("");
      setNovaRodadaCartola("");
      queryClient.invalidateQueries({ queryKey: ["rodadas"] });
    } catch (error: any) {
      toast({
        title: "Erro ao criar rodada",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAlterarStatus = async (rodadaId: string, novoStatus: string) => {
    if (novoStatus === "finalizada") {
      setIsFinalizando(true);
      try {
        const { error } = await supabase
          .from("rodadas")
          .update({ status: "finalizada" })
          .eq("id", rodadaId);
        if (error) throw error;

        if (temClassificacao) {
          await recalcularClassificacao(serie);
        }

        toast({
          title: "Sucesso",
          description: temClassificacao
            ? `Rodada finalizada e classificação da Série ${serie} atualizada!`
            : `Rodada finalizada (Série ${serie} não usa classificação).`,
        });

        queryClient.invalidateQueries({ queryKey: ["rodadas"] });
        if (temClassificacao) {
          queryClient.invalidateQueries({ queryKey: ["classificacao"] });
          queryClient.invalidateQueries({ queryKey: ["pontuacao-equipes"] });
        }
      } catch (error: any) {
        toast({
          title: "Erro ao finalizar rodada",
          description: error?.message || String(error),
          variant: "destructive",
        });
      } finally {
        setIsFinalizando(false);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from("rodadas")
        .update({ status: novoStatus })
        .eq("id", rodadaId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Status atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["rodadas"] });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error?.message || String(error),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "em_andamento":
        return <Badge className="bg-yellow-600">Em Andamento</Badge>;
      case "finalizada":
        return <Badge className="bg-primary">Finalizada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Rodadas — Série {serie}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {temClassificacao
            ? `Rodadas são compartilhadas com a outra série. Ao finalizar, a classificação da Série ${serie} é recalculada automaticamente.`
            : `Rodadas são compartilhadas com a outra série. A Série ${serie} é somente ao vivo — sem classificação acumulada.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Criar nova rodada */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">Número da Rodada</label>
            <Input
              type="number"
              placeholder="Ex: 1"
              value={novaRodadaNumero}
              onChange={(e) => setNovaRodadaNumero(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">Rodada Cartola</label>
            <Input
              type="number"
              placeholder="Ex: 15"
              value={novaRodadaCartola}
              onChange={(e) => setNovaRodadaCartola(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <Button onClick={handleCriarRodada} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Rodada
          </Button>
        </div>

        {/* Lista de rodadas */}
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Rodada</TableHead>
              <TableHead>Cartola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rodadas.map((rodada) => (
              <TableRow key={rodada.id} className="border-border">
                <TableCell className="font-medium">Rodada {rodada.numero}</TableCell>
                <TableCell>{rodada.rodada_cartola}</TableCell>
                <TableCell>{getStatusBadge(rodada.status)}</TableCell>
                <TableCell>
                  <Select
                    value={rodada.status || "pendente"}
                    onValueChange={(value) => handleAlterarStatus(rodada.id, value)}
                    disabled={isFinalizando}
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
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma rodada criada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
