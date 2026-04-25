import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ParcialConfrontoCard } from "@/components/ParcialConfrontoCard";
import { useParciais } from "@/hooks/useParciais";
import { useRodadas } from "@/hooks/useRodadas";
import { useEquipes } from "@/hooks/useEquipes";
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
import { RefreshCw, Radio, Clock } from "lucide-react";

const Parciais = () => {
  const { data: rodadas = [], isLoading: isLoadingRodadas } = useRodadas();
  const { data: equipesSerieB = [] } = useEquipes("B");
  const { data, isLoading, error, fetchParciais, autoRefresh, toggleAutoRefresh } = useParciais();
  const [selectedRodada, setSelectedRodada] = useState<string | null>(null);

  // Filter only rodadas with status 'em_andamento'
  const rodadasEmAndamento = rodadas.filter((r) => r.status === "em_andamento");

  const equipeSerieBIds = useMemo(
    () => new Set(equipesSerieB.map((e) => e.id)),
    [equipesSerieB]
  );

  const confrontosSerieB = useMemo(() => {
    if (!data?.confrontos) return [];
    return data.confrontos.filter(
      (c) =>
        equipeSerieBIds.has(c.equipe1.id) && equipeSerieBIds.has(c.equipe2.id)
    );
  }, [data, equipeSerieBIds]);

  // Auto-select the first em_andamento rodada
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
    if (selectedRodada) {
      fetchParciais(Number(selectedRodada));
    }
  };

  const handleToggleAutoRefresh = () => {
    if (selectedRodada) {
      toggleAutoRefresh(Number(selectedRodada));
    }
  };

  const formatLastUpdate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Badge className="bg-destructive text-destructive-foreground animate-pulse flex items-center gap-1.5 px-3 py-1">
              <Radio className="h-3 w-3" />
              AO VIVO
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">Parciais da Rodada</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Rodada selector */}
            {isLoadingRodadas ? (
              <Skeleton className="h-10 w-48" />
            ) : rodadasEmAndamento.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Nenhuma rodada em andamento
              </span>
            ) : (
              <Select value={selectedRodada || ""} onValueChange={handleSelectRodada}>
                <SelectTrigger className="w-48 bg-card">
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

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || !selectedRodada}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>

            {/* Auto-refresh toggle */}
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && confrontosSerieB.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {confrontosSerieB.map((confronto) => (
              <ParcialConfrontoCard key={confronto.id} confronto={confronto} />
            ))}
          </div>
        )}

        {/* Sem confrontos da Série B nesta rodada */}
        {!isLoading && data && confrontosSerieB.length === 0 && !error && (
          <div className="text-center py-12">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum confronto da Série B cadastrado nesta rodada
            </p>
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


export default Parciais;
