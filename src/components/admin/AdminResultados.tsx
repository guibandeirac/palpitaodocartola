import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRodadas } from "@/hooks/useRodadas";
import { useConfrontosRodada } from "@/hooks/useConfrontosRodada";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, Calculator, RefreshCw, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { arredondar2Decimais, formatarPontuacao } from "@/lib/pontuacao";

interface LogEntry {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

interface EditingConfronto {
  id: string;
  pontuacao_jogador1: number;
  pontuacao_jogador2: number;
  vencedor: string | null;
}

export function AdminResultados() {
  const { data: rodadas = [] } = useRodadas();
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const { data: confrontos = [] } = useConfrontosRodada(selectedRodada);
  const [editing, setEditing] = useState<Map<string, EditingConfronto>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRecalcDialog, setShowRecalcDialog] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  const handleStartEdit = (confrontoId: string, pontos1: number, pontos2: number, vencedor: string | null) => {
    setEditing((prev) => {
      const newMap = new Map(prev);
      newMap.set(confrontoId, {
        id: confrontoId,
        pontuacao_jogador1: pontos1,
        pontuacao_jogador2: pontos2,
        vencedor,
      });
      return newMap;
    });
  };

  const handleCancelEdit = (confrontoId: string) => {
    setEditing((prev) => {
      const newMap = new Map(prev);
      newMap.delete(confrontoId);
      return newMap;
    });
  };

  const handleInputChange = (confrontoId: string, field: "pontuacao_jogador1" | "pontuacao_jogador2", value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditing((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(confrontoId);
      if (current) {
        const updated = { ...current, [field]: numValue };
        // Recalcular vencedor automaticamente
        if (updated.pontuacao_jogador1 > updated.pontuacao_jogador2) {
          updated.vencedor = "jogador1";
        } else if (updated.pontuacao_jogador2 > updated.pontuacao_jogador1) {
          updated.vencedor = "jogador2";
        } else {
          updated.vencedor = null;
        }
        newMap.set(confrontoId, updated);
      }
      return newMap;
    });
  };

