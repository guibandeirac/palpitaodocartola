import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { RodadaSelector } from "@/components/RodadaSelector";
import { ConfrontosSection } from "@/components/ConfrontosSection";
import { ClassificacaoTable } from "@/components/ClassificacaoTable";
import { ArtilheirosTable } from "@/components/ArtilheirosTable";
import { PontuacaoEquipesTable } from "@/components/PontuacaoEquipesTable";
import { Footer } from "@/components/Footer";
import { useRodadas } from "@/hooks/useRodadas";
import { useConfrontosRodada } from "@/hooks/useConfrontosRodada";
import { useClassificacao } from "@/hooks/useClassificacao";
import { useArtilheiros } from "@/hooks/useArtilheiros";
import { usePontuacaoEquipes } from "@/hooks/usePontuacaoEquipes";
import { useEquipes } from "@/hooks/useEquipes";

const Index = () => {
  const [selectedRodada, setSelectedRodada] = useState<string | null>(null);

  const { data: rodadas = [], isLoading: isLoadingRodadas } = useRodadas();
  const { data: equipesSerieB = [] } = useEquipes("B");
  const { data: confrontosTodos = [], isLoading: isLoadingConfrontos } =
    useConfrontosRodada(selectedRodada);
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

  const confrontos = useMemo(
    () =>
      confrontosTodos.filter(
        (c) =>
          equipeSerieBIds.has(c.equipe1.id) &&
          equipeSerieBIds.has(c.equipe2.id)
      ),
    [confrontosTodos, equipeSerieBIds]
  );

  // Filter public rodadas: only em_andamento or finalizada
  const publicRodadas = rodadas.filter(r => r.status === "em_andamento" || r.status === "finalizada");

  // Auto-select: em_andamento > última finalizada
  useEffect(() => {
    if (publicRodadas.length > 0 && !selectedRodada) {
      const emAndamento = publicRodadas.find(r => r.status === "em_andamento");
      if (emAndamento) { setSelectedRodada(emAndamento.id); return; }
      const finalizadas = publicRodadas.filter(r => r.status === "finalizada");
      if (finalizadas.length > 0) { setSelectedRodada(finalizadas[finalizadas.length - 1].id); return; }
    }
  }, [publicRodadas, selectedRodada]);

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
          <ConfrontosSection
            confrontos={confrontos}
            isLoading={isLoadingConfrontos}
            rodadaSelecionada={!!selectedRodada}
          />
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
