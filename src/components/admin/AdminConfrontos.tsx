import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRodadas } from "@/hooks/useRodadas";
import { useEquipes } from "@/hooks/useEquipes";
import { useJogadoresByEquipe } from "@/hooks/useJogadores";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Swords, Plus, Users } from "lucide-react";
import type { Serie } from "@/lib/classificacao";

interface AdminConfrontosProps {
  serie: Serie;
}

export function AdminConfrontos({ serie }: AdminConfrontosProps) {
  const { data: rodadas = [] } = useRodadas();
  const { data: equipes = [] } = useEquipes(serie);
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const [equipe1Id, setEquipe1Id] = useState<string>("");
  const [equipe2Id, setEquipe2Id] = useState<string>("");
  const [confrontoEquipeId, setConfrontoEquipeId] = useState<string>("");
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState<
    Array<{ jogador1Id: string; jogador2Id: string }>
  >([
    { jogador1Id: "", jogador2Id: "" },
    { jogador1Id: "", jogador2Id: "" },
    { jogador1Id: "", jogador2Id: "" },
    { jogador1Id: "", jogador2Id: "" },
    { jogador1Id: "", jogador2Id: "" },
    { jogador1Id: "", jogador2Id: "" },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: jogadoresEquipe1 = [] } = useJogadoresByEquipe(equipe1Id);
  const { data: jogadoresEquipe2 = [] } = useJogadoresByEquipe(equipe2Id);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCriarConfrontoEquipe = async () => {
    if (!selectedRodada || !equipe1Id || !equipe2Id) {
      toast({
        title: "Erro",
        description: "Selecione a rodada e as duas equipes",
        variant: "destructive",
      });
      return;
    }

    if (equipe1Id === equipe2Id) {
      toast({
        title: "Erro",
        description: "As duas equipes não podem ser iguais",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Checar se já existe confronto entre essas duas equipes nesta rodada (em qualquer ordem)
      const { data: existentes, error: checkError } = await supabase
        .from("confrontos_equipe")
        .select("id, equipe1_id, equipe2_id")
        .eq("rodada_id", selectedRodada)
        .or(
          `and(equipe1_id.eq.${equipe1Id},equipe2_id.eq.${equipe2Id}),and(equipe1_id.eq.${equipe2Id},equipe2_id.eq.${equipe1Id})`
        );

      if (checkError) throw checkError;

      if (existentes && existentes.length > 0) {
        const nome1 = equipes.find((e) => e.id === equipe1Id)?.nome || "Equipe 1";
        const nome2 = equipes.find((e) => e.id === equipe2Id)?.nome || "Equipe 2";
        toast({
          title: "Confronto já existe",
          description: `Já há um confronto entre ${nome1} e ${nome2} nesta rodada. Edite pela aba "Gerenciar" ou escolha outras equipes.`,
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      const { data, error } = await supabase
        .from("confrontos_equipe")
        .insert({
          rodada_id: selectedRodada,
          equipe1_id: equipe1Id,
          equipe2_id: equipe2Id,
          vitorias_equipe1: 0,
          vitorias_equipe2: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setConfrontoEquipeId(data.id);
      toast({
        title: "Sucesso",
        description: "Confronto de equipe criado! Agora defina os confrontos individuais.",
      });

      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar confronto de equipe",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCriarConfrontosIndividuais = async () => {
    if (!confrontoEquipeId) {
      toast({
        title: "Erro",
        description: "Crie primeiro o confronto de equipe",
        variant: "destructive",
      });
      return;
    }

    // Verificar se todos os jogadores foram selecionados
    const incompletos = jogadoresSelecionados.some(
      (j) => !j.jogador1Id || !j.jogador2Id
    );
    if (incompletos) {
      toast({
        title: "Erro",
        description: "Selecione todos os 6 pares de jogadores",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const confrontosParaInserir = jogadoresSelecionados.map((j, index) => ({
        confronto_equipe_id: confrontoEquipeId,
        jogador1_original_id: j.jogador1Id,
        jogador2_original_id: j.jogador2Id,
        jogador1_efetivo_id: j.jogador1Id,
        jogador2_efetivo_id: j.jogador2Id,
        ordem: index + 1,
        pontuacao_jogador1: 0,
        pontuacao_jogador2: 0,
      }));

      const { error } = await supabase
        .from("confrontos_individuais")
        .insert(confrontosParaInserir);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Confrontos individuais criados com sucesso!",
      });

      // Resetar estado
      setConfrontoEquipeId("");
      setEquipe1Id("");
      setEquipe2Id("");
      setJogadoresSelecionados([
        { jogador1Id: "", jogador2Id: "" },
        { jogador1Id: "", jogador2Id: "" },
        { jogador1Id: "", jogador2Id: "" },
        { jogador1Id: "", jogador2Id: "" },
        { jogador1Id: "", jogador2Id: "" },
        { jogador1Id: "", jogador2Id: "" },
      ]);

      queryClient.invalidateQueries({ queryKey: ["confrontos-rodada"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar confrontos individuais",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateJogador = (
    index: number,
    lado: "jogador1Id" | "jogador2Id",
    value: string
  ) => {
    const updated = [...jogadoresSelecionados];
    updated[index] = { ...updated[index], [lado]: value };
    setJogadoresSelecionados(updated);
  };

  // Filtrar jogadores titulares (não coringas)
  const titularesEquipe1 = jogadoresEquipe1.filter((j) => !j.eh_coringa);
  const titularesEquipe2 = jogadoresEquipe2.filter((j) => !j.eh_coringa);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Criar Confronto — Série {serie}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de rodada */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Rodada</label>
          <Select value={selectedRodada} onValueChange={setSelectedRodada}>
            <SelectTrigger className="w-full bg-secondary">
              <SelectValue placeholder="Selecione a rodada" />
            </SelectTrigger>
            <SelectContent>
              {rodadas.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  Rodada {r.numero} (Cartola {r.rodada_cartola})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Criar confronto de equipe */}
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Equipe 1</label>
            <Select value={equipe1Id} onValueChange={setEquipe1Id}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Equipe 2</label>
            <Select value={equipe2Id} onValueChange={setEquipe2Id}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {equipes.filter((e) => e.id !== equipe1Id).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCriarConfrontoEquipe}
            disabled={isCreating || !selectedRodada || !equipe1Id || !equipe2Id}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Confronto
          </Button>
        </div>

        {/* Confrontos individuais */}
        {confrontoEquipeId && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Confrontos Individuais</h3>
            </div>

            {jogadoresSelecionados.map((par, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-4 p-3 bg-secondary/30 rounded-lg">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Jogador {index + 1} - {equipes.find((e) => e.id === equipe1Id)?.nome}
                  </label>
                  <Select
                    value={par.jogador1Id}
                    onValueChange={(v) => updateJogador(index, "jogador1Id", v)}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Selecione jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {titularesEquipe1.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Jogador {index + 1} - {equipes.find((e) => e.id === equipe2Id)?.nome}
                  </label>
                  <Select
                    value={par.jogador2Id}
                    onValueChange={(v) => updateJogador(index, "jogador2Id", v)}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Selecione jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {titularesEquipe2.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Button
              onClick={handleCriarConfrontosIndividuais}
              disabled={isCreating}
              className="w-full"
            >
              Salvar Confrontos Individuais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
