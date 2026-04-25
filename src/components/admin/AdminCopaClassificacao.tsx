import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calculator, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
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

interface LogEntry {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

function floorInt(v: number): number {
  return Math.floor(v);
}

export function AdminCopaClassificacao() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  const handleRecalcular = async () => {
    setShowDialog(false);
    setIsRecalculating(true);
    setLogs([]);

    try {
      addLog("info", "Iniciando recálculo da classificação da Copa...");

      // Fetch all equipes
      const { data: equipes } = await supabase.from("equipes").select("id, nome");
      addLog("info", `${equipes?.length || 0} equipes encontradas`);

      // Fetch finalized grupo rodadas (1-22)
      const { data: rodadasFinalizadas } = await supabase
        .from("copa_rodadas")
        .select("id, numero, fase")
        .eq("status", "finalizada")
        .eq("fase", "grupos")
        .order("numero");

      addLog("info", `${rodadasFinalizadas?.length || 0} rodadas de grupos finalizadas`);

      // Initialize stats
      const stats = new Map<string, {
        nome: string; pontos: number; jogos: number;
        vitorias: number; empates: number; derrotas: number;
        pontos_pro: number; pontos_contra: number;
      }>();

      for (const eq of equipes || []) {
        stats.set(eq.id, {
          nome: eq.nome, pontos: 0, jogos: 0,
          vitorias: 0, empates: 0, derrotas: 0,
          pontos_pro: 0, pontos_contra: 0,
        });
      }

      // Process each rodada
      for (const rodada of rodadasFinalizadas || []) {
        addLog("info", `Processando Rodada ${rodada.numero}...`);

        const { data: confrontos } = await supabase
          .from("copa_confrontos")
          .select("equipe1_id, equipe2_id, pontuacao_equipe1, pontuacao_equipe2, resultado")
          .eq("rodada_id", rodada.id);

        for (const c of confrontos || []) {
          const s1 = stats.get(c.equipe1_id!);
          const s2 = stats.get(c.equipe2_id!);
          if (!s1 || !s2) continue;

          const p1 = Number(c.pontuacao_equipe1 ?? 0);
          const p2 = Number(c.pontuacao_equipe2 ?? 0);

          s1.jogos++;
          s2.jogos++;
          s1.pontos_pro += p1;
          s1.pontos_contra += p2;
          s2.pontos_pro += p2;
          s2.pontos_contra += p1;

          if (c.resultado === "equipe1") {
            s1.pontos += 3; s1.vitorias++; s2.derrotas++;
          } else if (c.resultado === "equipe2") {
            s2.pontos += 3; s2.vitorias++; s1.derrotas++;
          } else if (c.resultado === "empate") {
            s1.pontos += 1; s1.empates++;
            s2.pontos += 1; s2.empates++;
          }
        }

        addLog("success", `Rodada ${rodada.numero} processada`);
      }

      // Clear and update copa_classificacao
      addLog("info", "Atualizando tabela copa_classificacao...");

      for (const [equipeId, s] of stats) {
        if (s.jogos === 0) continue; // Skip equipes with no games

        const pp = floorInt(s.pontos_pro);
        const pc = floorInt(s.pontos_contra);
        const sp = pp - pc;
        const aprov = s.jogos > 0 ? Math.round((s.pontos / (s.jogos * 3)) * 100) : 0;

        const { data: existing } = await supabase
          .from("copa_classificacao")
          .select("id")
          .eq("equipe_id", equipeId)
          .maybeSingle();

        const payload = {
          equipe_id: equipeId,
          pontos: s.pontos,
          jogos: s.jogos,
          vitorias: s.vitorias,
          empates: s.empates,
          derrotas: s.derrotas,
          pontos_pro: pp,
          pontos_contra: pc,
          saldo_pontos: sp,
          aproveitamento: aprov,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from("copa_classificacao").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("copa_classificacao").insert(payload);
        }

        addLog("success", `${s.nome}: ${s.pontos}pts, ${pp}PP, ${pc}PC, ${sp}SP, ${aprov}%`);
      }

      addLog("success", "Classificação da Copa recalculada com sucesso!");
      toast({ title: "Sucesso", description: "Classificação da Copa recalculada!" });
      queryClient.invalidateQueries({ queryKey: ["copa_classificacao"] });
    } catch (error) {
      addLog("error", `Erro: ${error}`);
      toast({ title: "Erro", description: `${error}`, variant: "destructive" });
    } finally {
      setIsRecalculating(false);
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

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-400" />
            Classificação da Copa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={() => setShowDialog(true)}
            disabled={isRecalculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRecalculating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Recalculando...</>
            ) : (
              <><Calculator className="h-4 w-4 mr-2" />Recalcular Classificação</>
            )}
          </Button>

          {logs.length > 0 && (
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Log de Execução</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
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
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular Classificação da Copa?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai recalcular toda a classificação da fase de grupos com base nas rodadas finalizadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalcular}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
