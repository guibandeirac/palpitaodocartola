import { useMemo } from "react";
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
import { FileDown, Loader2, FileText } from "lucide-react";
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { useCopaConfrontos } from "@/hooks/useCopaConfrontos";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import { formatarPontuacao } from "@/lib/pontuacao";
import type { CopaRodada } from "@/hooks/useCopaRodadas";
import type { CopaConfronto } from "@/hooks/useCopaConfrontos";
import type { CopaClassificacaoRow } from "@/hooks/useCopaClassificacao";

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
  blue: "#3b82f6",
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
    borderLeftColor: C.blue,
    borderLeftStyle: "solid",
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
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
    color: C.blue,
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
  tdBlue: {
    color: C.blue,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tdGreen: {
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  // confronto row
  confrontoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  confrontoTeam: {
    flex: 2,
    fontSize: 9,
    color: C.text,
  },
  confrontoTeamRight: {
    flex: 2,
    fontSize: 9,
    color: C.text,
    textAlign: "right",
  },
  confrontoScore: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
    textAlign: "center",
  },
  confrontoResult: {
    width: 56,
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
  },
  proxRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  proxTeam: {
    flex: 1,
    fontSize: 9,
    color: C.text,
    textAlign: "center",
  },
  proxVs: {
    fontSize: 9,
    color: C.muted,
    marginHorizontal: 8,
  },
});

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function faseLabel(rodada: CopaRodada): string {
  if (rodada.fase_detalhe) return `${rodada.fase} — ${rodada.fase_detalhe}`;
  return rodada.fase;
}

function resultadoLabel(resultado: string | null): string {
  if (!resultado) return "—";
  if (resultado === "equipe1") return "Vitória Eq. 1";
  if (resultado === "equipe2") return "Vitória Eq. 2";
  if (resultado === "empate") return "Empate";
  return resultado;
}

