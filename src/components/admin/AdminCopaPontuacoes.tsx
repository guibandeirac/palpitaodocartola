import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { supabase } from "@/integrations/supabase/client";
import { recalcularCopaClassificacao } from "@/lib/copaClassificacao";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle, Info, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

async function fetchCartola(url: string) {
  const { data, error } = await supabase.functions.invoke("proxy-cartola", {
    body: { url },
  });
  if (error) throw error;
  return data;
}

export function AdminCopaPontuacoes() {
  const { data: rodadas = [] } = useCopaRodadas();
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  const handleBuscarPontuacoes = async () => {
    if (!selectedRodada) {
      toast({ title: "Erro", description: "Selecione uma rodada", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLogs([]);

    try {
      const rodada = rodadas.find((r) => r.id === selectedRodada);
      if (!rodada) throw new Error("Rodada não encontrada");

      const rodadaCartola = rodada.rodada_cartola;
      addLog("info", `Copa Rodada ${rodada.numero} (Cartola ${rodadaCartola}, Fase: ${rodada.fase})`);

      // 1. Buscar confrontos da rodada
      const { data: confrontos, error: confError } = await supabase
        .from("copa_confrontos")
        .select(`
          id, equipe1_id, equipe2_id,
          equipe1:equipes!copa_confrontos_equipe1_id_fkey(id, nome),
          equipe2:equipes!copa_confrontos_equipe2_id_fkey(id, nome)
        `)
        .eq("rodada_id", selectedRodada);

      if (confError) throw confError;
      addLog("info", `${confrontos?.length || 0} confrontos encontrados`);

      // 2. Collect all equipe IDs
      const equipeIds = new Set<string>();
      confrontos?.forEach((c) => {
        if (c.equipe1_id) equipeIds.add(c.equipe1_id);
        if (c.equipe2_id) equipeIds.add(c.equipe2_id);
      });

      // 3. Fetch all jogadores and filter by rodada validity
      const { data: allJogadores, error: jogError } = await supabase
        .from("jogadores")
        .select("id, nome, id_cartola, eh_coringa, equipe_id, rodada_entrada, rodada_saida")
        .in("equipe_id", Array.from(equipeIds));

      if (jogError) throw jogError;

      // Filter jogadores valid for this rodada_cartola
      const jogadores = (allJogadores || []).filter((j) => {
        const entrada = j.rodada_entrada ?? 1;
        const saida = j.rodada_saida;
        return entrada <= rodadaCartola && (saida == null || saida >= rodadaCartola);
      });

      addLog("info", `${jogadores.length} jogadores válidos (de ${allJogadores?.length || 0} total)`);

      // 4. Fetch pontuações via proxy - ALL 7 players per team contribute
      const pontuacoes = new Map<string, { pontuacao: number; escalou: boolean }>();

      for (let i = 0; i < (jogadores || []).length; i++) {
        const j = jogadores![i];
        addLog("info", `Buscando ${i + 1}/${jogadores!.length}: ${j.nome}...`);

        try {
          const data = await fetchCartola(
            `https://api.cartola.globo.com/time/id/${j.id_cartola}/${rodadaCartola}`
          );
          const pontos = Math.round((data.pontos || 0) * 100) / 100;
          const rodadaTimeId = data.time?.rodada_time_id || 0;
          const escalou = rodadaTimeId >= rodadaCartola;

          pontuacoes.set(j.id, { pontuacao: pontos, escalou });
          addLog("success", `${j.nome}: ${pontos} pts ${escalou ? "✓" : "(não escalou)"}`);
        } catch (err) {
          addLog("error", `Erro ao buscar ${j.nome}: ${err}`);
          pontuacoes.set(j.id, { pontuacao: 0, escalou: false });
        }

        await new Promise((r) => setTimeout(r, 300));
      }

      // 5. Delete existing and insert new pontuacoes
      addLog("info", "Salvando pontuações...");
      await supabase.from("copa_pontuacoes").delete().eq("rodada_id", selectedRodada);

      const inserts = (jogadores || []).map((j) => ({
        jogador_id: j.id,
        equipe_id: j.equipe_id,
        rodada_id: selectedRodada,
        pontuacao: pontuacoes.get(j.id)?.pontuacao ?? 0,
        escalou: pontuacoes.get(j.id)?.escalou ?? false,
      }));

      if (inserts.length > 0) {
        const { error: insError } = await supabase.from("copa_pontuacoes").insert(inserts);
        if (insError) addLog("error", `Erro ao inserir: ${insError.message}`);
        else addLog("success", `${inserts.length} pontuações salvas`);
      }

      // 6. Calculate confronto totals - ALL 7 players sum (including 0s)
      addLog("info", "Calculando totais dos confrontos...");
      for (const confronto of confrontos || []) {
        const jogE1 = (jogadores || []).filter((j) => j.equipe_id === confronto.equipe1_id);
        const jogE2 = (jogadores || []).filter((j) => j.equipe_id === confronto.equipe2_id);

        const totalE1 = Math.floor(
          jogE1.reduce((sum, j) => sum + (pontuacoes.get(j.id)?.pontuacao ?? 0), 0)
        );
        const totalE2 = Math.floor(
          jogE2.reduce((sum, j) => sum + (pontuacoes.get(j.id)?.pontuacao ?? 0), 0)
        );

        let resultado: string | null = null;
        if (totalE1 > totalE2) resultado = "equipe1";
        else if (totalE2 > totalE1) resultado = "equipe2";
        else resultado = "empate";

        const e1Nome = (confronto.equipe1 as any)?.nome || "?";
        const e2Nome = (confronto.equipe2 as any)?.nome || "?";
        addLog("info", `${e1Nome}: ${totalE1} vs ${e2Nome}: ${totalE2} → ${resultado}`);

        await supabase
          .from("copa_confrontos")
          .update({ pontuacao_equipe1: totalE1, pontuacao_equipe2: totalE2, resultado })
          .eq("id", confronto.id);
      }

      // 7. Update rodada status
      await supabase
        .from("copa_rodadas")
        .update({ status: "em_andamento", updated_at: new Date().toISOString() })
        .eq("id", selectedRodada);

      addLog("success", "Pontuações da Copa atualizadas com sucesso!");
      toast({ title: "Sucesso", description: "Pontuações da Copa atualizadas!" });
      queryClient.invalidateQueries({ queryKey: ["copa_confrontos"] });
      queryClient.invalidateQueries({ queryKey: ["copa_pontuacoes"] });
      queryClient.invalidateQueries({ queryKey: ["copa_classificacao"] });
    } catch (error) {
      addLog("error", `Erro: ${error}`);
      toast({ title: "Erro", description: `${error}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizarRodada = async () => {
    if (!selectedRodada) {
      toast({ title: "Erro", description: "Selecione uma rodada", variant: "destructive" });
      return;
    }

    const rodada = rodadas.find((r) => r.id === selectedRodada);
    if (!rodada) return;

    setIsFinalizing(true);

    try {
      addLog("info", `Finalizando Copa Rodada ${rodada.numero}...`);

      // 1. Update rodada status to 'finalizada'
      const { error: statusError } = await supabase
        .from("copa_rodadas")
        .update({ status: "finalizada", updated_at: new Date().toISOString() })
        .eq("id", selectedRodada);

      if (statusError) throw statusError;
      addLog("success", "Status da rodada atualizado para 'finalizada'");

      // 2. Recalculate entire copa_classificacao from scratch
      await recalcularCopaClassificacao(addLog);

      addLog("success", "✓ Rodada finalizada e classificação atualizada!");
      toast({ title: "Sucesso", description: "Rodada finalizada e classificação atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["copa_rodadas"] });
      queryClient.invalidateQueries({ queryKey: ["copa_classificacao"] });
      queryClient.invalidateQueries({ queryKey: ["copa_confrontos"] });
    } catch (error) {
      addLog("error", `Erro ao finalizar: ${error}`);
      toast({ title: "Erro", description: `Erro ao finalizar rodada: ${error}`, variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const rodadaSelecionada = rodadas.find((r) => r.id === selectedRodada);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-400" />
          Buscar Pontuações da Copa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">Rodada</label>
            <Select value={selectedRodada} onValueChange={setSelectedRodada}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Selecione a rodada" />
              </SelectTrigger>
              <SelectContent>
                {rodadas.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Rodada {r.numero} (Cartola {r.rodada_cartola}) - {r.fase} - {r.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleBuscarPontuacoes} disabled={isLoading || !selectedRodada} className="min-w-[180px] bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Buscando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Buscar Pontuações</>
            )}
          </Button>

          <Button
            onClick={handleFinalizarRodada}
            disabled={isFinalizing || !selectedRodada || rodadaSelecionada?.status === "finalizada"}
            variant="outline"
            className="min-w-[180px]"
          >
            {isFinalizing ? (
              <><Flag className="h-4 w-4 mr-2 animate-pulse" />Finalizando...</>
            ) : (
              <><Flag className="h-4 w-4 mr-2" />Finalizar Rodada</>
            )}
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Log de Execução</h3>
              <Badge variant="outline">{logs.length} entradas</Badge>
            </div>
            <ScrollArea className="h-80 rounded-md border border-border bg-secondary/30 p-4">
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2 text-sm p-2 rounded",
                      log.type === "error" && "bg-destructive/10",
                      log.type === "success" && "bg-blue-500/10",
                      log.type === "warning" && "bg-yellow-500/10"
                    )}
                  >
                    {getLogIcon(log.type)}
                    <span className="flex-1">{log.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
