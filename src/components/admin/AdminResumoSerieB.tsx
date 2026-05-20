import { useState, useEffect, useMemo } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClassificacao } from "@/hooks/useClassificacao";
import { useArtilheiros } from "@/hooks/useArtilheiros";
import { usePontuacaoEquipes } from "@/hooks/usePontuacaoEquipes";
import { formatarPontuacao } from "@/lib/pontuacao";
import type { ConfrontoEquipe, ConfrontoIndividual } from "@/hooks/useConfrontosRodada";
import type { ClassificacaoEquipe } from "@/hooks/useClassificacao";
import type { Artilheiro } from "@/hooks/useArtilheiros";
import type { PontuacaoEquipe } from "@/hooks/usePontuacaoEquipes";

// ─── colours ────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0e27",
  card: "#131f3f",
  header: "#36c46e",
  text: "#f7fbff",
  muted: "#a6b1c1",
  border: "#243352",
  secondary: "#1e2d4a",
  winner: "#36c46e",
};

// ─── PDF styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingVertical: 28,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 8,
  },
  headerBlock: {
    backgroundColor: C.card,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.header,
    borderLeftStyle: "solid",
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.header,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 9,
    color: C.muted,
  },
  section: {
    backgroundColor: C.card,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.header,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    paddingBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.secondary,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  tableRowHighlight: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    backgroundColor: "#1a2840",
  },
  th: {
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  td: {
    color: C.text,
    fontSize: 8,
  },
  tdMuted: {
    color: C.muted,
    fontSize: 8,
  },
  tdGreen: {
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  confrontoCard: {
    backgroundColor: C.secondary,
    borderRadius: 5,
    padding: 8,
    marginBottom: 8,
  },
  confrontoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  confrontoEquipeName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    flex: 1,
  },
  confrontoScore: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.header,
    marginHorizontal: 8,
  },
  indRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2840",
    borderBottomStyle: "solid",
  },
  indName: {
    flex: 3,
    fontSize: 7,
    color: C.text,
  },
  indPts: {
    flex: 1.5,
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
  },
  indPtsWinner: {
    flex: 1.5,
    fontSize: 7,
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  indNameRight: {
    flex: 3,
    fontSize: 7,
    color: C.text,
    textAlign: "right",
  },
  smallNote: {
    fontSize: 7,
    color: C.muted,
    marginTop: 6,
    textAlign: "center",
  },
});

// ─── helpers ─────────────────────────────────────────────────────────────────
function getPlayerName(ci: ConfrontoIndividual, side: "1" | "2"): string {
  if (side === "1") {
    return ci.jogador1_efetivo?.nome ?? ci.jogador1_original?.nome ?? "—";
  }
  return ci.jogador2_efetivo?.nome ?? ci.jogador2_original?.nome ?? "—";
}

function formatDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── PDF sub-components ───────────────────────────────────────────────────────

