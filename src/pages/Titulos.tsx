import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Search } from "lucide-react";
import { CompeticaoIcone } from "@/components/CompeticaoIcone";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipes } from "@/hooks/useEquipes";
import {
  COMPETICOES,
  Titulo,
  galeriaClubes,
  galeriaJogadores,
  normalizar,
  slugClube,
  titulosPorAno,
} from "@/data/titulos";

function TituloChip({ titulo }: { titulo: Titulo }) {
  const comp = COMPETICOES[titulo.competicao];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1 text-xs text-secondary-foreground">
      <CompeticaoIcone competicao={titulo.competicao} className="h-4 w-4 text-sm" />
      <span>{comp.nome}</span>
      <span className="font-semibold text-amber-400">{titulo.ano}</span>
    </span>
  );
}

function ClubeEscudo({ nome, logoUrl }: { nome: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={nome} className="h-14 w-14 rounded-full object-contain" />;
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-lg font-bold text-amber-400">
      {nome.slice(0, 2).toUpperCase()}
    </div>
  );
}

function AbaClubes() {
  const { data: equipes = [] } = useEquipes();
  const clubes = useMemo(() => galeriaClubes(), []);
  const logoPorNome = new Map(equipes.map((e) => [normalizar(e.nome), e.logo_url]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubes.map(({ clube, titulos }) => {
        const contagem = titulos.reduce<Record<string, number>>((acc, t) => {
          acc[t.competicao] = (acc[t.competicao] ?? 0) + 1;
          return acc;
        }, {});

        return (
          <div key={clube} className="rounded-xl border border-border bg-card p-5">
            <Link to={`/clubes/${slugClube(clube)}`} className="group flex items-center gap-4">
              <ClubeEscudo nome={clube} logoUrl={logoPorNome.get(normalizar(clube))} />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-amber-400">{clube}</h3>
                <p className="text-sm text-muted-foreground">
                  {titulos.length} {titulos.length === 1 ? "título" : "títulos"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {Object.entries(contagem).map(([comp, n]) => (
                  <span key={comp} className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <CompeticaoIcone competicao={comp as Titulo["competicao"]} className="h-7 w-7" />
                    ×{n}
                  </span>
                ))}
              </div>
            </Link>

            <ul className="mt-4 space-y-3 border-t border-border pt-4">
              {titulos.map((t) => (
                <li key={`${t.competicao}-${t.ano}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <CompeticaoIcone competicao={t.competicao} className="h-5 w-5" />
                      {COMPETICOES[t.competicao].nome}
                    </span>
                    <span className="font-semibold text-amber-400">{t.ano}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.jogadores.join(", ")}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AbaJogadores() {
  const [busca, setBusca] = useState("");
  const jogadores = useMemo(() => galeriaJogadores(), []);
  const maisVitorioso = jogadores[0];

  // Posição considera empates (mesmo número de títulos = mesma posição)
  const posicoes = jogadores.map((j) => jogadores.findIndex((o) => o.titulos.length === j.titulos.length) + 1);
  const filtrados = jogadores
    .map((j, i) => ({ ...j, posicao: posicoes[i] }))
    .filter((j) => normalizar(j.jogador).includes(normalizar(busca)));

  return (
    <div className="space-y-6">
      {maisVitorioso && !busca && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Crown className="h-4 w-4" /> Jogador mais vitorioso
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{maisVitorioso.jogador}</h3>
            <span className="text-lg font-semibold text-amber-400">{maisVitorioso.titulos.length} títulos</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {maisVitorioso.titulos.map((t) => (
              <TituloChip key={`${t.competicao}-${t.ano}`} titulo={t} />
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar jogador..."
          className="pl-9"
        />
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {filtrados.map((j) => (
          <div key={j.jogador} className="flex gap-3 p-4">
            <span className="w-6 pt-0.5 text-right text-sm font-semibold text-muted-foreground">{j.posicao}º</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{j.jogador}</span>
                <span className="shrink-0 text-sm font-semibold text-amber-400">
                  {j.titulos.length} {j.titulos.length === 1 ? "título" : "títulos"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {j.titulos.map((t) => (
                  <TituloChip key={`${t.competicao}-${t.ano}`} titulo={t} />
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum jogador encontrado.</p>
        )}
      </div>
    </div>
  );
}

function AbaPorAno() {
  const anos = useMemo(() => titulosPorAno(), []);

  return (
    <div className="space-y-6">
      {anos.map(({ ano, titulos }) => (
        <section key={ano}>
          <h3 className="mb-3 text-xl font-bold text-amber-400">{ano}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {titulos.map((t) => {
              const comp = COMPETICOES[t.competicao];
              return (
                <div key={t.competicao} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <CompeticaoIcone competicao={t.competicao} className="h-6 w-6 text-base" />
                    {comp.nome}
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{t.clube ?? t.jogadores.join(" e ")}</div>
                  {t.clube && <p className="mt-1 text-xs text-muted-foreground">{t.jogadores.join(", ")}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const Titulos = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-amber-500/20 bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <img src="/logos/logo-grupo.jpg" alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black object-cover" />
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">Galeria de Títulos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">
        <Tabs defaultValue="clubes">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="clubes">Clubes</TabsTrigger>
            <TabsTrigger value="jogadores">Jogadores</TabsTrigger>
            <TabsTrigger value="ano">Por ano</TabsTrigger>
          </TabsList>
          <TabsContent value="clubes">
            <AbaClubes />
          </TabsContent>
          <TabsContent value="jogadores">
            <AbaJogadores />
          </TabsContent>
          <TabsContent value="ano">
            <AbaPorAno />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Titulos;
