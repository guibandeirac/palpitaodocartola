import { useState } from "react";
import { useCopaPlayoffs, CopaPlayoff } from "@/hooks/useCopaPlayoffs";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { useEquipes } from "@/hooks/useEquipes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, Wand2, Save } from "lucide-react";

const FASES = [
  { value: "repescagem", label: "Repescagem", chaves: [null] },
  { value: "quartas", label: "Quartas de Final", chaves: ["A", "B"] },
  { value: "semifinal", label: "Semifinal", chaves: ["A", "B"] },
  { value: "final", label: "Final", chaves: [null] },
];

export function AdminCopaPlayoffs() {
  const { data: playoffs = [], isLoading } = useCopaPlayoffs();
  const { data: classificacao = [] } = useCopaClassificacao();
  const { data: rodadas = [] } = useCopaRodadas();
  const { data: equipes = [] } = useEquipes();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // Sort classificacao by pontos desc, saldo desc, pp desc
  const sortedClassificacao = [...classificacao].sort((a, b) => {
    if ((b.pontos ?? 0) !== (a.pontos ?? 0)) return (b.pontos ?? 0) - (a.pontos ?? 0);
    if ((b.saldo_pontos ?? 0) !== (a.saldo_pontos ?? 0)) return (b.saldo_pontos ?? 0) - (a.saldo_pontos ?? 0);
    return (b.pontos_pro ?? 0) - (a.pontos_pro ?? 0);
  });

  const handleGeneratePlayoffs = async () => {
    if (sortedClassificacao.length < 7) {
      toast({ title: "Classificação insuficiente", description: "Precisa de pelo menos 7 equipes na classificação", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Delete existing playoffs
      await supabase.from("copa_playoffs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const getEquipeId = (pos: number) => sortedClassificacao[pos]?.equipe_id;

      // Create repescagem: 6º x 7º (single leg)
      await supabase.from("copa_playoffs").insert({
        fase: "repescagem",
        chave: null,
        equipe1_id: getEquipeId(5),
        equipe2_id: getEquipeId(6),
      });

      // Create quartas A: 3º x vencedor repescagem (ida e volta)
      await supabase.from("copa_playoffs").insert({
        fase: "quartas",
        chave: "A",
        equipe1_id: getEquipeId(2),
        equipe2_id: null, // filled after repescagem
      });

      // Create quartas B: 4º x 5º (ida e volta)
      await supabase.from("copa_playoffs").insert({
        fase: "quartas",
        chave: "B",
        equipe1_id: getEquipeId(3),
        equipe2_id: getEquipeId(4),
      });

      // Create semifinal A: 1º x vencedor quartas B
      await supabase.from("copa_playoffs").insert({
        fase: "semifinal",
        chave: "A",
        equipe1_id: getEquipeId(0),
        equipe2_id: null,
      });

      // Create semifinal B: 2º x vencedor quartas A
      await supabase.from("copa_playoffs").insert({
        fase: "semifinal",
        chave: "B",
        equipe1_id: getEquipeId(1),
        equipe2_id: null,
      });

      // Create final
      await supabase.from("copa_playoffs").insert({
        fase: "final",
        chave: null,
        equipe1_id: null,
        equipe2_id: null,
      });

      queryClient.invalidateQueries({ queryKey: ["copa_playoffs"] });
      toast({ title: "Playoffs gerados!", description: "Chaveamento criado com base na classificação" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = (playoff: CopaPlayoff) => {
    setEditingId(playoff.id);
    setEditValues({
      equipe1_id: playoff.equipe1_id || "",
      equipe2_id: playoff.equipe2_id || "",
      pontuacao_equipe1_ida: playoff.pontuacao_equipe1_ida ?? "",
      pontuacao_equipe1_volta: playoff.pontuacao_equipe1_volta ?? "",
      pontuacao_equipe2_ida: playoff.pontuacao_equipe2_ida ?? "",
      pontuacao_equipe2_volta: playoff.pontuacao_equipe2_volta ?? "",
      vencedor_id: playoff.vencedor_id || "",
      rodada_ida_id: playoff.rodada_ida_id || "",
      rodada_volta_id: playoff.rodada_volta_id || "",
    });
  };

  const handleSave = async (playoffId: string) => {
    const v = editValues;
    const isSingleLeg = playoffs.find(p => p.id === playoffId)?.fase === "repescagem" ||
                         playoffs.find(p => p.id === playoffId)?.fase === "final";

    const p1Ida = v.pontuacao_equipe1_ida !== "" ? Number(v.pontuacao_equipe1_ida) : null;
    const p2Ida = v.pontuacao_equipe2_ida !== "" ? Number(v.pontuacao_equipe2_ida) : null;
    const p1Volta = v.pontuacao_equipe1_volta !== "" ? Number(v.pontuacao_equipe1_volta) : null;
    const p2Volta = v.pontuacao_equipe2_volta !== "" ? Number(v.pontuacao_equipe2_volta) : null;

    let p1Total: number | null = null;
    let p2Total: number | null = null;

    if (isSingleLeg) {
      p1Total = p1Ida;
      p2Total = p2Ida;
    } else if (p1Ida != null && p1Volta != null) {
      p1Total = Math.round((p1Ida + p1Volta) * 100) / 100;
    }
    if (!isSingleLeg && p2Ida != null && p2Volta != null) {
      p2Total = Math.round((p2Ida + p2Volta) * 100) / 100;
    }

    const update: any = {
      equipe1_id: v.equipe1_id || null,
      equipe2_id: v.equipe2_id || null,
      pontuacao_equipe1_ida: p1Ida,
      pontuacao_equipe1_volta: isSingleLeg ? null : p1Volta,
      pontuacao_equipe1_total: p1Total,
      pontuacao_equipe2_ida: p2Ida,
      pontuacao_equipe2_volta: isSingleLeg ? null : p2Volta,
      pontuacao_equipe2_total: p2Total,
      vencedor_id: v.vencedor_id || null,
      rodada_ida_id: v.rodada_ida_id || null,
      rodada_volta_id: v.rodada_volta_id || null,
    };

    const { error } = await supabase.from("copa_playoffs").update(update).eq("id", playoffId);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["copa_playoffs"] });
    }
  };

  const faseOrder = ["repescagem", "quartas", "semifinal", "final"];
  const sortedPlayoffs = [...playoffs].sort((a, b) => {
    const fa = faseOrder.indexOf(a.fase);
    const fb = faseOrder.indexOf(b.fase);
    if (fa !== fb) return fa - fb;
    return (a.chave || "").localeCompare(b.chave || "");
  });

  const faseLabel: Record<string, string> = {
    repescagem: "Repescagem",
    quartas: "Quartas de Final",
    semifinal: "Semifinal",
    final: "Final",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-400" />
          Playoffs
        </h3>
        <Button onClick={handleGeneratePlayoffs} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
          <Wand2 className="h-4 w-4 mr-2" />
          {isGenerating ? "Gerando..." : "Gerar Chaveamento"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : sortedPlayoffs.length === 0 ? (
        <p className="text-muted-foreground">Nenhum playoff cadastrado. Clique em "Gerar Chaveamento" para criar com base na classificação.</p>
      ) : (
        <div className="space-y-4">
          {sortedPlayoffs.map((playoff) => {
            const isEditing = editingId === playoff.id;
            const isSingleLeg = playoff.fase === "repescagem" || playoff.fase === "final";
            const label = `${faseLabel[playoff.fase] || playoff.fase}${playoff.chave ? ` — Chave ${playoff.chave}` : ""}`;

            return (
              <Card key={playoff.id} className="border-blue-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm text-blue-400">{label}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {!isEditing ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={playoff.vencedor_id === playoff.equipe1_id ? "font-bold text-blue-400" : ""}>
                          {playoff.equipe1?.nome || "A definir"}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {isSingleLeg
                            ? (playoff.pontuacao_equipe1_total != null ? formatNum(playoff.pontuacao_equipe1_total) : "-")
                            : `${formatNum(playoff.pontuacao_equipe1_ida)} / ${formatNum(playoff.pontuacao_equipe1_volta)} = ${formatNum(playoff.pontuacao_equipe1_total)}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={playoff.vencedor_id === playoff.equipe2_id ? "font-bold text-blue-400" : ""}>
                          {playoff.equipe2?.nome || "A definir"}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {isSingleLeg
                            ? (playoff.pontuacao_equipe2_total != null ? formatNum(playoff.pontuacao_equipe2_total) : "-")
                            : `${formatNum(playoff.pontuacao_equipe2_ida)} / ${formatNum(playoff.pontuacao_equipe2_volta)} = ${formatNum(playoff.pontuacao_equipe2_total)}`
                          }
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => startEditing(playoff)}>Editar</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Equipe selectors */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Equipe 1</label>
                          <Select value={editValues.equipe1_id} onValueChange={(v) => setEditValues({ ...editValues, equipe1_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {equipes.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Equipe 2</label>
                          <Select value={editValues.equipe2_id} onValueChange={(v) => setEditValues({ ...editValues, equipe2_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {equipes.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Pts E1 Ida</label>
                          <Input type="number" step="0.01" value={editValues.pontuacao_equipe1_ida}
                            onChange={e => setEditValues({ ...editValues, pontuacao_equipe1_ida: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Pts E2 Ida</label>
                          <Input type="number" step="0.01" value={editValues.pontuacao_equipe2_ida}
                            onChange={e => setEditValues({ ...editValues, pontuacao_equipe2_ida: e.target.value })} />
                        </div>
                      </div>
                      {!isSingleLeg && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Pts E1 Volta</label>
                            <Input type="number" step="0.01" value={editValues.pontuacao_equipe1_volta}
                              onChange={e => setEditValues({ ...editValues, pontuacao_equipe1_volta: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Pts E2 Volta</label>
                            <Input type="number" step="0.01" value={editValues.pontuacao_equipe2_volta}
                              onChange={e => setEditValues({ ...editValues, pontuacao_equipe2_volta: e.target.value })} />
                          </div>
                        </div>
                      )}

                      {/* Rodadas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Rodada Ida</label>
                          <Select value={editValues.rodada_ida_id} onValueChange={(v) => setEditValues({ ...editValues, rodada_ida_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {rodadas.map(r => (
                                <SelectItem key={r.id} value={r.id}>Rodada {r.numero}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {!isSingleLeg && (
                          <div>
                            <label className="text-xs text-muted-foreground">Rodada Volta</label>
                            <Select value={editValues.rodada_volta_id} onValueChange={(v) => setEditValues({ ...editValues, rodada_volta_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {rodadas.map(r => (
                                  <SelectItem key={r.id} value={r.id}>Rodada {r.numero}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Vencedor */}
                      <div>
                        <label className="text-xs text-muted-foreground">Vencedor</label>
                        <Select value={editValues.vencedor_id} onValueChange={(v) => setEditValues({ ...editValues, vencedor_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione o vencedor" /></SelectTrigger>
                          <SelectContent>
                            {editValues.equipe1_id && equipes.find(e => e.id === editValues.equipe1_id) && (
                              <SelectItem value={editValues.equipe1_id}>{equipes.find(e => e.id === editValues.equipe1_id)?.nome}</SelectItem>
                            )}
                            {editValues.equipe2_id && equipes.find(e => e.id === editValues.equipe2_id) && (
                              <SelectItem value={editValues.equipe2_id}>{equipes.find(e => e.id === editValues.equipe2_id)?.nome}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(playoff.id)} className="bg-blue-600 hover:bg-blue-700">
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatNum(v: number | null | undefined): string {
  if (v == null) return "-";
  return (Math.round(v * 100) / 100).toFixed(2);
}
