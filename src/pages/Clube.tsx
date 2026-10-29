import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Landmark, Medal, Shield, Swords, Trophy, Users } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CompeticaoIcone } from "@/components/CompeticaoIcone";
import { Skeleton } from "@/components/ui/skeleton";
import { useEquipes } from "@/hooks/useEquipes";
import { useJogadoresByEquipe } from "@/hooks/useJogadores";
import { useClassificacao } from "@/hooks/useClassificacao";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import { useArtilheiros } from "@/hooks/useArtilheiros";
import { ConfrontoClube, useConfrontosClube } from "@/hooks/useConfrontosClube";
import { cn } from "@/lib/utils";
import { COMPETICOES, TITULOS, slugClube, titulosDoClube, titulosDoJogador } from "@/data/titulos";

function iniciais(nome: string) {
  const partes = nome.replace(/\(.*?\)/g, "").trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function Secao({ titulo, icon: Icon, children, className }: {
  titulo: string;
  icon: typeof Trophy;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4 sm:p-6", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="h-5 w-5 text-primary" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const COR_RESULTADO: Record<ConfrontoClube["resultado"], string> = {
  V: "bg-green-500/20 text-green-400",
  E: "bg-secondary text-muted-foreground",
  D: "bg-red-500/20 text-red-400",
};

function Forma({ confrontos }: { confrontos: ConfrontoClube[] }) {
  return (
    <div className="flex gap-1">
      {confrontos.slice(0, 5).map((c) => (
        <span key={c.id} className={cn("flex h-6 w-6 items-center justify-center rounded text-xs font-bold", COR_RESULTADO[c.resultado])}>
          {c.resultado}
        </span>
      ))}
    </div>
  );
}

const Clube = () => {
  const { slug = "" } = useParams();
  const { data: equipes = [], isLoading: carregandoEquipes } = useEquipes();
  const equipe = equipes.find((e) => slugClube(e.nome) === slug);

  // Clube só da história (ex.: Irreal Madrid) não está na tabela de equipes
  const nomeHistorico = TITULOS.find((t) => t.clube && slugClube(t.clube) === slug)?.clube;
  const nome = equipe?.nome ?? nomeHistorico;
  const titulos = nome ? titulosDoClube(nome) : [];

  const { data: jogadores = [], isLoading: carregandoElenco } = useJogadoresByEquipe(equipe?.id ?? null);
  const { data: classificacaoB = [] } = useClassificacao("B");
  const { data: classificacaoCopa = [] } = useCopaClassificacao();
  const { data: artilheiros = [] } = useArtilheiros(equipe?.serie);
  const { data: confrontos = [], isLoading: carregandoConfrontos } = useConfrontosClube(equipe?.id);

  const elenco = useMemo(
    () =>
      jogadores
        .filter((j) => j.ativo !== false)
        .sort((a, b) => Number(a.eh_coringa) - Number(b.eh_coringa) || a.nome.localeCompare(b.nome)),
    [jogadores],
  );

  if (carregandoEquipes) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!nome) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Clube não encontrado.</p>
        <Link to="/titulos" className="mt-4 inline-block text-sm text-amber-400 hover:underline">
          Ver galeria de títulos
        </Link>
      </div>
    );
  }

  const posB = equipe ? classificacaoB.findIndex((c) => c.equipe.id === equipe.id) : -1;
  const linhaB = posB >= 0 ? classificacaoB[posB] : undefined;
  const posCopa = equipe ? classificacaoCopa.findIndex((c) => c.equipe_id === equipe.id) : -1;
  const linhaCopa = posCopa >= 0 ? classificacaoCopa[posCopa] : undefined;
  const statsPorJogador = new Map(artilheiros.map((a) => [a.jogador_id, a]));
  const confrontosB = confrontos.filter((c) => c.competicao === "serie_b");
  const confrontosCopa = confrontos.filter((c) => c.competicao === "copa");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cabeçalho do clube */}
      <header className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left sm:gap-6">
            {equipe?.logo_url ? (
              <img src={equipe.logo_url} alt={nome} className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-contain" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15 text-3xl font-bold text-amber-400">
                {iniciais(nome)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{nome}</h1>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2 text-sm">
                {equipe ? (
                  <span className={cn(
                    "rounded-md px-2 py-0.5 font-medium",
                    equipe.serie === "A" ? "bg-orange-500/15 text-orange-400" : "bg-green-500/15 text-green-400",
                  )}>
                    Champions Série {equipe.serie}
                  </span>
                ) : (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-muted-foreground">Clube histórico</span>
                )}
                {titulos.length > 0 && (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-400">
                    {titulos.length} {titulos.length === 1 ? "título" : "títulos"}
                  </span>
                )}
              </div>
            </div>
            {titulos.length > 0 && (
              <div className="flex gap-3">
                {[...new Set(titulos.map((t) => t.competicao))].map((c) => (
                  <div key={c} className="flex flex-col items-center gap-1">
                    <CompeticaoIcone competicao={c} className="h-14 w-14 text-3xl" />
                    <span className="text-sm font-bold text-amber-400">
                      ×{titulos.filter((t) => t.competicao === c).length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1 space-y-6">
        {equipe && (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Elenco */}
            <Secao titulo="Elenco 2026" icon={Users} className="lg:col-span-2">
              {carregandoElenco ? (
                <Skeleton className="h-48 w-full" />
              ) : elenco.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum jogador cadastrado.</p>
              ) : (
                <ul className="space-y-2">
                  {elenco.map((j) => {
                    const titulosJogador = j.eh_coringa ? 0 : titulosDoJogador(j.nome).length;
                    // Por enquanto só a Série B mostra vitórias e pontos
                    const stats = equipe.serie === "B" ? statsPorJogador.get(j.id) : undefined;
                    return (
                      <li key={j.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/40">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          j.eh_coringa ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary",
                        )}>
                          {j.eh_coringa ? "🃏" : iniciais(j.nome)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">{j.eh_coringa ? "Coringa" : j.nome}</div>
                          {stats && (
                            <div className="text-xs text-muted-foreground">
                              {stats.vitorias} {stats.vitorias === 1 ? "vitória" : "vitórias"} · {stats.pontuacao_total.toLocaleString("pt-BR")} pts
                            </div>
                          )}
                        </div>
                        {titulosJogador > 0 && (
                          <span className="shrink-0 text-xs font-semibold text-amber-400" title="Títulos no Palpitão">
                            🏆 {titulosJogador}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Secao>

            {/* Campanha */}
            <Secao titulo="Campanha 2026" icon={Medal} className="lg:col-span-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {equipe.serie === "B" && (
                  <Link to="/serie-b" className="rounded-lg border border-border p-4 transition-colors hover:border-green-500/50">
                    <div className="text-xs uppercase tracking-wider text-green-400">Champions Série B</div>
                    {linhaB ? (
                      <>
                        <div className="mt-1 text-2xl font-bold text-foreground">{posB + 1}º lugar</div>
                        <div className="text-sm text-muted-foreground">
                          {linhaB.pontos ?? 0} pts · {linhaB.vitorias ?? 0}V {linhaB.empates ?? 0}E {linhaB.derrotas ?? 0}D
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">Sem jogos ainda</div>
                    )}
                    {confrontosB.length > 0 && <div className="mt-3"><Forma confrontos={confrontosB} /></div>}
                  </Link>
                )}
                {equipe.serie === "A" && (
                  <Link to="/serie-a" className="rounded-lg border border-border p-4 transition-colors hover:border-orange-500/50">
                    <div className="text-xs uppercase tracking-wider text-orange-400">Champions Série A</div>
                    <div className="mt-1 text-sm text-muted-foreground">Disputada somente ao vivo, sem tabela de classificação.</div>
                  </Link>
                )}
                <Link to="/copa" className="rounded-lg border border-border p-4 transition-colors hover:border-blue-500/50">
                  <div className="text-xs uppercase tracking-wider text-blue-400">Copa Palpitão</div>
                  {linhaCopa ? (
                    <>
                      <div className="mt-1 text-2xl font-bold text-foreground">{posCopa + 1}º lugar</div>
                      <div className="text-sm text-muted-foreground">
                        {linhaCopa.pontos} pts · {linhaCopa.vitorias}V {linhaCopa.empates}E {linhaCopa.derrotas}D
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">Sem jogos ainda</div>
                  )}
                  {confrontosCopa.length > 0 && <div className="mt-3"><Forma confrontos={confrontosCopa} /></div>}
                </Link>
              </div>

              <h3 className="mt-6 mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Swords className="h-4 w-4" /> Últimos confrontos
              </h3>
              {carregandoConfrontos ? (
                <Skeleton className="h-40 w-full" />
              ) : confrontos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum confronto finalizado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {confrontos.slice(0, 8).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold", COR_RESULTADO[c.resultado])}>
                        {c.resultado}
                      </span>
                      <div className="w-20 shrink-0 text-xs text-muted-foreground">
                        <div className={c.competicao === "copa" ? "text-blue-400" : "text-green-400"}>
                          {c.competicao === "copa" ? "Copa" : "Série B"}
                        </div>
                        Rodada {c.rodada}
                      </div>
                      <Link to={`/clubes/${slugClube(c.adversario.nome)}`} className="flex min-w-0 flex-1 items-center gap-2 hover:text-primary">
                        {c.adversario.logo_url && (
                          <img src={c.adversario.logo_url} alt="" className="h-5 w-5 rounded-full object-contain" />
                        )}
                        <span className="truncate">{c.adversario.nome}</span>
                      </Link>
                      <span className="shrink-0 font-semibold tabular-nums text-foreground">
                        {c.placarPro} × {c.placarContra}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Secao>
          </div>
        )}

        {/* Sala de troféus */}
        <Secao titulo="Sala de troféus" icon={Landmark}>
          {titulos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda sem títulos de clube. O primeiro pode ser em 2026!
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {titulos.map((t) => (
                <div key={`${t.competicao}-${t.ano}`} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <CompeticaoIcone competicao={t.competicao} className="h-12 w-12 text-2xl" />
                    <span className="text-lg font-bold text-amber-400">{t.ano}</span>
                  </div>
                  <div className="mt-2 font-semibold text-foreground">{COMPETICOES[t.competicao].nome}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.jogadores.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </Secao>
      </main>

      <Footer />
    </div>
  );
};

export default Clube;