  const handleSaveEdit = async (confrontoId: string, confrontoEquipeId: string) => {
    const editData = editing.get(confrontoId);
    if (!editData) return;

    setIsSaving(true);
    try {
      // Atualizar confronto individual
      const { error } = await supabase
        .from("confrontos_individuais")
        .update({
          pontuacao_jogador1: arredondar2Decimais(editData.pontuacao_jogador1),
          pontuacao_jogador2: arredondar2Decimais(editData.pontuacao_jogador2),
          vencedor: editData.vencedor,
        })
        .eq("id", confrontoId);

      if (error) throw error;

      // Recalcular vitórias do confronto de equipe (comparando pontuações)
      const { data: allIndividuais } = await supabase
        .from("confrontos_individuais")
        .select("pontuacao_jogador1, pontuacao_jogador2")
        .eq("confronto_equipe_id", confrontoEquipeId);

      let vitoriasEquipe1 = 0;
      let vitoriasEquipe2 = 0;

      allIndividuais?.forEach((ci) => {
        const p1 = ci.pontuacao_jogador1 ?? 0;
        const p2 = ci.pontuacao_jogador2 ?? 0;
        if (p1 > p2) vitoriasEquipe1++;
        if (p2 > p1) vitoriasEquipe2++;
      });

      let resultado: "equipe1" | "equipe2" | "empate" = "empate";
      if (vitoriasEquipe1 > vitoriasEquipe2) resultado = "equipe1";
      if (vitoriasEquipe2 > vitoriasEquipe1) resultado = "equipe2";

      await supabase
        .from("confrontos_equipe")
        .update({
          vitorias_equipe1: vitoriasEquipe1,
          vitorias_equipe2: vitoriasEquipe2,
          resultado,
        })
        .eq("id", confrontoEquipeId);

      toast({ title: "Salvo!", description: "Resultado atualizado com sucesso." });
      handleCancelEdit(confrontoId);
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
    } catch (error) {
      toast({ title: "Erro", description: `${error}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalcularClassificacao = async () => {
    setShowRecalcDialog(false);
    setIsRecalculating(true);
    setLogs([]);

    try {
      addLog("info", "Iniciando recálculo completo da classificação...");

      // 1. Buscar rodadas finalizadas da Série B (única com classificação acumulada)
      const { data: rodadasFinalizadas } = await supabase
        .from("rodadas")
        .select("id, numero")
        .eq("status_b", "finalizada");

      addLog("info", `Encontradas ${rodadasFinalizadas?.length || 0} rodadas finalizadas`);

      // 2. Buscar todas as equipes
      const { data: equipes } = await supabase.from("equipes").select("id, nome");

      // 3. Zerar classificação de todas as equipes
      addLog("info", "Zerando classificação atual...");
      for (const equipe of equipes || []) {
        const { data: existente } = await supabase
          .from("classificacao")
          .select("id")
          .eq("equipe_id", equipe.id)
          .maybeSingle();

        if (existente) {
          await supabase
            .from("classificacao")
            .update({
              pontos: 0,
              vitorias: 0,
              empates: 0,
              derrotas: 0,
              saldo_confrontos: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existente.id);
        } else {
          await supabase.from("classificacao").insert({
            equipe_id: equipe.id,
            pontos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            saldo_confrontos: 0,
          });
        }
      }

      // 4. Para cada rodada finalizada, somar os pontos
      for (const rodada of rodadasFinalizadas || []) {
        addLog("info", `Processando Rodada ${rodada.numero}...`);

        const { data: confrontosRodada } = await supabase
          .from("confrontos_equipe")
          .select("*, confrontos_individuais(vencedor)")
          .eq("rodada_id", rodada.id);

        for (const confronto of confrontosRodada || []) {
          const { equipe1_id, equipe2_id, resultado, vitorias_equipe1, vitorias_equipe2 } = confronto;

          // Buscar classificação atual
          const { data: class1 } = await supabase
            .from("classificacao")
            .select("*")
            .eq("equipe_id", equipe1_id)
            .maybeSingle();

          const { data: class2 } = await supabase
            .from("classificacao")
            .select("*")
            .eq("equipe_id", equipe2_id)
            .maybeSingle();

          const saldo1 = (vitorias_equipe1 || 0) - (vitorias_equipe2 || 0);

          if (class1) {
            let pontos = class1.pontos || 0;
            let vitorias = class1.vitorias || 0;
            let empates = class1.empates || 0;
            let derrotas = class1.derrotas || 0;

            if (resultado === "vitoria_equipe1") {
              pontos += 3;
              vitorias += 1;
            } else if (resultado === "vitoria_equipe2") {
              derrotas += 1;
            } else if (resultado === "empate") {
              pontos += 1;
              empates += 1;
            }

            await supabase
              .from("classificacao")
              .update({
                pontos,
                vitorias,
                empates,
                derrotas,
                saldo_confrontos: (class1.saldo_confrontos || 0) + saldo1,
              })
              .eq("id", class1.id);
          }

          if (class2) {
            let pontos = class2.pontos || 0;
            let vitorias = class2.vitorias || 0;
            let empates = class2.empates || 0;
            let derrotas = class2.derrotas || 0;

            if (resultado === "vitoria_equipe2") {
              pontos += 3;
              vitorias += 1;
            } else if (resultado === "vitoria_equipe1") {
              derrotas += 1;
            } else if (resultado === "empate") {
              pontos += 1;
              empates += 1;
            }

            await supabase
              .from("classificacao")
              .update({
                pontos,
                vitorias,
                empates,
                derrotas,
                saldo_confrontos: (class2.saldo_confrontos || 0) - saldo1,
              })
              .eq("id", class2.id);
          }
        }

        addLog("success", `Rodada ${rodada.numero} processada`);
      }

      addLog("success", "Classificação recalculada com sucesso!");
      toast({ title: "Sucesso", description: "Classificação recalculada!" });
      queryClient.invalidateQueries({ queryKey: ["classificacao"] });
    } catch (error) {
      addLog("error", `Erro: ${error}`);
      toast({ title: "Erro", description: `${error}`, variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Editar Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-sm text-muted-foreground">Rodada</label>
              <Select value={selectedRodada} onValueChange={setSelectedRodada}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Selecione a rodada" />
                </SelectTrigger>
                <SelectContent>
                  {rodadas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Rodada {r.numero} - {r.status_b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setShowRecalcDialog(true)}
              disabled={isRecalculating}
              variant="outline"
            >
              {isRecalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recalculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalcular Classificação
                </>
              )}
            </Button>
          </div>

          {selectedRodada && confrontos.length > 0 && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {confrontos.map((confronto) => (
                  <Card key={confronto.id} className="bg-secondary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {confronto.equipe1?.nome} vs {confronto.equipe2?.nome}
                        </CardTitle>
                        <Badge variant="outline">
                          {confronto.vitorias_equipe1 || 0} × {confronto.vitorias_equipe2 || 0}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Jogador 1</TableHead>
                            <TableHead className="text-center w-24">Pts 1</TableHead>
                            <TableHead className="text-center w-24">Pts 2</TableHead>
                            <TableHead>Jogador 2</TableHead>
                            <TableHead className="text-center w-20">Venc.</TableHead>
                            <TableHead className="w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {confronto.confrontos_individuais.map((ci) => {
                            const isEditing = editing.has(ci.id);
                            const editData = editing.get(ci.id);

                            return (
                              <TableRow key={ci.id}>
                                <TableCell className="text-sm">
                                  {ci.jogador1_original?.nome || ci.jogador1_efetivo?.nome || "-"}
                                  {ci.jogador1_efetivo?.eh_coringa && ci.jogador1_original && ci.jogador1_efetivo?.id !== ci.jogador1_original?.id ? " 🃏" : ""}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="w-20 h-8 text-center"
                                      value={editData?.pontuacao_jogador1 ?? ""}
                                      onChange={(e) =>
                                        handleInputChange(ci.id, "pontuacao_jogador1", e.target.value)
                                      }
                                    />
                                  ) : (
                                    <span className={cn(ci.vencedor === "jogador1" && "text-primary font-bold")}>
                                      {formatarPontuacao(ci.pontuacao_jogador1)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="w-20 h-8 text-center"
                                      value={editData?.pontuacao_jogador2 ?? ""}
                                      onChange={(e) =>
                                        handleInputChange(ci.id, "pontuacao_jogador2", e.target.value)
                                      }
                                    />
                                  ) : (
                                    <span className={cn(ci.vencedor === "jogador2" && "text-primary font-bold")}>
                                      {formatarPontuacao(ci.pontuacao_jogador2)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {ci.jogador2_original?.nome || ci.jogador2_efetivo?.nome || "-"}
                                  {ci.jogador2_efetivo?.eh_coringa && ci.jogador2_original && ci.jogador2_efetivo?.id !== ci.jogador2_original?.id ? " 🃏" : ""}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      (isEditing ? editData?.vencedor : ci.vencedor)
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {(isEditing ? editData?.vencedor : ci.vencedor) === "jogador1"
                                      ? "J1"
                                      : (isEditing ? editData?.vencedor : ci.vencedor) === "jogador2"
                                      ? "J2"
                                      : "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleSaveEdit(ci.id, confronto.id)}
                                        disabled={isSaving}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleCancelEdit(ci.id)}
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() =>
                                        handleStartEdit(
                                          ci.id,
                                          ci.pontuacao_jogador1 ?? 0,
                                          ci.pontuacao_jogador2 ?? 0,
                                          ci.vencedor
                                        )
                                      }
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-1">
                    {getLogIcon(log.type)}
                    <span className="flex-1">{log.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação */}
      <AlertDialog open={showRecalcDialog} onOpenChange={setShowRecalcDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular Classificação</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá zerar a classificação atual e recalculá-la somando todas as rodadas
              finalizadas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalcularClassificacao}>
              Recalcular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
