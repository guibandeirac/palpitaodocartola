import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowLeft, Radio } from "lucide-react";
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
import { useCopaConfrontos, useCopaPontuacoes } from "@/hooks/useCopaConfrontos";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import { useCopaPlayoffs } from "@/hooks/useCopaPlayoffs";
import { CopaConfrontoCard } from "@/components/copa/CopaConfrontoCard";
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

  const { data: confrontos = [], isLoading: isLoadingConfrontos } =
    useCopaConfrontos(selectedRodadaId);
  const { data: pontuacoes = [] } = useCopaPontuacoes(selectedRodadaId);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Início</span>
            </Link>

            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">
                Copa Palpitão
              </h1>
            </div>

            <Link
              to="/copa/parciais"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Radio className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Parciais</span>
              <span className="sm:hidden">🔴</span>
            </Link>
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

          {isLoadingConfrontos ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : confrontos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum confronto nesta rodada
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {confrontos.map((c) => (
                <CopaConfrontoCard
                  key={c.id}
                  confronto={c}
                  pontuacoes={pontuacoes.filter(
                    (p) =>
                      p.equipe_id === c.equipe1_id ||
                      p.equipe_id === c.equipe2_id
                  )}
                />
              ))}
            </div>
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
