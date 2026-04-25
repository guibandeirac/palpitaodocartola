import { useMemo, useState } from "react";
import { useEquipes } from "@/hooks/useEquipes";
import { recalcularClassificacao, serieTemClassificacao, Serie } from "@/lib/classificacao";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useRodadas } from "@/hooks/useRodadas";
import { useConfrontosRodada } from "@/hooks/useConfrontosRodada";
import { useJogadoresByEquipe } from "@/hooks/useJogadores";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { List, Pencil, Trash2, Calculator, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatarPontuacao, arredondar2Decimais } from "@/lib/pontuacao";

interface LogEntry {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

interface AdminConfrontosListaProps {
  serie: Serie;
}

export function AdminConfrontosLista({ serie }: AdminConfrontosListaProps) {
  const { data: rodadas = [] } = useRodadas();
  const { data: equipesSerie = [] } = useEquipes(serie);
  const temClassificacao = serieTemClassificacao(serie);
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const { data: confrontosTodos = [] } = useConfrontosRodada(selectedRodada);
  const equipeIdsSerie = useMemo(
    () => new Set(equipesSerie.map((e) => e.id)),
    [equipesSerie]
  );
  const confrontos = useMemo(
    () =>
      confrontosTodos.filter(
        (c) => equipeIdsSerie.has(c.equipe1.id) && equipeIdsSerie.has(c.equipe2.id)
      ),
    [confrontosTodos, equipeIdsSerie]
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Recalcular classificação state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRecalcDialog, setShowRecalcDialog] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  // Estado para edição (modal unificado)
  const [editingIndividual, setEditingIndividual] = useState<{
    id: string;
    confrontoEquipeId: string;
    equipe1Id: string;
    equipe2Id: string;
    jogador1OriginalId: string;
    jogador2OriginalId: string;
    jogador1EfetivoId: string;
    jogador2EfetivoId: string;
    pontuacaoJogador1: number;
    pontuacaoJogador2: number;
  } | null>(null);
  const [newJogador1, setNewJogador1] = useState("");
  const [newJogador2, setNewJogador2] = useState("");
  const [newPontos1, setNewPontos1] = useState<string>("");
  const [newPontos2, setNewPontos2] = useState<string>("");

  // Estado para exclusão
  const [deletingEquipe, setDeletingEquipe] = useState<string | null>(null);
  const [deletingIndividual, setDeletingIndividual] = useState<string | null>(null);

  const { data: jogadoresEquipe1 = [] } = useJogadoresByEquipe(
    editingIndividual?.equipe1Id || null
  );
  const { data: jogadoresEquipe2 = [] } = useJogadoresByEquipe(
    editingIndividual?.equipe2Id || null
  );

  const handleRecalcularClassificacao = async () => {
    setShowRecalcDialog(false);
    setIsRecalculating(true);
    setLogs([]);
    try {
      await recalcularClassificacao(serie, {
        onInfo: (m) => addLog("info", m),
        onSuccess: (m) => addLog("success", m),
        onWarning: (m) => addLog("warning", m),
        onError: (m) => addLog("error", m),
      });
      toast({ title: "Sucesso", description: `Classificação da Série ${serie} recalculada!` });
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
      case "success": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // ---- Edição de confronto individual ----
  const handleEditIndividual = async (
    id: string, confrontoEquipeId: string,
    equipe1Id: string, equipe2Id: string,
    jogador1EfetivoId: string, jogador2EfetivoId: string,
    pontuacaoJogador1: number, pontuacaoJogador2: number
  ) => {
    const { data: ci, error } = await supabase
      .from("confrontos_individuais")
      .select("jogador1_original_id, jogador2_original_id")
      .eq("id", id)
      .single();

    if (error || !ci) {
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
      return;
    }

    setEditingIndividual({
      id, confrontoEquipeId, equipe1Id, equipe2Id,
      jogador1OriginalId: ci.jogador1_original_id || jogador1EfetivoId,
      jogador2OriginalId: ci.jogador2_original_id || jogador2EfetivoId,
      jogador1EfetivoId, jogador2EfetivoId,
      pontuacaoJogador1, pontuacaoJogador2,
    });

    setNewJogador1(jogador1EfetivoId);
    setNewJogador2(jogador2EfetivoId);
    setNewPontos1(String(pontuacaoJogador1 ?? 0));
    setNewPontos2(String(pontuacaoJogador2 ?? 0));
  };

  const handleSaveEdit = async () => {
    if (!editingIndividual || !newJogador1 || !newJogador2) return;

    try {
      const jogador1Selecionado = opcoesEquipe1.find((j) => j.id === newJogador1);
      const jogador2Selecionado = opcoesEquipe2.find((j) => j.id === newJogador2);

      const jogador1EhCoringa = !!jogador1Selecionado?.eh_coringa;
      const jogador2EhCoringa = !!jogador2Selecionado?.eh_coringa;

      const pontos1 = arredondar2Decimais(parseFloat(newPontos1) || 0);
      const pontos2 = arredondar2Decimais(parseFloat(newPontos2) || 0);

      let vencedor: "jogador1" | "jogador2" | null = null;
      if (pontos1 > pontos2) vencedor = "jogador1";
      else if (pontos2 > pontos1) vencedor = "jogador2";

      const jogador1OriginalId = jogador1EhCoringa
        ? editingIndividual.jogador1OriginalId : newJogador1;
      const jogador2OriginalId = jogador2EhCoringa
        ? editingIndividual.jogador2OriginalId : newJogador2;

      const { error } = await supabase
        .from("confrontos_individuais")
        .update({
          jogador1_original_id: jogador1OriginalId,
          jogador2_original_id: jogador2OriginalId,
          jogador1_efetivo_id: newJogador1,
          jogador2_efetivo_id: newJogador2,
          pontuacao_jogador1: pontos1,
          pontuacao_jogador2: pontos2,
          vencedor,
        })
        .eq("id", editingIndividual.id);

      if (error) throw error;

      // Recalcular placar do confronto de equipe
      const { data: inds, error: indsError } = await supabase
        .from("confrontos_individuais")
        .select("pontuacao_jogador1, pontuacao_jogador2")
        .eq("confronto_equipe_id", editingIndividual.confrontoEquipeId);

      if (indsError) throw indsError;

      let vitoriasEquipe1 = 0;
      let vitoriasEquipe2 = 0;
      for (const ci of inds || []) {
        const p1 = ci.pontuacao_jogador1 ?? 0;
        const p2 = ci.pontuacao_jogador2 ?? 0;
        if (p1 > p2) vitoriasEquipe1++;
        else if (p2 > p1) vitoriasEquipe2++;
      }

      let resultado: "equipe1" | "equipe2" | "empate" = "empate";
      if (vitoriasEquipe1 > vitoriasEquipe2) resultado = "equipe1";
      else if (vitoriasEquipe2 > vitoriasEquipe1) resultado = "equipe2";

      await supabase
        .from("confrontos_equipe")
        .update({ vitorias_equipe1: vitoriasEquipe1, vitorias_equipe2: vitoriasEquipe2, resultado })
        .eq("id", editingIndividual.confrontoEquipeId);

      toast({ title: "Sucesso", description: "Confronto atualizado e placar recalculado!" });
      setEditingIndividual(null);
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
      queryClient.invalidateQueries({ queryKey: ["classificacao"] });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar confronto", variant: "destructive" });
    }
  };

  // ---- Exclusão ----
  const handleDeleteEquipe = async () => {
    if (!deletingEquipe) return;
    try {
      await supabase.from("confrontos_individuais").delete().eq("confronto_equipe_id", deletingEquipe);
      await supabase.from("confrontos_equipe").delete().eq("id", deletingEquipe);
      toast({ title: "Sucesso", description: "Confronto de equipe excluído!" });
      setDeletingEquipe(null);
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir confronto", variant: "destructive" });
    }
  };

  const handleDeleteIndividual = async () => {
    if (!deletingIndividual) return;
    try {
      await supabase.from("confrontos_individuais").delete().eq("id", deletingIndividual);
      toast({ title: "Sucesso", description: "Confronto individual excluído!" });
      setDeletingIndividual(null);
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir confronto", variant: "destructive" });
    }
  };

  const opcoesEquipe1 = useMemo(() => {
    return [...jogadoresEquipe1].sort((a, b) => {
      const ac = a.eh_coringa ? 1 : 0;
      const bc = b.eh_coringa ? 1 : 0;
      if (ac !== bc) return bc - ac;
      return a.nome.localeCompare(b.nome);
    });
  }, [jogadoresEquipe1]);

  const opcoesEquipe2 = useMemo(() => {
    return [...jogadoresEquipe2].sort((a, b) => {
      const ac = a.eh_coringa ? 1 : 0;
      const bc = b.eh_coringa ? 1 : 0;
      if (ac !== bc) return bc - ac;
      return a.nome.localeCompare(b.nome);
    });
  }, [jogadoresEquipe2]);

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            Confrontos Existentes — Série {serie}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de rodada + Recalcular */}
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-sm text-muted-foreground">Selecione a Rodada</label>
              <Select value={selectedRodada} onValueChange={setSelectedRodada}>
                <SelectTrigger className="w-full max-w-xs bg-secondary">
                  <SelectValue placeholder="Selecione a rodada" />
                </SelectTrigger>
                <SelectContent>
                  {rodadas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Rodada {r.numero} (Cartola {r.rodada_cartola})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {temClassificacao && (
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
            )}
          </div>

          {/* Log de execução */}
          {logs.length > 0 && (
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Log de Execução</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {getLogIcon(log.type)}
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Lista de confrontos */}
          {selectedRodada && confrontos.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhum confronto nesta rodada.
            </p>
          )}

          {confrontos.map((confronto) => (
            <div key={confronto.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {confronto.equipe1?.nome} vs {confronto.equipe2?.nome}
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeletingEquipe(confronto.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir Confronto
                </Button>
              </div>

              <div className="space-y-2">
                {confronto.confrontos_individuais.map((ind) => {
                  const coringa1 = ind.jogador1_efetivo?.eh_coringa && ind.jogador1_original && ind.jogador1_efetivo?.id !== ind.jogador1_original?.id;
                  const coringa2 = ind.jogador2_efetivo?.eh_coringa && ind.jogador2_original && ind.jogador2_efetivo?.id !== ind.jogador2_original?.id;
                  const nome1 = ind.jogador1_original?.nome || ind.jogador1_efetivo?.nome || "?";
                  const nome2 = ind.jogador2_original?.nome || ind.jogador2_efetivo?.nome || "?";
                  return (
                  <div key={ind.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded">
                    <span className="text-sm">
                      {nome1}{coringa1 ? " 🃏" : ""} vs {nome2}{coringa2 ? " 🃏" : ""}{" "}
                      <span className="text-muted-foreground">
                        ({formatarPontuacao(ind.pontuacao_jogador1)} x {formatarPontuacao(ind.pontuacao_jogador2)})
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() =>
                        handleEditIndividual(
                          ind.id, confronto.id,
                          confronto.equipe1?.id || "", confronto.equipe2?.id || "",
                          ind.jogador1_efetivo?.id || "", ind.jogador2_efetivo?.id || "",
                          ind.pontuacao_jogador1 ?? 0, ind.pontuacao_jogador2 ?? 0
                        )
                      }>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingIndividual(ind.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={!!editingIndividual} onOpenChange={() => setEditingIndividual(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Confronto Individual</DialogTitle>
            <DialogDescription>
              Altere os jogadores e pontuações deste confronto individual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Jogador 1 (inclui coringa)</label>
                <Select value={newJogador1} onValueChange={setNewJogador1}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {opcoesEquipe1.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.eh_coringa ? `🃏 ${j.nome}` : j.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Jogador 2 (inclui coringa)</label>
                <Select value={newJogador2} onValueChange={setNewJogador2}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {opcoesEquipe2.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.eh_coringa ? `🃏 ${j.nome}` : j.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Pontuação Jogador 1</label>
                <Input type="number" inputMode="decimal" step="0.01" value={newPontos1} onChange={(e) => setNewPontos1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Pontuação Jogador 2</label>
                <Input type="number" inputMode="decimal" step="0.01" value={newPontos2} onChange={(e) => setNewPontos2(e.target.value)} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Ao salvar, o vencedor é calculado automaticamente e o placar do confronto de equipe será recalculado.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIndividual(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog recalcular */}
      <AlertDialog open={showRecalcDialog} onOpenChange={setShowRecalcDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular Classificação da Série {serie}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai zerar a classificação da Série {serie} e recalcular do zero com base nos confrontos das rodadas finalizadas.
              A outra série não é afetada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalcularClassificacao}>Recalcular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog excluir equipe */}
      <AlertDialog open={!!deletingEquipe} onOpenChange={() => setDeletingEquipe(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Confronto de Equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá também todos os confrontos individuais associados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEquipe} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog excluir individual */}
      <AlertDialog open={!!deletingIndividual} onOpenChange={() => setDeletingIndividual(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Confronto Individual?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIndividual} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
