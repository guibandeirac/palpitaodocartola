import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Radio, Clock, CheckCircle2 } from "lucide-react";

interface StatusRodadaBarProps {
  aoVivo: boolean;
  isLoading: boolean;
  atualizadoEm?: string | null;
  autoRefresh: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
  /** Classes do badge "AO VIVO" (cor de cada competição) */
  aoVivoClassName?: string;
  /** Classes extras do botão "Atualizar" */
  buttonClassName?: string;
}

const formatLastUpdate = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Indica se a rodada está ao vivo ou finalizada; os controles de atualização só aparecem ao vivo */
export function StatusRodadaBar({
  aoVivo,
  isLoading,
  atualizadoEm,
  autoRefresh,
  onRefresh,
  onToggleAutoRefresh,
  aoVivoClassName = "bg-destructive text-destructive-foreground",
  buttonClassName,
}: StatusRodadaBarProps) {
  if (!aoVivo) {
    return (
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3 w-3" />
          FINALIZADA
        </Badge>
        <span className="text-sm text-muted-foreground">Resultado final da rodada</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <Badge className={cn("animate-pulse flex items-center gap-1.5 px-3 py-1", aoVivoClassName)}>
          <Radio className="h-3 w-3" />
          AO VIVO
        </Badge>
        {atualizadoEm && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Atualizado às {formatLastUpdate(atualizadoEm)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className={buttonClassName}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Atualizar
        </Button>
        <div className="flex items-center gap-2">
          <Switch checked={autoRefresh} onCheckedChange={onToggleAutoRefresh} />
          <span className="text-xs text-muted-foreground">Auto (3min)</span>
        </div>
      </div>
    </div>
  );
}
