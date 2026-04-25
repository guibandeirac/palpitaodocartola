import { cn } from "@/lib/utils";

interface TeamLogoProps {
  logoUrl: string | null | undefined;
  nome: string;
  size?: "sm" | "md";
  className?: string;
}

export function TeamLogo({ logoUrl, nome, size = "sm", className }: TeamLogoProps) {
  if (!logoUrl) return null;

  const sizeClass = size === "sm" ? "w-5 h-5 sm:w-6 sm:h-6" : "w-7 h-7 sm:w-8 sm:h-8";

  return (
    <img
      src={logoUrl}
      alt={nome}
      className={cn(sizeClass, "rounded-full object-contain flex-shrink-0", className)}
    />
  );
}
