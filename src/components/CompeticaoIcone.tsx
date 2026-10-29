import { cn } from "@/lib/utils";
import { COMPETICOES, CompeticaoId } from "@/data/titulos";

export const LOGO_GRUPO = "/logos/logo-grupo.jpg";

interface CompeticaoIconeProps {
  competicao: CompeticaoId;
  /** Classes de tamanho, ex.: "h-6 w-6" */
  className?: string;
}

/** Logo da competição (fundo preto, recortado em quadrado arredondado) ou o emoji quando não tem logo */
export function CompeticaoIcone({ competicao, className = "h-5 w-5" }: CompeticaoIconeProps) {
  const comp = COMPETICOES[competicao];
  if (!comp.logo) {
    return <span className={cn("inline-flex items-center justify-center leading-none", className)}>{comp.emoji}</span>;
  }
  return (
    <img
      // Versão recortada no emblema (public/logos/icones), legível em tamanho pequeno
      src={comp.logo.replace("/logos/", "/logos/icones/")}
      alt={comp.nome}
      title={comp.nome}
      loading="lazy"
      className={cn("inline-block shrink-0 rounded-md bg-black object-cover", className)}
    />
  );
}