// ─── PDF data type ────────────────────────────────────────────────────────────
interface CopaPdfData {
  rodadaNumero: number;
  rodadaFase: string;
  confrontos: CopaConfronto[];
  classificacao: CopaClassificacaoRow[];
  proximaRodadaNumero: number | null;
  proximaFase: string | null;
  proximaConfrontos: Array<{ equipe1Nome: string; equipe2Nome: string }>;
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
function CopaDocument({ data }: { data: CopaPdfData }) {
  const {
    rodadaNumero,
    rodadaFase,
    confrontos,
    classificacao,
    proximaRodadaNumero,
    proximaFase,
    proximaConfrontos,
  } = data;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Text style={s.headerTitle}>
            Palpitão do Cartola FC · Copa · Rodada {rodadaNumero} ({rodadaFase})
          </Text>
          <Text style={s.headerSub}>{formatDate()}</Text>
        </View>

        {/* ── Resultado da Rodada ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resultado — Rodada {rodadaNumero}</Text>
          {confrontos.map((c, idx) => {
            const p1 = c.pontuacao_equipe1;
            const p2 = c.pontuacao_equipe2;
            const isEq1Winner = c.resultado === "equipe1";
            const isEq2Winner = c.resultado === "equipe2";
            return (
              <View
                key={c.id}
                style={idx % 2 === 0 ? s.confrontoRow : { ...s.confrontoRow, backgroundColor: "#1a2840" }}
              >
                <Text
                  style={
                    isEq1Winner
                      ? [s.confrontoTeam, { color: C.winner, fontFamily: "Helvetica-Bold" }]
                      : s.confrontoTeam
                  }
                >
                  {isEq1Winner ? "✓ " : ""}
                  {c.equipe1.nome}
                </Text>
                <Text style={s.confrontoScore}>
                  {p1 !== null ? formatarPontuacao(p1) : "—"} ×{" "}
                  {p2 !== null ? formatarPontuacao(p2) : "—"}
                </Text>
                <Text
                  style={
                    isEq2Winner
                      ? [s.confrontoTeamRight, { color: C.winner, fontFamily: "Helvetica-Bold" }]
                      : s.confrontoTeamRight
                  }
                >
                  {c.equipe2.nome}
                  {isEq2Winner ? " ✓" : ""}
                </Text>
                <Text style={s.confrontoResult}>{resultadoLabel(c.resultado)}</Text>
              </View>
            );
          })}
          {confrontos.length === 0 && (
            <Text style={s.tdMuted}>Nenhum confronto encontrado.</Text>
          )}
        </View>

        {/* ── Classificação Copa ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Classificação Copa</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: 22 }]}>POS</Text>
            <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
            <Text style={[s.th, { width: 28, textAlign: "center" }]}>PTS</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>V</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>E</Text>
            <Text style={[s.th, { width: 22, textAlign: "center" }]}>D</Text>
            <Text style={[s.th, { width: 42, textAlign: "center" }]}>SALDO</Text>
          </View>
          {classificacao.map((row, idx) => (
            <View key={row.id} style={idx % 2 === 0 ? s.tableRow : s.tableRowHighlight}>
              <Text
                style={[s.td, { width: 22, color: idx < 2 ? C.winner : C.text }]}
              >
                {idx + 1}°
              </Text>
              <Text style={[s.td, { flex: 1 }]}>{row.equipe.nome}</Text>
              <Text style={[s.tdBlue, { width: 28, textAlign: "center" }]}>
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
              <Text style={[s.td, { width: 42, textAlign: "center" }]}>
                {formatarPontuacao(row.saldo_pontos ?? 0)}
              </Text>
            </View>
          ))}
          {classificacao.length === 0 && (
            <Text style={s.tdMuted}>Nenhum dado de classificação.</Text>
          )}
        </View>

        {/* ── Próxima Rodada ── */}
        {proximaRodadaNumero !== null && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Próxima Rodada — {proximaRodadaNumero}
              {proximaFase ? ` (${proximaFase})` : ""}
            </Text>
            {proximaConfrontos.map((c, idx) => (
              <View key={idx} style={s.proxRow}>
                <Text style={s.proxTeam}>{c.equipe1Nome}</Text>
                <Text style={s.proxVs}>vs</Text>
                <Text style={s.proxTeam}>{c.equipe2Nome}</Text>
              </View>
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

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminResumoCopa() {
  const { data: rodadas = [], isLoading: loadingRodadas } = useCopaRodadas();
  const { data: classificacao = [], isLoading: loadingClass } = useCopaClassificacao();

  // Current rodada: em_andamento first, else last finalizada
  const currentRodada: CopaRodada | null = useMemo(() => {
    const emAndamento = rodadas.filter((r) => r.status === "em_andamento");
    if (emAndamento.length > 0) return emAndamento[emAndamento.length - 1];
    const finalizadas = rodadas.filter((r) => r.status === "finalizada");
    if (finalizadas.length > 0) return finalizadas[finalizadas.length - 1];
    return null;
  }, [rodadas]);

  // Next rodada: first pendente
  const proximaRodada: CopaRodada | null = useMemo(() => {
    return rodadas.find((r) => r.status === "pendente") ?? null;
  }, [rodadas]);

  const { data: confrontos = [], isLoading: loadingConf } = useCopaConfrontos(
    currentRodada?.id ?? null
  );
  const { data: proximaConfrontosRaw = [], isLoading: loadingProxConf } =
    useCopaConfrontos(proximaRodada?.id ?? null);

  const proximaConfrontos = useMemo(
    () =>
      proximaConfrontosRaw.map((c) => ({
        equipe1Nome: c.equipe1.nome,
        equipe2Nome: c.equipe2.nome,
      })),
    [proximaConfrontosRaw]
  );

  const isLoading =
    loadingRodadas || loadingClass || loadingConf || loadingProxConf;

  const pdfData: CopaPdfData | null = useMemo(() => {
    if (!currentRodada) return null;
    return {
      rodadaNumero: currentRodada.numero,
      rodadaFase: faseLabel(currentRodada),
      confrontos,
      classificacao: classificacao as CopaClassificacaoRow[],
      proximaRodadaNumero: proximaRodada?.numero ?? null,
      proximaFase: proximaRodada ? faseLabel(proximaRodada) : null,
      proximaConfrontos,
    };
  }, [currentRodada, confrontos, classificacao, proximaRodada, proximaConfrontos]);

  const fileName = pdfData
    ? `copa-rodada-${pdfData.rodadaNumero}.pdf`
    : "copa-resumo.pdf";

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Resumo — Copa
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Gere o PDF de resumo da Copa para compartilhar após a rodada.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="text-muted-foreground">Carregando dados…</span>
          </div>
        ) : !pdfData ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma rodada em andamento ou finalizada encontrada para a Copa.
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="text-foreground font-medium">Rodada atual:</span>{" "}
                Rodada {pdfData.rodadaNumero} ({pdfData.rodadaFase})
              </p>
              {pdfData.proximaRodadaNumero && (
                <p>
                  <span className="text-foreground font-medium">Próxima rodada:</span>{" "}
                  Rodada {pdfData.proximaRodadaNumero}
                  {pdfData.proximaFase ? ` (${pdfData.proximaFase})` : ""}
                </p>
              )}
              <p>
                <span className="text-foreground font-medium">Confrontos:</span>{" "}
                {pdfData.confrontos.length}
              </p>
              <p>
                <span className="text-foreground font-medium">Equipes na classificação:</span>{" "}
                {pdfData.classificacao.length}
              </p>
            </div>
            <PDFDownloadLink
              document={<CopaDocument data={pdfData} />}
              fileName={fileName}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  disabled={pdfLoading}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
