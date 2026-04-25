import { ConfrontoEquipe } from "@/hooks/useConfrontosRodada";
import { ConfrontoCard } from "./ConfrontoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";

interface ConfrontosSectionProps {
  confrontos: ConfrontoEquipe[];
  isLoading: boolean;
  rodadaSelecionada: boolean;
}

export function ConfrontosSection({
  confrontos,
  isLoading,
  rodadaSelecionada,
}: ConfrontosSectionProps) {
  if (!rodadaSelecionada) {
    return (
      <div className="text-center py-12">
        <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Selecione uma rodada para ver os confrontos
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (confrontos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum confronto encontrado para esta rodada
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {confrontos.map((confronto) => (
        <ConfrontoCard key={confronto.id} confronto={confronto} />
      ))}
    </div>
  );
}
