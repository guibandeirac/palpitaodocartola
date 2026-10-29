import { Crown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { LOGO_GRUPO } from "@/components/CompeticaoIcone";
import { useEquipes } from "@/hooks/useEquipes";
import { TITULOS, galeriaClubes, galeriaJogadores } from "@/data/titulos";

const competitions = [
  {
    title: "Champions Série A",
    subtitle: "Somente ao vivo",
    path: "/serie-a",
    logo: "/logos/champions.jpg",
    accent: "hover:border-orange-500/60 hover:shadow-[0_0_30px_-5px_hsl(25_95%_53%/0.25)]",
    textAccent: "group-hover:text-orange-400",
  },
  {
    title: "Champions Série B",
    subtitle: "2026",
    path: "/serie-b",
    logo: "/logos/champions.jpg",
    accent: "hover:border-green-500/60 hover:shadow-[0_0_30px_-5px_hsl(142_76%_36%/0.25)]",
    textAccent: "group-hover:text-green-400",
  },
  {
    title: "Copa Palpitão",
    subtitle: "2026",
    path: "/copa",
    logo: "/logos/copa-palpitao.jpg",
    accent: "hover:border-blue-500/60 hover:shadow-[0_0_30px_-5px_hsl(217_91%_60%/0.25)]",
    textAccent: "group-hover:text-blue-400",
  },
];

const clubeMaisVitorioso = galeriaClubes()[0];
const jogadorMaisVitorioso = galeriaJogadores()[0];

// Campeões de clube da última temporada, agrupados por clube
const NOME_CURTO: Record<string, string> = { champions: "Série A", champions_b: "Série B", copa: "Copa" };
const titulosDeClube = TITULOS.filter((t) => t.clube);
const ultimoAno = Math.max(...titulosDeClube.map((t) => t.ano));
const campeoesUltimoAno = [...new Set(titulosDeClube.filter((t) => t.ano === ultimoAno).map((t) => t.clube!))].map(
  (clube) => ({
    clube,
    competicoes: titulosDeClube
      .filter((t) => t.ano === ultimoAno && t.clube === clube)
      .map((t) => NOME_CURTO[t.competicao]),
  }),
);

const SERIE_A_NAMES = ["Baile de Munique", "Botafofo", "Dynamo", "Jumentus", "Legends", "Malfica"];
const SERIE_B_NAMES = ["Al Bilal", "Galácticos", "Lazionados", "Inter de Limão", "Brutus", "Futbreja"];

const Landing = () => {
  const { data: equipes = [] } = useEquipes();
  const equipesWithLogo = equipes.filter(e => e.logo_url);
  const serieAEquipes = equipesWithLogo.filter(e => SERIE_A_NAMES.includes(e.nome));
  const serieBEquipes = equipesWithLogo.filter(e => SERIE_B_NAMES.includes(e.nome));
  const allEquipes = equipesWithLogo;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card md:hidden">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-center gap-3">
            <img src={LOGO_GRUPO} alt="Grupo Palpitão" className="h-12 w-12 rounded-full object-cover" />
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Grupo Palpitão
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center gap-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl w-full">
          {competitions.map((comp) => (
            <Link
              key={comp.path}
              to={comp.path}
              className={`group relative rounded-xl border border-border bg-card p-8 sm:p-10 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:scale-[1.02] ${comp.accent}`}
            >
              <img src={comp.logo} alt={comp.title} className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl bg-black object-cover shadow-lg" />
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold text-foreground transition-colors ${comp.textAccent}`}>
                  {comp.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {comp.subtitle}
                </p>
              </div>
              {/* Team logos */}
              {(() => {
                const logos =
                  comp.path === "/serie-a"
                    ? serieAEquipes
                    : comp.path === "/serie-b"
                      ? serieBEquipes
                      : allEquipes;
                return logos.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                    {logos.map((eq) => (
                      <img
                        key={eq.id}
                        src={eq.logo_url!}
                        alt={eq.nome}
                        className="w-6 h-6 rounded-full object-contain"
                      />
                    ))}
                  </div>
                ) : null;
              })()}
              <span className={`mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors ${comp.textAccent}`}>
                Acessar →
              </span>
            </Link>
          ))}
        </div>

        {/* Galeria de Títulos */}
        <Link
          to="/titulos"
          className="group max-w-5xl w-full rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6 transition-all duration-300 hover:border-amber-500/60 hover:shadow-[0_0_30px_-5px_hsl(38_92%_50%/0.25)]"
        >
          <div className="flex items-center gap-4 lg:w-56 shrink-0">
            <img src={LOGO_GRUPO} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground transition-colors group-hover:text-amber-400">
                Galeria de Títulos
              </h2>
              <p className="text-sm text-muted-foreground">Clubes e jogadores</p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-4 lg:border-l lg:border-border lg:pl-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Campeões {ultimoAno}
              </div>
              <ul className="mt-1 space-y-1">
                {campeoesUltimoAno.map(({ clube, competicoes }) => {
                  const logo = equipes.find((e) => e.nome === clube)?.logo_url;
                  return (
                    <li key={clube} className="flex items-center gap-2">
                      {logo && <img src={logo} alt={clube} className="h-6 w-6 rounded-full object-contain" />}
                      <div className="leading-tight">
                        <div className="font-bold text-foreground">{clube}</div>
                        <div className="whitespace-nowrap text-xs text-muted-foreground">{competicoes.join(" + ")}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            {[
              {
                label: "Maior campeão",
                valor: clubeMaisVitorioso.clube,
                detalhe: `${clubeMaisVitorioso.titulos.length} títulos`,
              },
              {
                label: "Jogador mais vitorioso",
                valor: jogadorMaisVitorioso.jogador,
                detalhe: `${jogadorMaisVitorioso.titulos.length} títulos`,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  {item.label === "Jogador mais vitorioso" && <Crown className="h-3 w-3" />}
                  {item.label}
                </div>
                <div className="mt-1 font-bold text-foreground">{item.valor}</div>
                <div className="text-xs text-muted-foreground">{item.detalhe}</div>
              </div>
            ))}
          </div>

          <span className="hidden lg:flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-amber-400">
            Ver <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
