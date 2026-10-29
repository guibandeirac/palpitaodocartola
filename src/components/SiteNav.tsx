import { Home, Landmark, Medal, Radio, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LOGO_GRUPO } from "@/components/CompeticaoIcone";

const ITENS = [
  { to: "/", label: "Início", icon: Home, cor: "text-primary" },
  { to: "/serie-a", label: "Série A", icon: Radio, cor: "text-orange-400" },
  { to: "/serie-b", label: "Série B", icon: Trophy, cor: "text-green-400" },
  { to: "/copa", label: "Copa", icon: Medal, cor: "text-blue-400" },
  { to: "/titulos", label: "Títulos", icon: Landmark, cor: "text-amber-400" },
];

function ativo(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  // Página de clube faz parte da área de títulos
  if (to === "/titulos") return pathname.startsWith("/titulos") || pathname.startsWith("/clubes");
  return pathname.startsWith(to);
}

/** Barra no topo (desktop) e barra de abas embaixo (celular) */
export function SiteNav() {
  const { pathname } = useLocation();

  return (
    <>
      <nav className="sticky top-0 z-40 hidden md:block border-b border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity">
            <img src={LOGO_GRUPO} alt="" className="h-8 w-8 rounded-full object-cover" />
            Grupo Palpitão
          </Link>
          <div className="flex items-center gap-1">
            {ITENS.slice(1).map((item) => {
              const isAtivo = ativo(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isAtivo ? cn("bg-secondary", item.cor) : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {ITENS.map((item) => {
            const isAtivo = ativo(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  isAtivo ? item.cor : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
