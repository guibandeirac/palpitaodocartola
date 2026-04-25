import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { useCopaConfrontos } from "@/hooks/useCopaConfrontos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { List, Pencil } from "lucide-react";

function floorInt(v: number): number {
  return Math.floor(v);
}

export function AdminCopaGerenciar() {
  const { data: rodadas = [] } = useCopaRodadas();
  const [selectedRodada, setSelectedRodada] = useState<string>("");
  const { data: confrontos = [] } = useCopaConfrontos(selectedRodada);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState<{
    id: string;
    equipe1Nome: string;
    equipe2Nome: string;
    pontuacao_equipe1: number;
    pontuacao_equipe2: number;
  } | null>(null);

  const [newPontos1, setNewPontos1] = useState("");
  const [newPontos2, setNewPontos2] = useState("");

  const handleEdit = (confronto: any) => {
    setEditing({
      id: confronto.id,
      equipe1Nome: confronto.equipe1?.nome || "Equipe 1",
      equipe2Nome: confronto.equipe2?.nome || "Equipe 2",
      pontuacao_equipe1: confronto.pontuacao_equipe1 ?? 0,
      pontuacao_equipe2: confronto.pontuacao_equipe2 ?? 0,
    });
    setNewPontos1(String(confronto.pontuacao_equipe1 ?? 0));
    setNewPontos2(String(confronto.pontuacao_equipe2 ?? 0));
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      const p1 = floorInt(parseFloat(newPontos1) || 0);
      const p2 = floorInt(parseFloat(newPontos2) || 0);

      let resultado: string;
      if (p1 > p2) resultado = "equipe1";
      else if (p2 > p1) resultado = "equipe2";
      else resultado = "empate";

      const { error } = await supabase
        .from("copa_confrontos")
        .update({
          pontuacao_equipe1: p1,
          pontuacao_equipe2: p2,
          resultado,
        })
        .eq("id", editing.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Confronto atualizado!" });
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["copa_confrontos"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || String(error), variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-blue-400" />
            Gerenciar Confrontos da Copa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Selecione a Rodada</label>
            <Select value={selectedRodada} onValueChange={setSelectedRodada}>
              <SelectTrigger className="w-full max-w-xs bg-secondary">
                <SelectValue placeholder="Selecione a rodada" />
              </SelectTrigger>
              <SelectContent>
                {rodadas.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Rodada {r.numero} - {r.fase}{r.fase_detalhe ? ` (${r.fase_detalhe})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRodada && confrontos.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum confronto nesta rodada.</p>
          )}

          <div className="space-y-3">
            {confrontos.map((c) => (
              <div key={c.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className={`font-medium ${c.resultado === "equipe1" ? "text-blue-400" : "text-foreground"}`}>
                    {c.equipe1?.nome}
                  </span>
                  <span className="font-bold text-lg bg-secondary px-2 py-0.5 rounded">
                    {Math.floor(Number(c.pontuacao_equipe1 ?? 0))}
                  </span>
                  <span className="text-muted-foreground text-xs">×</span>
                  <span className="font-bold text-lg bg-secondary px-2 py-0.5 rounded">
                    {Math.floor(Number(c.pontuacao_equipe2 ?? 0))}
                  </span>
                  <span className={`font-medium ${c.resultado === "equipe2" ? "text-blue-400" : "text-foreground"}`}>
                    {c.equipe2?.nome}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Confronto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{editing?.equipe1Nome}</label>
              <Input
                type="number"
                step="0.01"
                value={newPontos1}
                onChange={(e) => setNewPontos1(e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{editing?.equipe2Nome}</label>
              <Input
                type="number"
                step="0.01"
                value={newPontos2}
                onChange={(e) => setNewPontos2(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
