import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { useEquipes } from "@/hooks/useEquipes";

const competitions = [
  {
    title: "Champions Série A",
    subtitle: "Somente ao vivo",
    path: "/serie-a",
    emoji: "🥅",
    accent: "hover:border-orange-500/60 hover:shadow-[0_0_30px_-5px_hsl(25_95%_53%/0.25)]",
    textAccent: "group-hover:text-orange-400",
  },
  {
    title: "Champions Série B",
    subtitle: "2026",
    path: "/serie-b",
    emoji: "🏆",
    accent: "hover:border-green-500/60 hover:shadow-[0_0_30px_-5px_hsl(142_76%_36%/0.25)]",
    textAccent: "group-hover:text-green-400",
  },
  {
    title: "Copa Palpitão",
    subtitle: "2026",
    path: "/copa",
    emoji: "🏅",
    accent: "hover:border-blue-500/60 hover:shadow-[0_0_30px_-5px_hsl(217_91%_60%/0.25)]",
    textAccent: "group-hover:text-blue-400",
  },
];

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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Grupo Palpitão
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl w-full">
          {competitions.map((comp) => (
            <Link
              key={comp.path}
              to={comp.path}
              className={`group relative rounded-xl border border-border bg-card p-8 sm:p-10 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:scale-[1.02] ${comp.accent}`}
            >
              <span className="text-5xl sm:text-6xl">{comp.emoji}</span>
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
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
