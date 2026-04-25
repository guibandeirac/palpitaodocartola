import { Trophy, Radio, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const isParciais = location.pathname === "/serie-b/parciais";

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Left nav button */}
          <Link
            to={isParciais ? "/serie-b" : "/"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isParciais ? "Resultados" : "Início"}</span>
          </Link>

          {/* Center title */}
          <Link to="/serie-b" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight text-foreground">
              Champions Série B
            </h1>
          </Link>

          {/* Right nav button */}
          {!isParciais ? (
            <Link
              to="/serie-b/parciais"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Radio className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Parciais</span>
              <span className="sm:hidden">🔴</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </header>
  );
}
