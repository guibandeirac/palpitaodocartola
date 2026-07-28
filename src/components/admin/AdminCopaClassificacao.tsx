import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recalcularCopaClassificacao } from "@/lib/copaClassificacao";
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
      await recalcularCopaClassificacao(addLog);

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
