import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rodada } from "@/hooks/useRodadas";
import { Skeleton } from "@/components/ui/skeleton";

interface RodadaSelectorProps {
  rodadas: Rodada[];
  selectedRodada: string | null;
  onSelect: (rodadaId: string) => void;
  isLoading: boolean;
}

export function RodadaSelector({
  rodadas,
  selectedRodada,
  onSelect,
  isLoading,
}: RodadaSelectorProps) {
  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  return (
    <Select value={selectedRodada || ""} onValueChange={onSelect}>
      <SelectTrigger className="w-48 bg-card">
        <SelectValue placeholder="Selecione uma rodada" />
      </SelectTrigger>
      <SelectContent>
        {rodadas.map((rodada) => (
          <SelectItem key={rodada.id} value={rodada.id}>
            Rodada {rodada.numero}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