// Confronto card com pontuações e vencedor (rodada jogada)
function ConfrontoCardPDF({ c }: { c: ConfrontoEquipe }) {
  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <Text style={s.confrontoEquipeName}>{c.equipe1.nome}</Text>
        <Text style={s.confrontoScore}>
          {c.vitorias_equipe1 ?? 0} × {c.vitorias_equipe2 ?? 0}
        </Text>
        <Text style={[s.confrontoEquipeName, { textAlign: "right" }]}>
          {c.equipe2.nome}
        </Text>
      </View>
      {c.confrontos_individuais.map((ci) => {
        const p1 = ci.pontuacao_jogador1 ?? 0;
        const p2 = ci.pontuacao_jogador2 ?? 0;
        const venc = ci.vencedor;
        return (
          <View key={ci.id} style={s.indRow}>
            <Text
              style={
                venc === "jogador1"
                  ? [s.indName, { color: C.winner, fontFamily: "Helvetica-Bold" }]
                  : s.indName
              }
            >
              {venc === "jogador1" ? "✓ " : ""}
              {getPlayerName(ci, "1")}
            </Text>
            <Text style={venc === "jogador1" ? s.indPtsWinner : s.indPts}>
              {formatarPontuacao(p1)}
            </Text>
            <Text style={s.tdMuted}>×</Text>
            <Text style={venc === "jogador2" ? s.indPtsWinner : s.indPts}>
              {formatarPontuacao(p2)}
            </Text>
            <Text
              style={
                venc === "jogador2"
                  ? [s.indNameRight, { color: C.winner, fontFamily: "Helvetica-Bold" }]
                  : s.indNameRight
              }
            >
              {getPlayerName(ci, "2")}
              {venc === "jogador2" ? " ✓" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Confronto card sem pontuações (próxima rodada — ainda não jogada)
function ConfrontoCardNextPDF({ c }: { c: ConfrontoEquipe }) {
  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <Text style={s.confrontoEquipeName}>{c.equipe1.nome}</Text>
        <Text style={[s.confrontoScore, { color: C.muted, fontSize: 9 }]}>vs</Text>
        <Text style={[s.confrontoEquipeName, { textAlign: "right" }]}>
          {c.equipe2.nome}
        </Text>
      </View>
      {c.confrontos_individuais.map((ci) => (
        <View key={ci.id} style={s.indRow}>
          <Text style={s.indName}>{getPlayerName(ci, "1")}</Text>
          <Text style={[s.tdMuted, { flex: 0.5, textAlign: "center" }]}>vs</Text>
          <Text style={s.indNameRight}>{getPlayerName(ci, "2")}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── PDF document data type ───────────────────────────────────────────────────
interface SerieBPdfData {
  rodadaNumero: number;
  confrontos: ConfrontoEquipe[];
  classificacao: ClassificacaoEquipe[];
  artilheiros: Artilheiro[];
  pontuacoes: PontuacaoEquipe[];
  proximaRodadaNumero: number | null;
  proximaConfrontos: ConfrontoEquipe[];
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
function SerieBDocument({ data }: { data: SerieBPdfData }) {
  const {
    rodadaNumero,
    confrontos,
    classificacao,
    artilheiros,
    pontuacoes,
    proximaRodadaNumero,
    proximaConfrontos,
  } = data;

  const top10 = artilheiros.slice(0, 10);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Text style={s.headerTitle}>
            Palpitão do Cartola FC · Série B · Rodada {rodadaNumero}
          </Text>
          <Text style={s.headerSub}>{formatDate()}</Text>
        </View>

        {/* ── Resultado da Rodada ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resultado — Rodada {rodadaNumero}</Text>
          {confrontos.map((c) => (
            <ConfrontoCardPDF key={c.id} c={c} />
          ))}
          {confrontos.length === 0 && (
            <Text style={s.tdMuted}>Nenhum confronto encontrado.</Text>
          )}
        </View>

        {/* ── Classificação ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Classificação</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: 22 }]}>POS</Text>
            <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
            <Text style={[s.th, { width: 28, textAlign: "center" }]}>PTS</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>V</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>E</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>D</Text>
            <Text style={[s.th, { width: 36, textAlign: "center" }]}>SALDO</Text>
          </View>
          {classificacao.map((row, idx) => (
            <View
              key={row.id}
              style={idx % 2 === 0 ? s.tableRow : s.tableRowHighlight}
            >
              <Text
                style={[s.td, { width: 22, color: idx < 2 ? C.winner : C.text }]}
              >
                {idx + 1}°
              </Text>
              <Text style={[s.td, { flex: 1 }]}>{row.equipe.nome}</Text>
              <Text style={[s.tdGreen, { width: 28, textAlign: "center" }]}>
                {row.pontos ?? 0}
              </Text>
              <Text style={[s.td, { width: 22, textAlign: "center" }]}>
                {row.vitorias ?? 0}
              </Text>
              <Text style={[s.td, { width: 22, textAlign: "center" }]}>
                {row.empates ?? 0}
              </Text>
              <Text style={[s.td, { width: 22, textAlign: "center" }]}>
                {row.derrotas ?? 0}
              </Text>
              <Text style={[s.td, { width: 36, textAlign: "center" }]}>
                {row.saldo_confrontos ?? 0}
              </Text>
            </View>
          ))}
          {classificacao.length === 0 && (
            <Text style={s.tdMuted}>Nenhum dado de classificação.</Text>
          )}
        </View>

        {/* ── Artilheiros Top 10 — wrap=false mantém a tabela inteira numa só página ── */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Artilheiros — Top 10</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: 20 }]}>#</Text>
            <Text style={[s.th, { flex: 1 }]}>JOGADOR</Text>
            <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
            <Text style={[s.th, { width: 28, textAlign: "center" }]}>V</Text>
          </View>
          {top10.map((art, idx) => (
            <View
              key={art.jogador_id}
              style={idx % 2 === 0 ? s.tableRow : s.tableRowHighlight}
            >
              <Text style={[s.td, { width: 20 }]}>{idx + 1}</Text>
              <Text style={[s.td, { flex: 1 }]}>{art.jogador_nome}</Text>
              <Text style={[s.tdMuted, { flex: 1 }]}>{art.equipe_nome}</Text>
              <Text style={[s.tdGreen, { width: 28, textAlign: "center" }]}>
                {art.vitorias}
              </Text>
            </View>
          ))}
          {top10.length === 0 && (
            <Text style={s.tdMuted}>Nenhum artilheiro registrado.</Text>
          )}
          <Text style={s.smallNote}>
            Artilharia completa: palpitaodocartola.vercel.app/serie-b
          </Text>
        </View>

        {/* ── Pontuação das Equipes ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pontuação das Equipes</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
            <Text style={[s.th, { width: 48, textAlign: "center" }]}>TOTAL</Text>
            <Text style={[s.th, { width: 40, textAlign: "center" }]}>MÉDIA</Text>
            <Text style={[s.th, { width: 52, textAlign: "center" }]}>ÚLT. RODADA</Text>
          </View>
          {pontuacoes.map((p, idx) => (
            <View
              key={p.equipe_id}
              style={idx % 2 === 0 ? s.tableRow : s.tableRowHighlight}
            >
              <Text style={[s.td, { flex: 1 }]}>{p.equipe_nome}</Text>
              <Text style={[s.tdGreen, { width: 48, textAlign: "center" }]}>
                {formatarPontuacao(p.pontuacao_total)}
              </Text>
              <Text style={[s.td, { width: 40, textAlign: "center" }]}>
                {formatarPontuacao(p.media_por_rodada)}
              </Text>
              <Text style={[s.td, { width: 52, textAlign: "center" }]}>
                {formatarPontuacao(p.pontuacao_ultima_rodada)}
              </Text>
            </View>
          ))}
          {pontuacoes.length === 0 && (
            <Text style={s.tdMuted}>Nenhuma pontuação registrada.</Text>
          )}
        </View>

        {/* ── Próxima Rodada com confrontos individuais ── */}
        {proximaRodadaNumero !== null && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionTitle}>
              Próxima Rodada — {proximaRodadaNumero}
            </Text>
            {proximaConfrontos.map((c) => (
              <ConfrontoCardNextPDF key={c.id} c={c} />
            ))}
            {proximaConfrontos.length === 0 && (
              <Text style={s.tdMuted}>Confrontos ainda não definidos.</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ─── Data-fetching helpers ────────────────────────────────────────────────────
interface RodadaFull {
  id: string;
  numero: number;
  status_b: string;
}

function useRodadasFull() {
  return useQuery({
    queryKey: ["rodadas-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rodadas")
        .select("id, numero, status_b")
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as RodadaFull[];
    },
  });
}

function useEquipeSerieBIds() {
  return useQuery({
    queryKey: ["equipes-serie-b-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipes")
        .select("id")
        .eq("serie", "B");
      if (error) throw error;
      return new Set((data ?? []).map((e) => e.id as string));
    },
  });
}

function useConfrontosForRodada(rodadaId: string | null) {
  return useQuery({
    queryKey: ["confrontos-rodada", rodadaId],
    queryFn: async () => {
      if (!rodadaId) return [];
      const { data, error } = await supabase
        .from("confrontos_equipe")
        .select(`
          id,
          vitorias_equipe1,
          vitorias_equipe2,
          resultado,
          equipe1:equipes!confrontos_equipe_equipe1_id_fkey(id, nome, logo_url),
          equipe2:equipes!confrontos_equipe_equipe2_id_fkey(id, nome, logo_url),
          confrontos_individuais(
            id,
            ordem,
            pontuacao_jogador1,
            pontuacao_jogador2,
            vencedor,
            jogador1_efetivo:jogadores!confrontos_individuais_jogador1_efetivo_id_fkey(id, nome, eh_coringa),
            jogador2_efetivo:jogadores!confrontos_individuais_jogador2_efetivo_id_fkey(id, nome, eh_coringa),
            jogador1_original:jogadores!confrontos_individuais_jogador1_original_id_fkey(id, nome),
            jogador2_original:jogadores!confrontos_individuais_jogador2_original_id_fkey(id, nome)
          )
        `)
        .eq("rodada_id", rodadaId);
      if (error) throw error;
      return (data || []).map((c) => ({
        ...c,
        confrontos_individuais: (c.confrontos_individuais || []).sort(
          (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem
        ),
      })) as ConfrontoEquipe[];
    },
    enabled: !!rodadaId,
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminResumoSerieB() {
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | null>(null);
  const [proximaRodadaId, setProximaRodadaId] = useState<string | "none" | null>(null);

  const { data: rodadas = [], isLoading: loadingRodadas } = useRodadasFull();
  const { data: serieBIds, isLoading: loadingIds } = useEquipeSerieBIds();
  const { data: classificacao = [], isLoading: loadingClass } = useClassificacao("B");
  const { data: artilheiros = [], isLoading: loadingArt } = useArtilheiros("B");
  const { data: pontuacoes = [], isLoading: loadingPonts } = usePontuacaoEquipes("B");

  // Rodadas elegíveis para o dropdown principal (finalizada ou em_andamento), ordem decrescente
  const selectableRodadas = useMemo(
    () =>
      [...rodadas]
        .filter(
          (r) => r.status_b === "finalizada" || r.status_b === "em_andamento"
        )
        .sort((a, b) => b.numero - a.numero),
    [rodadas]
  );

  // Auto-seleciona a rodada mais recente quando os dados chegam
  useEffect(() => {
    if (selectedRodadaId === null && selectableRodadas.length > 0) {
      setSelectedRodadaId(selectableRodadas[0].id);
    }
  }, [selectableRodadas, selectedRodadaId]);

  const selectedRodada = useMemo(
    () => rodadas.find((r) => r.id === selectedRodadaId) ?? null,
    [rodadas, selectedRodadaId]
  );

  // Candidatas para próxima rodada: em_andamento ou pendente, número maior que o selecionado
  const proximaRodadaCandidates = useMemo(() => {
    if (!selectedRodada) return [];
    return [...rodadas]
      .filter(
        (r) =>
          r.numero > selectedRodada.numero &&
          (r.status_b === "em_andamento" || r.status_b === "pendente")
      )
      .sort((a, b) => a.numero - b.numero);
  }, [rodadas, selectedRodada]);

  // Auto-seleciona a primeira candidata quando a rodada principal muda
  useEffect(() => {
    if (proximaRodadaCandidates.length > 0) {
      setProximaRodadaId(proximaRodadaCandidates[0].id);
    } else {
      setProximaRodadaId("none");
    }
  }, [selectedRodadaId, proximaRodadaCandidates]);

  const proximaRodada = useMemo(
    () =>
      proximaRodadaId && proximaRodadaId !== "none"
        ? (rodadas.find((r) => r.id === proximaRodadaId) ?? null)
        : null,
    [rodadas, proximaRodadaId]
  );

  const { data: confrontosTodos = [], isLoading: loadingConf } =
    useConfrontosForRodada(selectedRodada?.id ?? null);
  const { data: proximaConfrontosRaw = [], isLoading: loadingProxConf } =
    useConfrontosForRodada(proximaRodada?.id ?? null);

  // Filtra apenas equipes da Série B
  const confrontos = useMemo(
    () =>
      serieBIds
        ? confrontosTodos.filter(
            (c) => serieBIds.has(c.equipe1.id) && serieBIds.has(c.equipe2.id)
          )
        : [],
    [confrontosTodos, serieBIds]
  );

  const proximaConfrontos = useMemo(
    () =>
      serieBIds
        ? proximaConfrontosRaw.filter(
            (c) => serieBIds.has(c.equipe1.id) && serieBIds.has(c.equipe2.id)
          )
        : [],
    [proximaConfrontosRaw, serieBIds]
  );

  const isLoading =
    loadingRodadas ||
    loadingIds ||
    loadingClass ||
    loadingArt ||
    loadingPonts ||
    (!!selectedRodada && loadingConf) ||
    (!!proximaRodada && loadingProxConf);

  const pdfData: SerieBPdfData | null = useMemo(() => {
    if (!selectedRodada) return null;
    return {
      rodadaNumero: selectedRodada.numero,
      confrontos,
      classificacao: classificacao as ClassificacaoEquipe[],
      artilheiros,
      pontuacoes,
      proximaRodadaNumero: proximaRodada?.numero ?? null,
      proximaConfrontos,
    };
  }, [
    selectedRodada,
    confrontos,
    classificacao,
    artilheiros,
    pontuacoes,
    proximaRodada,
    proximaConfrontos,
  ]);

  const fileName = pdfData
    ? `serie-b-rodada-${pdfData.rodadaNumero}.pdf`
    : "serie-b-resumo.pdf";

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Resumo — Série B
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Gere o PDF de resumo para compartilhar após a rodada.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Carregando dados…</span>
          </div>
        ) : selectableRodadas.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma rodada em andamento ou finalizada encontrada para Série B.
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            {/* Seletores de rodada */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Rodada (resultado)
                </label>
                <Select
                  value={selectedRodadaId ?? ""}
                  onValueChange={setSelectedRodadaId}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Selecione a rodada" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRodadas.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Rodada {r.numero}
                        {r.status_b === "em_andamento" ? " (em andamento)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Próxima rodada (no PDF)
                </label>
                <Select
                  value={proximaRodadaId ?? "none"}
                  onValueChange={(v) => setProximaRodadaId(v)}
                  disabled={!selectedRodada}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {proximaRodadaCandidates.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Rodada {r.numero}
                        {r.status_b === "em_andamento" ? " (em andamento)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info */}
            {pdfData && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">Confrontos:</span>{" "}
                  {pdfData.confrontos.length}
                </p>
                <p>
                  <span className="text-foreground font-medium">Artilheiros (top 10):</span>{" "}
                  {Math.min(pdfData.artilheiros.length, 10)}
                </p>
                {pdfData.proximaRodadaNumero && (
                  <p>
                    <span className="text-foreground font-medium">
                      Próxima rodada:
                    </span>{" "}
                    Rodada {pdfData.proximaRodadaNumero} ·{" "}
                    {pdfData.proximaConfrontos.length > 0
                      ? `${pdfData.proximaConfrontos.length} confronto(s)`
                      : "confrontos ainda não definidos"}
                  </p>
                )}
              </div>
            )}

            {pdfData && (
              <PDFDownloadLink
                document={<SerieBDocument data={pdfData} />}
                fileName={fileName}
              >
                {({ loading: pdfLoading }) => (
                  <Button disabled={pdfLoading} className="gap-2">
                    {pdfLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando PDF…
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        Download PDF — Rodada {pdfData.rodadaNumero}
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
