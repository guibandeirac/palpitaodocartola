import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { useCopaParciais } from "@/hooks/useCopaParciais";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import { useCopaPlayoffs } from "@/hooks/useCopaPlayoffs";
import { CopaParcialConfrontoCard } from "@/components/copa/CopaParcialConfrontoCard";
import { StatusRodadaBar } from "@/components/StatusRodadaBar";
import { CopaClassificacaoTable } from "@/components/copa/CopaClassificacaoTable";
import { CopaPlayoffBracket } from "@/components/copa/CopaPlayoffBracket";

function faseLabel(fase: string, detalhe: string | null) {
  const labels: Record<string, string> = {
    grupos: "Grupos",
    quartas: "Quartas",
    semifinal: "Semifinal",
    final: "Final",
    repescagem: "Repescagem",
  };
  const base = labels[fase] || fase;
  return detalhe ? `${base} - ${detalhe}` : base;
}

const Copa = () => {
  const { data: rodadas = [], isLoading: isLoadingRodadas } = useCopaRodadas();
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | null>(null);

  const selectedRodada = rodadas.find((r) => r.id === selectedRodadaId);

  const { data: parciais, isLoading: isLoadingParciais, error: erroParciais, fetchParciais, autoRefresh, toggleAutoRefresh } =
    useCopaParciais();
  const { data: classificacao = [], isLoading: isLoadingClassificacao } =
    useCopaClassificacao();
  const { data: playoffs = [], isLoading: isLoadingPlayoffs } =
    useCopaPlayoffs();

  // Filter public rodadas: only em_andamento or finalizada
  const publicRodadas = rodadas.filter(r => r.status === "em_andamento" || r.status === "finalizada");

  // Auto-select: em_andamento > última finalizada
  useEffect(() => {
    if (publicRodadas.length > 0 && !selectedRodadaId) {
      const emAndamento = publicRodadas.find(r => r.status === "em_andamento");
      if (emAndamento) {
        setSelectedRodadaId(emAndamento.id);
        return;
      }
      const finalizadas = publicRodadas.filter(r => r.status === "finalizada");
      if (finalizadas.length > 0) {
        setSelectedRodadaId(finalizadas[finalizadas.length - 1].id);
        return;
      }
    }
  }, [publicRodadas, selectedRodadaId]);

  const rodadaNumero = selectedRodada?.numero;
  const aoVivo = selectedRodada?.status === "em_andamento";

  // Ao trocar de rodada já busca o resultado (ao vivo ou final)
  useEffect(() => {
    if (rodadaNumero) fetchParciais(rodadaNumero);
  }, [rodadaNumero, fetchParciais]);

  // Rodada finalizada não precisa de atualização automática
  useEffect(() => {
    if (rodadaNumero && !aoVivo && autoRefresh) toggleAutoRefresh(rodadaNumero);
  }, [rodadaNumero, aoVivo, autoRefresh, toggleAutoRefresh]);

  const confrontos = parciais?.confrontos ?? [];
  // Esqueleto só no primeiro carregamento; nas atualizações os cards continuam na tela
  const mostrarEsqueleto = !!selectedRodadaId && !parciais && !erroParciais;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img src="/logos/copa-palpitao.jpg" alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-black object-cover" />
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">
                Copa Palpitão
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Rodada selector */}
        <div className="mb-8">
          {isLoadingRodadas ? (
            <Skeleton className="h-10 w-64" />
          ) : rodadas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma rodada cadastrada</p>
          ) : (
            <Select
              value={selectedRodadaId || ""}
              onValueChange={setSelectedRodadaId}
            >
              <SelectTrigger className="w-72 bg-card border-blue-500/20">
                <SelectValue placeholder="Selecione a rodada" />
              </SelectTrigger>
              <SelectContent>
                {publicRodadas.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Rodada {r.numero} — {faseLabel(r.fase, r.fase_detalhe)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Confrontos */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            Confrontos da Rodada
            {selectedRodada && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({faseLabel(selectedRodada.fase, selectedRodada.fase_detalhe)})
              </span>
            )}
          </h2>

          {selectedRodada && (
            <StatusRodadaBar
              aoVivo={aoVivo}
              isLoading={isLoadingParciais}
              atualizadoEm={parciais?.atualizado_em}
              autoRefresh={autoRefresh}
              onRefresh={() => fetchParciais(selectedRodada.numero)}
              onToggleAutoRefresh={() => toggleAutoRefresh(selectedRodada.numero)}
              aoVivoClassName="bg-blue-600 text-white"
              buttonClassName="border-blue-500/20"
            />
          )}

          {erroParciais && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive">{erroParciais}</p>
            </div>
          )}

          {mostrarEsqueleto ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : confrontos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {confrontos.map((confronto) => (
                <CopaParcialConfrontoCard key={confronto.id} confronto={confronto} />
              ))}
            </div>
          ) : (
            parciais && (
              <p className="text-muted-foreground text-center py-8">
                Nenhum confronto nesta rodada
              </p>
            )
          )}
        </section>

        {/* Classificação */}
        <section className="mb-10">
          <CopaClassificacaoTable
            classificacao={classificacao}
            isLoading={isLoadingClassificacao}
          />
        </section>

        {/* Playoffs Bracket */}
        <section className="mb-8">
          <CopaPlayoffBracket
            playoffs={playoffs}
            isLoading={isLoadingPlayoffs}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Copa;
