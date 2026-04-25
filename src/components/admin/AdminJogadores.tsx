import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEquipes } from "@/hooks/useEquipes";
import { useJogadores, Jogador } from "@/hooks/useJogadores";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Serie } from "@/lib/classificacao";

interface AdminJogadoresProps {
  serie: Serie;
}

export function AdminJogadores({ serie }: AdminJogadoresProps) {
  const { data: equipes = [] } = useEquipes(serie);
  const { data: jogadoresTodos = [] } = useJogadores();
  const equipeIdsSerie = new Set(equipes.map((e) => e.id));
  const jogadores = jogadoresTodos.filter(
    (j) => j.equipe_id && equipeIdsSerie.has(j.equipe_id)
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [nome, setNome] = useState("");
  const [idCartola, setIdCartola] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [ehCoringa, setEhCoringa] = useState(false);
  const [rodadaEntrada, setRodadaEntrada] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingJogador, setEditingJogador] = useState<Jogador | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editIdCartola, setEditIdCartola] = useState("");
  const [editEquipeId, setEditEquipeId] = useState("");
  const [editEhCoringa, setEditEhCoringa] = useState(false);
  const [editRodadaEntrada, setEditRodadaEntrada] = useState("");
  const [editRodadaSaida, setEditRodadaSaida] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  // Delete state
  const [deletingJogador, setDeletingJogador] = useState<string | null>(null);

  // Filter state
  const [filterEquipe, setFilterEquipe] = useState<string>("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !idCartola || !equipeId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("jogadores").insert({
        nome,
        id_cartola: parseInt(idCartola),
        equipe_id: equipeId,
        eh_coringa: ehCoringa,
        rodada_entrada: rodadaEntrada ? parseInt(rodadaEntrada) : 1,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogador criado com sucesso!",
      });

      // Reset form
      setNome("");
      setIdCartola("");
      setEquipeId("");
      setEhCoringa(false);
      setRodadaEntrada("");

      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar jogador",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (jogador: Jogador) => {
    setEditingJogador(jogador);
    setEditNome(jogador.nome);
    setEditIdCartola(jogador.id_cartola.toString());
    setEditEquipeId(jogador.equipe_id || "");
    setEditEhCoringa(jogador.eh_coringa || false);
    setEditAtivo(jogador.ativo !== false);
    setEditRodadaEntrada(jogador.rodada_entrada?.toString() || "");
    setEditRodadaSaida(jogador.rodada_saida?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editingJogador || !editNome || !editIdCartola || !editEquipeId) return;

    try {
      const { error } = await supabase
        .from("jogadores")
        .update({
          nome: editNome,
          id_cartola: parseInt(editIdCartola),
          equipe_id: editEquipeId,
          eh_coringa: editEhCoringa,
          ativo: editAtivo,
          rodada_entrada: editRodadaEntrada ? parseInt(editRodadaEntrada) : null,
          rodada_saida: editRodadaSaida ? parseInt(editRodadaSaida) : null,
        })
        .eq("id", editingJogador.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogador atualizado!",
      });

      setEditingJogador(null);
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar jogador",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingJogador) return;

    try {
      const { error } = await supabase
        .from("jogadores")
        .delete()
        .eq("id", deletingJogador);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogador excluído!",
      });

      setDeletingJogador(null);
      queryClient.invalidateQueries({ queryKey: ["jogadores"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir jogador. Verifique se não está em uso em algum confronto.",
        variant: "destructive",
      });
    }
  };

  const filteredJogadores = filterEquipe === "all"
    ? jogadores
    : jogadores.filter((j) => j.equipe_id === filterEquipe);

  const getEquipeNome = (equipeId: string | null) => {
    return equipes.find((e) => e.id === equipeId)?.nome || "Sem equipe";
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Jogadores — Série {serie}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de criação */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Adicionar Novo Jogador</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Nome</label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do jogador"
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">ID Cartola</label>
                <Input
                  type="number"
                  value={idCartola}
                  onChange={(e) => setIdCartola(e.target.value)}
                  placeholder="Ex: 12345678"
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Equipe</label>
                <Select value={equipeId} onValueChange={setEquipeId}>
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
                <label className="text-xs text-muted-foreground">Coringa</label>
                <div className="flex items-center h-10 gap-2">
                  <Checkbox
                    id="coringa"
                    checked={ehCoringa}
                    onCheckedChange={(checked) => setEhCoringa(!!checked)}
                  />
                  <label htmlFor="coringa" className="text-sm">
                    É coringa
                  </label>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Jogador
            </Button>
          </form>

          {/* Filtro e lista */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Lista de Jogadores</h3>
              <Select value={filterEquipe} onValueChange={setFilterEquipe}>
                <SelectTrigger className="w-48 bg-secondary">
                  <SelectValue placeholder="Filtrar por equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {equipes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              {filteredJogadores.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum jogador encontrado.</p>
              )}
              {filteredJogadores.map((jogador) => (
                <div
                  key={jogador.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md",
                    jogador.ativo === false ? "bg-muted/30 opacity-60" : "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("font-medium", jogador.ativo === false && "line-through text-muted-foreground")}>
                      {jogador.nome}
                    </span>
                    {jogador.ativo === false && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        Inativo
                      </span>
                    )}
                    {jogador.eh_coringa && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        🃏 Coringa
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      | {getEquipeNome(jogador.equipe_id)} | ID: {jogador.id_cartola}
                      {jogador.rodada_entrada && ` | Entrada: R${jogador.rodada_entrada}`}
                      {jogador.rodada_saida && ` | Saída: R${jogador.rodada_saida}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(jogador)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingJogador(jogador.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={!!editingJogador} onOpenChange={() => setEditingJogador(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Jogador</DialogTitle>
            <DialogDescription>
              Atualize as informações do jogador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nome</label>
              <Input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">ID Cartola</label>
              <Input
                type="number"
                value={editIdCartola}
                onChange={(e) => setEditIdCartola(e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Equipe</label>
              <Select value={editEquipeId} onValueChange={setEditEquipeId}>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-coringa"
                checked={editEhCoringa}
                onCheckedChange={(checked) => setEditEhCoringa(!!checked)}
              />
              <label htmlFor="edit-coringa" className="text-sm">
                É coringa
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-ativo"
                checked={editAtivo}
                onCheckedChange={(checked) => setEditAtivo(!!checked)}
              />
              <label htmlFor="edit-ativo" className="text-sm">
                Ativo
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Rodada Entrada</label>
                <Input
                  type="number"
                  value={editRodadaEntrada}
                  onChange={(e) => setEditRodadaEntrada(e.target.value)}
                  placeholder="Ex: 1"
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Rodada Saída</label>
                <Input
                  type="number"
                  value={editRodadaSaida}
                  onChange={(e) => setEditRodadaSaida(e.target.value)}
                  placeholder="Vazio = ativo"
                  className="bg-secondary"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJogador(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para excluir */}
      <AlertDialog open={!!deletingJogador} onOpenChange={() => setDeletingJogador(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Jogador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se o jogador estiver em uso em algum confronto, a exclusão falhará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
