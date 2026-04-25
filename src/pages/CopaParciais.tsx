import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { CopaParcialConfrontoCard } from "@/components/copa/CopaParcialConfrontoCard";
import { useCopaParciais } from "@/hooks/useCopaParciais";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Radio, Clock, ArrowLeft, Trophy } from "lucide-react";

const CopaParciais = () => {
  const { data: rodadas = [], isLoading: isLoadingRodadas } = useCopaRodadas();
  const { data, isLoading, error, fetchParciais, autoRefresh, toggleAutoRefresh } = useCopaParciais();
  const [selectedRodada, setSelectedRodada] = useState<string | null>(null);

  const rodadasEmAndamento = rodadas.filter((r) => r.status === "em_andamento");

  useEffect(() => {
    if (rodadasEmAndamento.length > 0 && !selectedRodada) {
      const rodada = rodadasEmAndamento[0];
      setSelectedRodada(String(rodada.numero));
      fetchParciais(rodada.numero);
    }
  }, [rodadasEmAndamento, selectedRodada, fetchParciais]);

  const handleSelectRodada = (value: string) => {
    setSelectedRodada(value);
    fetchParciais(Number(value));
  };

  const handleRefresh = () => {
    if (selectedRodada) fetchParciais(Number(selectedRodada));
  };

  const handleToggleAutoRefresh = () => {
    if (selectedRodada) toggleAutoRefresh(Number(selectedRodada));
  };

  const formatLastUpdate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/copa"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resultados</span>
            </Link>

            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">
                Copa Palpitão
              </h1>
            </div>

            <div />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-white animate-pulse flex items-center gap-1.5 px-3 py-1">
              <Radio className="h-3 w-3" />
              AO VIVO
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">Parciais da Rodada</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLoadingRodadas ? (
              <Skeleton className="h-10 w-48" />
            ) : rodadasEmAndamento.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Nenhuma rodada em andamento
              </span>
            ) : (
              <Select value={selectedRodada || ""} onValueChange={handleSelectRodada}>
                <SelectTrigger className="w-48 bg-card border-blue-500/20">
                  <SelectValue placeholder="Selecione a rodada" />
                </SelectTrigger>
                <SelectContent>
                  {rodadasEmAndamento.map((rodada) => (
                    <SelectItem key={rodada.id} value={String(rodada.numero)}>
                      Rodada {rodada.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || !selectedRodada}
              className="border-blue-500/20"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={handleToggleAutoRefresh}
                disabled={!selectedRodada}
              />
              <span className="text-xs text-muted-foreground">Auto (5min)</span>
            </div>
          </div>
        </div>

        {/* Last update */}
        {data?.atualizado_em && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {formatLastUpdate(data.atualizado_em)}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && data?.confrontos && (
          <div className="grid gap-6 md:grid-cols-2">
            {data.confrontos.map((confronto) => (
              <CopaParcialConfrontoCard key={confronto.id} confronto={confronto} />
            ))}
          </div>
        )}

        {/* No data */}
        {!isLoading && !data && !error && rodadasEmAndamento.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Selecione uma rodada e clique em "Atualizar" para ver as parciais
            </p>
          </div>
        )}

        {!isLoading && !data && !error && rodadasEmAndamento.length === 0 && !isLoadingRodadas && (
          <div className="text-center py-12">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma rodada em andamento no momento
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CopaParciais;
