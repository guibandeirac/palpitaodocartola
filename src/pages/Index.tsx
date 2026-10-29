import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { RodadaSelector } from "@/components/RodadaSelector";
import { ParcialConfrontoCard } from "@/components/ParcialConfrontoCard";
import { StatusRodadaBar } from "@/components/StatusRodadaBar";
import { ClassificacaoTable } from "@/components/ClassificacaoTable";
import { ArtilheirosTable } from "@/components/ArtilheirosTable";
import { PontuacaoEquipesTable } from "@/components/PontuacaoEquipesTable";
import { Footer } from "@/components/Footer";
import { useRodadas } from "@/hooks/useRodadas";
import { useParciais } from "@/hooks/useParciais";
import { useClassificacao } from "@/hooks/useClassificacao";
import { useArtilheiros } from "@/hooks/useArtilheiros";
import { usePontuacaoEquipes } from "@/hooks/usePontuacaoEquipes";
import { useEquipes } from "@/hooks/useEquipes";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";

const Index = () => {
  const [selectedRodada, setSelectedRodada] = useState<string | null>(null);

  const { data: rodadas = [], isLoading: isLoadingRodadas } = useRodadas();
  const { data: equipesSerieB = [] } = useEquipes("B");
  const { data: parciais, isLoading: isLoadingParciais, error: erroParciais, fetchParciais, autoRefresh, toggleAutoRefresh } =
    useParciais();
  const { data: classificacao = [], isLoading: isLoadingClassificacao } =
    useClassificacao("B");
  const { data: artilheiros = [], isLoading: isLoadingArtilheiros } =
    useArtilheiros("B");
  const { data: pontuacaoEquipes = [], isLoading: isLoadingPontuacao } =
    usePontuacaoEquipes("B");

  const equipeSerieBIds = useMemo(
    () => new Set(equipesSerieB.map((e) => e.id)),
    [equipesSerieB]
  );

  // A função de parciais não traz o logo; completa com as equipes já carregadas
  const confrontos = useMemo(() => {
    const logo = (id: string) => equipesSerieB.find((e) => e.id === id)?.logo_url;
    return (parciais?.confrontos ?? [])
      .filter(
        (c) =>
          equipeSerieBIds.has(c.equipe1.id) &&
          equipeSerieBIds.has(c.equipe2.id)
      )
      .map((c) => ({
        ...c,
        equipe1: { ...c.equipe1, logo_url: logo(c.equipe1.id) },
        equipe2: { ...c.equipe2, logo_url: logo(c.equipe2.id) },
      }));
  }, [parciais, equipesSerieB, equipeSerieBIds]);

  // Filter public rodadas: only em_andamento or finalizada (Série B)
  const publicRodadas = rodadas.filter(r => r.status_b === "em_andamento" || r.status_b === "finalizada");

  // Auto-select: em_andamento > última finalizada
  useEffect(() => {
    if (publicRodadas.length > 0 && !selectedRodada) {
      const emAndamento = publicRodadas.find(r => r.status_b === "em_andamento");
      if (emAndamento) { setSelectedRodada(emAndamento.id); return; }
      const finalizadas = publicRodadas.filter(r => r.status_b === "finalizada");
      if (finalizadas.length > 0) { setSelectedRodada(finalizadas[finalizadas.length - 1].id); return; }
    }
  }, [publicRodadas, selectedRodada]);

  const rodadaAtual = publicRodadas.find((r) => r.id === selectedRodada);
  const rodadaNumero = rodadaAtual?.numero;
  const aoVivo = rodadaAtual?.status_b === "em_andamento";

  // Ao trocar de rodada já busca o resultado (ao vivo ou final)
  useEffect(() => {
    if (rodadaNumero) fetchParciais(rodadaNumero);
  }, [rodadaNumero, fetchParciais]);

  // Rodada finalizada não precisa de atualização automática
  useEffect(() => {
    if (rodadaNumero && !aoVivo && autoRefresh) toggleAutoRefresh(rodadaNumero);
  }, [rodadaNumero, aoVivo, autoRefresh, toggleAutoRefresh]);

  // Esqueleto só no primeiro carregamento; nas atualizações os cards continuam na tela
  const mostrarEsqueleto = !!selectedRodada && !parciais && !erroParciais;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <RodadaSelector
            rodadas={publicRodadas}
            selectedRodada={selectedRodada}
            onSelect={setSelectedRodada}
            isLoading={isLoadingRodadas}
          />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Confrontos da Rodada
          </h2>
          {rodadaAtual && (
            <StatusRodadaBar
              aoVivo={aoVivo}
              isLoading={isLoadingParciais}
              atualizadoEm={parciais?.atualizado_em}
              autoRefresh={autoRefresh}
              onRefresh={() => fetchParciais(rodadaAtual.numero)}
              onToggleAutoRefresh={() => toggleAutoRefresh(rodadaAtual.numero)}
            />
          )}

          {erroParciais && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive">{erroParciais}</p>
            </div>
          )}

          {!selectedRodada ? (
            <div className="text-center py-12">
              <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isLoadingRodadas ? "Carregando rodadas..." : "Nenhuma rodada disponível no momento"}
              </p>
            </div>
          ) : mostrarEsqueleto ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : confrontos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {confrontos.map((confronto) => (
                <ParcialConfrontoCard key={confronto.id} confronto={confronto} />
              ))}
            </div>
          ) : (
            parciais && (
              <div className="text-center py-12">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum confronto da Série B cadastrado nesta rodada
                </p>
              </div>
            )
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <ClassificacaoTable
            classificacao={classificacao}
            isLoading={isLoadingClassificacao}
          />
          <ArtilheirosTable
            artilheiros={artilheiros}
            isLoading={isLoadingArtilheiros}
          />
        </div>

        <section className="mb-8">
          <PontuacaoEquipesTable
            pontuacoes={pontuacaoEquipes}
            isLoading={isLoadingPontuacao}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
