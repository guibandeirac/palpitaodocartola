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
import { useRodadas } from "@/hooks/useRodadas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, Flag, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  recalcularClassificacao as recalcularClassificacaoCompartilhado,
  serieTemClassificacao,
  Serie,
} from "@/lib/classificacao";

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

interface AdminPontuacoesProps {
  serie: Serie;
}

export function AdminPontuacoes({ serie }: AdminPontuacoesProps) {
  const { data: rodadas = [] } = useRodadas();
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const temClassificacao = serieTemClassificacao(serie);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  async function runRecalcularClassificacao() {
    await recalcularClassificacaoCompartilhado(serie, {
      onInfo: (m) => addLog("info", m),
      onSuccess: (m) => addLog("success", m),
      onWarning: (m) => addLog("warning", m),
      onError: (m) => addLog("error", m),
    });
  }

  const handleBuscarPontuacoes = async () => {
    if (!selectedRodada) {
      toast({ title: "Erro", description: "Selecione uma rodada", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLogs([]);

    try {
      const rodada = rodadas.find((r) => r.id === selectedRodada);
      if (!rodada || !rodada.rodada_cartola) throw new Error("Rodada sem rodada_cartola");

      const rodadaCartola = rodada.rodada_cartola;
      addLog("info", `Buscando pontuações da Rodada ${rodada.numero} (Cartola ${rodadaCartola})...`);

      // 1. Buscar IDs das equipes da Série selecionada
      const { data: equipesSerie, error: eqSerieError } = await supabase
        .from("equipes")
        .select("id")
        .eq("serie", serie);
      if (eqSerieError) throw eqSerieError;
      const equipeIdsSerie = new Set((equipesSerie || []).map((e) => e.id));

      // 2. Buscar confrontos da rodada e filtrar pelos que são da Série
      const { data: confrontosEquipeTodos, error: ceError } = await supabase
        .from("confrontos_equipe")
        .select("id, equipe1_id, equipe2_id")
        .eq("rodada_id", selectedRodada);

      if (ceError) throw ceError;
      const confrontosEquipe = (confrontosEquipeTodos || []).filter(
        (c) =>
          c.equipe1_id &&
          c.equipe2_id &&
          equipeIdsSerie.has(c.equipe1_id) &&
          equipeIdsSerie.has(c.equipe2_id)
      );
      addLog("info", `${confrontosEquipe.length} confrontos da Série ${serie} encontrados`);
      if (confrontosEquipe.length === 0) {
        addLog("warning", `Nenhum confronto da Série ${serie} nesta rodada.`);
      }

      // 2. Buscar todos os confrontos individuais
      const confrontoIds = confrontosEquipe?.map((c) => c.id) || [];
      const { data: confrontosInd, error: ciError } = await supabase
        .from("confrontos_individuais")
        .select(`
          id, confronto_equipe_id, ordem,
          jogador1_original_id, jogador2_original_id,
          jogador1_efetivo_id, jogador2_efetivo_id,
          jogador1_original:jogadores!confrontos_individuais_jogador1_original_id_fkey(id, nome, id_cartola, eh_coringa, equipe_id),
          jogador2_original:jogadores!confrontos_individuais_jogador2_original_id_fkey(id, nome, id_cartola, eh_coringa, equipe_id)
        `)
        .in("confronto_equipe_id", confrontoIds);

      if (ciError) throw ciError;
      addLog("info", `${confrontosInd?.length || 0} confrontos individuais encontrados`);

      // 3. Collect unique id_cartola values from ALL original players (titulares)
      const jogadorMap = new Map<number, string>(); // id_cartola -> jogador nome
      const allConfrontos = confrontosInd || [];
      for (const ci of allConfrontos) {
        const j1 = (ci as any).jogador1_original;
        const j2 = (ci as any).jogador2_original;
        if (j1?.id_cartola) jogadorMap.set(j1.id_cartola, j1.nome);
        if (j2?.id_cartola) jogadorMap.set(j2.id_cartola, j2.nome);
      }

      // 3b. Buscar coringas de todas as equipes envolvidas
      const equipeIds = new Set<string>();
      confrontosEquipe?.forEach((c) => {
        if (c.equipe1_id) equipeIds.add(c.equipe1_id);
        if (c.equipe2_id) equipeIds.add(c.equipe2_id);
      });

      const { data: coringas } = await supabase
        .from("jogadores")
        .select("id, nome, id_cartola, eh_coringa, equipe_id")
        .eq("eh_coringa", true)
        .in("equipe_id", Array.from(equipeIds));

      const coringasPorEquipe = new Map<string, any>();
      coringas?.forEach((c) => {
        if (c.equipe_id) {
          coringasPorEquipe.set(c.equipe_id, c);
          jogadorMap.set(c.id_cartola, c.nome);
        }
      });
      addLog("info", `${coringas?.length || 0} coringas encontrados`);

      const uniqueIds = Array.from(jogadorMap.keys());
      addLog("info", `${uniqueIds.length} jogadores únicos para buscar`);

      // 4. Fetch pontuações via proxy
      const pontuacoes = new Map<number, number>(); // id_cartola -> pontos
      const escalouMap = new Map<number, boolean>(); // id_cartola -> escalou?
      for (let i = 0; i < uniqueIds.length; i++) {
        const idCartola = uniqueIds[i];
        const nome = jogadorMap.get(idCartola) || `ID ${idCartola}`;
        addLog("info", `Buscando ${i + 1}/${uniqueIds.length}: ${nome}...`);

        try {
          const data = await fetchCartola(
            `https://api.cartola.globo.com/time/id/${idCartola}/${rodadaCartola}`
          );
          const pontos = Math.round((data.pontos || 0) * 100) / 100;
          const rodadaTimeId = data.time?.rodada_time_id || 0;
          const escalou = rodadaTimeId >= rodadaCartola;
          pontuacoes.set(idCartola, pontos);
          escalouMap.set(idCartola, escalou);
          addLog("success", `${nome}: ${pontos} pts ${escalou ? "✓" : "⚠️ não escalou"}`);
        } catch (err) {
          addLog("error", `Erro ao buscar ${nome}: ${err}`);
          pontuacoes.set(idCartola, 0);
          escalouMap.set(idCartola, false);
        }

        await new Promise((r) => setTimeout(r, 300));
      }

      // 5. CORINGA LOGIC: Before updating confrontos, apply coringa substitution
      addLog("info", "Aplicando lógica do coringa...");

      // Group confrontos individuais by confronto_equipe_id
      for (const ce of confrontosEquipe || []) {
        const cisDoConfronto = allConfrontos.filter((c) => c.confronto_equipe_id === ce.id);

        // Process coringa for equipe1
        aplicarCoringaEquipe(ce.equipe1_id!, cisDoConfronto, "jogador1", coringasPorEquipe, pontuacoes, escalouMap, rodadaCartola, addLog);
        // Process coringa for equipe2
        aplicarCoringaEquipe(ce.equipe2_id!, cisDoConfronto, "jogador2", coringasPorEquipe, pontuacoes, escalouMap, rodadaCartola, addLog);
      }

      // 6. Update confrontos_individuais with final pontuações and vencedores
      addLog("info", "Atualizando confrontos individuais...");
      for (const ci of allConfrontos) {
        const j1 = (ci as any).jogador1_original;
        const j2 = (ci as any).jogador2_original;
        const p1 = j1?.id_cartola ? (pontuacoes.get(j1.id_cartola) ?? 0) : 0;
        const p2 = j2?.id_cartola ? (pontuacoes.get(j2.id_cartola) ?? 0) : 0;

        // Check if coringa replaced this slot
        // We need to get the effective pontuação
        const efetivo1Id = (ci as any)._efetivo1_cartola;
        const efetivo2Id = (ci as any)._efetivo2_cartola;
        const finalP1 = efetivo1Id ? (pontuacoes.get(efetivo1Id) ?? p1) : p1;
        const finalP2 = efetivo2Id ? (pontuacoes.get(efetivo2Id) ?? p2) : p2;

        let vencedor: string | null = null;
        if (finalP1 > finalP2) vencedor = "jogador1";
        else if (finalP2 > finalP1) vencedor = "jogador2";
        else vencedor = "empate";

        const updateData: any = {
          pontuacao_jogador1: finalP1,
          pontuacao_jogador2: finalP2,
          vencedor,
        };

        // If coringa substituted, update efetivo_id
        if ((ci as any)._coringa_efetivo1_id) {
          updateData.jogador1_efetivo_id = (ci as any)._coringa_efetivo1_id;
        }
        if ((ci as any)._coringa_efetivo2_id) {
          updateData.jogador2_efetivo_id = (ci as any)._coringa_efetivo2_id;
        }

        await supabase
          .from("confrontos_individuais")
          .update(updateData)
          .eq("id", ci.id);
      }
      addLog("success", `${allConfrontos.length} confrontos individuais atualizados`);

      // 7. Update confrontos_equipe results
      addLog("info", "Calculando resultados dos confrontos de equipe...");
      for (const ce of confrontosEquipe || []) {
        const cis = allConfrontos.filter((c) => c.confronto_equipe_id === ce.id);
        let vitoriasE1 = 0;
        let vitoriasE2 = 0;
        for (const ci of cis) {
          const j1 = (ci as any).jogador1_original;
          const j2 = (ci as any).jogador2_original;
          const p1 = (ci as any)._efetivo1_cartola
            ? (pontuacoes.get((ci as any)._efetivo1_cartola) ?? 0)
            : (j1?.id_cartola ? (pontuacoes.get(j1.id_cartola) ?? 0) : 0);
          const p2 = (ci as any)._efetivo2_cartola
            ? (pontuacoes.get((ci as any)._efetivo2_cartola) ?? 0)
            : (j2?.id_cartola ? (pontuacoes.get(j2.id_cartola) ?? 0) : 0);
          if (p1 > p2) vitoriasE1++;
          else if (p2 > p1) vitoriasE2++;
        }

        let resultado: string | null = null;
        if (vitoriasE1 > vitoriasE2) resultado = "equipe1";
        else if (vitoriasE2 > vitoriasE1) resultado = "equipe2";
        else resultado = "empate";

        await supabase
          .from("confrontos_equipe")
          .update({ vitorias_equipe1: vitoriasE1, vitorias_equipe2: vitoriasE2, resultado })
          .eq("id", ce.id);

        addLog("success", `Confronto: ${vitoriasE1} x ${vitoriasE2} → ${resultado}`);
      }

      // 8. Update rodada status
      await supabase.from("rodadas").update({ status: "em_andamento" }).eq("id", selectedRodada);

      // 9. Recalcular classificação automaticamente
      addLog("info", "Recalculando classificação...");
      await runRecalcularClassificacao();

      addLog("success", "Pontuações atualizadas e classificação recalculada!");
      toast({ title: "Sucesso", description: "Pontuações e classificação atualizadas!" });
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
      queryClient.invalidateQueries({ queryKey: ["artilheiros"] });
      queryClient.invalidateQueries({ queryKey: ["classificacao"] });
    } catch (error) {
      addLog("error", `Erro: ${error}`);
      toast({ title: "Erro", description: `${error}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply coringa substitution for one team in a confronto — MAX 1 substitution
  function aplicarCoringaEquipe(
    equipeId: string,
    confrontosIndividuais: any[],
    lado: "jogador1" | "jogador2",
    coringasPorEquipe: Map<string, any>,
    pontuacoes: Map<number, number>,
    escalouMap: Map<number, boolean>,
    rodadaCartola: number,
    addLog: (type: LogEntry["type"], msg: string) => void
  ) {
    const coringa = coringasPorEquipe.get(equipeId);
    if (!coringa) return;

    const pontosCoringa = pontuacoes.get(coringa.id_cartola) ?? 0;

    const originalKey = lado === "jogador1" ? "jogador1_original" : "jogador2_original";
    const titulares = confrontosIndividuais
      .filter((ci) => {
        const jogador = (ci as any)[originalKey];
        return jogador && jogador.equipe_id === equipeId && !jogador.eh_coringa;
      })
      .map((ci) => {
        const jogador = (ci as any)[originalKey];
        return {
          ci,
          jogador,
          pontos: pontuacoes.get(jogador.id_cartola) ?? 0,
          escalou: escalouMap.get(jogador.id_cartola) ?? false,
        };
      });

    if (titulares.length === 0) return;

    const efKey = lado === "jogador1" ? "_efetivo1_cartola" : "_efetivo2_cartola";
    const coringaKey = lado === "jogador1" ? "_coringa_efetivo1_id" : "_coringa_efetivo2_id";

    // Find exactly ONE candidate for substitution
    let substituido: typeof titulares[0] | null = null;
    let motivo = "";

    // PRIORITY 1: First titular who did NOT escalate
    const naoEscalaram = titulares.filter((t) => !t.escalou);
    if (naoEscalaram.length > 0) {
      substituido = naoEscalaram[0];
      motivo = "não escalou";
    }

    // PRIORITY 2: Only if ALL 6 escalated → lowest scorer if coringa > lowest
    if (!substituido) {
      const menorTitular = titulares.reduce((menor, atual) =>
        atual.pontos < menor.pontos ? atual : menor
      );
      if (pontosCoringa > menorTitular.pontos) {
        substituido = menorTitular;
        motivo = "menor pontuador";
      }
    }

    // Apply substitution — exactly 0 or 1
    if (substituido) {
      addLog("success", `🃏 Coringa ${coringa.nome} (${pontosCoringa}pts) substitui ${substituido.jogador.nome} (${substituido.pontos}pts) — ${motivo}`);
      (substituido.ci as any)[efKey] = coringa.id_cartola;
      (substituido.ci as any)[coringaKey] = coringa.id;
    } else {
      const menorTitular = titulares.reduce((menor, atual) =>
        atual.pontos < menor.pontos ? atual : menor
      );
      addLog("info", `🃏 Coringa ${coringa.nome} (${pontosCoringa}pts) não substitui ninguém (menor: ${menorTitular.jogador.nome} ${menorTitular.pontos}pts)`);
    }
  }

  const handleFinalizarRodada = async () => {
    if (!selectedRodada) {
      toast({ title: "Erro", description: "Selecione uma rodada", variant: "destructive" });
      return;
    }

    const rodada = rodadas.find((r) => r.id === selectedRodada);
    if (!rodada) return;

    setIsFinalizing(true);

    try {
      addLog("info", `Finalizando Rodada ${rodada.numero}...`);

      const { error: statusError } = await supabase
        .from("rodadas")
        .update({ status: "finalizada" })
        .eq("id", selectedRodada);

      if (statusError) throw statusError;
      addLog("success", "Status da rodada atualizado para 'finalizada'");

      addLog("info", "Recalculando classificação...");
      await runRecalcularClassificacao();

      addLog("success", "✓ Rodada finalizada e classificação atualizada!");
      toast({ title: "Sucesso", description: "Rodada finalizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["rodadas"] });
      queryClient.invalidateQueries({ queryKey: ["classificacao"] });
      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
      queryClient.invalidateQueries({ queryKey: ["artilheiros"] });
    } catch (error) {
      addLog("error", `Erro ao finalizar: ${error}`);
      toast({ title: "Erro", description: `Erro ao finalizar rodada: ${error}`, variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-primary" />;
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
          <RefreshCw className="h-5 w-5 text-primary" />
          Pontuações — Série {serie}
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
                    Rodada {r.numero} (Cartola {r.rodada_cartola}) - {r.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleBuscarPontuacoes} disabled={isLoading || !selectedRodada} className="min-w-[180px]">
            {isLoading ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Buscando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Buscar Pontuações</>
            )}
          </Button>

          {temClassificacao && (
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
          )}
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
                      log.type === "success" && "bg-primary/10",
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
