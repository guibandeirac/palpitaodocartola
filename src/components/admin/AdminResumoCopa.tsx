import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
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
import { useCopaRodadas } from "@/hooks/useCopaRodadas";
import { useCopaConfrontos } from "@/hooks/useCopaConfrontos";
import { useCopaClassificacao } from "@/hooks/useCopaClassificacao";
import type { CopaRodada } from "@/hooks/useCopaRodadas";
import type { CopaConfronto } from "@/hooks/useCopaConfrontos";
import type { CopaClassificacaoRow } from "@/hooks/useCopaClassificacao";

// ─── colours ────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  card: "#161b22",
  accent: "#3b82f6",
  accentDim: "#1a2a4a",
  accentBorder: "#2563eb",
  text: "#e6edf3",
  muted: "#8b949e",
  border: "#30363d",
  secondary: "#21262d",
  winner: "#3fb950",
  gold: "#f0b429",
  silver: "#8b949e",
  bronze: "#c9742e",
  dimBg: "#1c2128",
};

const APP_LOGO =
  typeof window !== "undefined"
    ? window.location.origin + "/icon.png"
    : "/icon.png";

// ─── PDF styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 10,
  },
  // ── header ──
  headerBlock: {
    backgroundColor: C.card,
    borderRadius: 8,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  headerAccent: {
    backgroundColor: C.accent,
    height: 4,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  headerLogoWrap: {
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 11,
    color: C.muted,
  },
  headerBadge: {
    backgroundColor: C.accentDim,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderStyle: "solid",
  },
  headerBadgeText: {
    color: C.accent,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // ── sections ──
  section: {
    backgroundColor: C.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    gap: 8,
  },
  sectionAccentBar: {
    width: 3,
    height: 14,
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  // ── tables ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.secondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    alignItems: "center",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    backgroundColor: C.dimBg,
    alignItems: "center",
  },
  th: {
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  td: {
    color: C.text,
    fontSize: 10,
  },
  tdMuted: {
    color: C.muted,
    fontSize: 10,
  },
  tdBlue: {
    color: C.accent,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tdGreen: {
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  // ── confronto card ──
  confrontoCard: {
    backgroundColor: C.secondary,
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  confrontoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  confrontoTeamBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  confrontoTeamBlockRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
  },
  confrontoEquipeName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    flex: 1,
  },
  confrontoEquipeNameRight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    flex: 1,
    textAlign: "right",
  },
  confrontoScoreBlock: {
    backgroundColor: C.bg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  confrontoScore: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
  },
  confrontoResultBar: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  confrontoResultText: {
    fontSize: 8,
    color: C.muted,
  },
  confrontoResultTextWinner: {
    fontSize: 8,
    color: C.winner,
    fontFamily: "Helvetica-Bold",
  },
  // ── position badge ──
  posBadge: {
    height: 18,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
    paddingHorizontal: 4,
  },
  posBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0a0e27",
  },
  posText: {
    fontSize: 10,
    color: C.muted,
  },
  classTeamRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  // ── footer ──
  footer: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerPage: {
    fontSize: 8,
    color: C.muted,
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

// Formata pontos sem zeros decimais desnecessários: 100.00 → "100", 76.38 → "76.38"
function formatPts(valor: number | null): string {
  if (valor === null) return "—";
  return String(parseFloat((Math.round(valor * 100) / 100).toFixed(2)));
}

function posColor(idx: number): string {
  if (idx === 0) return C.gold;
  if (idx === 1) return C.silver;
  if (idx === 2) return C.bronze;
  return "";
}

// ─── PDF sub-components ───────────────────────────────────────────────────────

function TeamLogo({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: C.secondary,
        borderRadius: size / 2,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.border,
        borderStyle: "solid",
      }}
    >
      <Text style={{ fontSize: size * 0.36, color: C.muted, fontFamily: "Helvetica-Bold" }}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <View style={s.sectionTitleRow}>
      <View style={s.sectionAccentBar} />
      <Text style={s.sectionTitle}>{children}</Text>
    </View>
  );
}

function ConfrontoCardPDF({ c }: { c: CopaConfronto }) {
  const p1 = c.pontuacao_equipe1;
  const p2 = c.pontuacao_equipe2;
  const isEq1Winner = c.resultado === "equipe1";
  const isEq2Winner = c.resultado === "equipe2";
  const isEmpate = c.resultado === "empate";

  let resultLabel = "";
  if (isEq1Winner) resultLabel = `Vitória: ${c.equipe1.nome}`;
  else if (isEq2Winner) resultLabel = `Vitória: ${c.equipe2.nome}`;
  else if (isEmpate) resultLabel = "Empate";

  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <View style={s.confrontoTeamBlock}>
          <TeamLogo url={c.equipe1.logo_url} name={c.equipe1.nome} size={30} />
          <Text
            style={
              isEq1Winner
                ? [s.confrontoEquipeName, { color: C.winner }]
                : s.confrontoEquipeName
            }
          >
            {isEq1Winner ? "✓ " : ""}
            {c.equipe1.nome}
          </Text>
        </View>
        <View style={s.confrontoScoreBlock}>
          <Text style={s.confrontoScore}>
            {formatPts(p1)} × {formatPts(p2)}
          </Text>
        </View>
        <View style={s.confrontoTeamBlockRight}>
          <Text
            style={
              isEq2Winner
                ? [s.confrontoEquipeNameRight, { color: C.winner }]
                : s.confrontoEquipeNameRight
            }
          >
            {c.equipe2.nome}
            {isEq2Winner ? " ✓" : ""}
          </Text>
          <TeamLogo url={c.equipe2.logo_url} name={c.equipe2.nome} size={30} />
        </View>
      </View>
      {resultLabel !== "" && (
        <View style={s.confrontoResultBar}>
          <Text style={isEmpate ? s.confrontoResultText : s.confrontoResultTextWinner}>
            {resultLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

function ConfrontoCardNextPDF({ c }: { c: CopaConfronto }) {
  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <View style={s.confrontoTeamBlock}>
          <TeamLogo url={c.equipe1.logo_url} name={c.equipe1.nome} size={30} />
          <Text style={s.confrontoEquipeName}>{c.equipe1.nome}</Text>
        </View>
        <View style={s.confrontoScoreBlock}>
          <Text style={[s.confrontoScore, { color: C.muted, fontSize: 11 }]}>vs</Text>
        </View>
        <View style={s.confrontoTeamBlockRight}>
          <Text style={s.confrontoEquipeNameRight}>{c.equipe2.nome}</Text>
          <TeamLogo url={c.equipe2.logo_url} name={c.equipe2.nome} size={30} />
        </View>
      </View>
    </View>
  );
}

// ─── PDF data type ────────────────────────────────────────────────────────────
interface CopaPdfData {
  rodadaNumero: number;
  rodadaFase: string;
  confrontos: CopaConfronto[];
  classificacao: CopaClassificacaoRow[];
  proximaRodadaNumero: number | null;
  proximaFase: string | null;
  proximaConfrontos: CopaConfronto[];
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
          <View style={s.headerAccent} />
          <View style={s.headerInner}>
            <View style={s.headerLogoWrap}>
              <Image src={APP_LOGO} style={s.headerLogo} />
            </View>
            <View style={s.headerTextBlock}>
              <Text style={s.headerTitle}>Palpitão do Cartola FC</Text>
              <Text style={s.headerSub}>
                {rodadaFase} · Rodada {rodadaNumero} · {formatDate()}
              </Text>
            </View>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>COPA</Text>
            </View>
          </View>
        </View>

        {/* ── Resultado da Rodada ── */}
        <View style={s.section}>
          <SectionTitle>Resultado — Rodada {rodadaNumero}</SectionTitle>
          {confrontos.map((c) => (
            <ConfrontoCardPDF key={c.id} c={c} />
          ))}
          {confrontos.length === 0 && (
            <Text style={s.tdMuted}>Nenhum confronto encontrado.</Text>
          )}
        </View>

        {/* ── Classificação Copa ── */}
        <View style={s.section} break={true}>
          <View wrap={false}>
            <SectionTitle>Classificação Copa</SectionTitle>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: 30 }]}>POS</Text>
              <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
              <Text style={[s.th, { width: 32, textAlign: "center" }]}>PTS</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>V</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>E</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>D</Text>
              <Text style={[s.th, { width: 52, textAlign: "center" }]}>SALDO PTS</Text>
            </View>
          </View>
          {classificacao.map((row, idx) => {
            const color = posColor(idx);
            return (
              <View
                key={row.id}
                style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}
                wrap={false}
              >
                {color ? (
                  <View style={[s.posBadge, { backgroundColor: color, width: 30 }]}>
                    <Text style={s.posBadgeText}>{idx + 1}°</Text>
                  </View>
                ) : (
                  <Text style={[s.posText, { width: 30 }]}>{idx + 1}°</Text>
                )}
                <View style={s.classTeamRow}>
                  <TeamLogo
                    url={row.equipe.logo_url ?? null}
                    name={row.equipe.nome}
                    size={18}
                  />
                  <Text style={[s.td, { flex: 1 }]}>{row.equipe.nome}</Text>
                </View>
                <Text style={[s.tdBlue, { width: 32, textAlign: "center" }]}>
                  {row.pontos ?? 0}
                </Text>
                <Text style={[s.td, { width: 26, textAlign: "center" }]}>
                  {row.vitorias ?? 0}
                </Text>
                <Text style={[s.td, { width: 26, textAlign: "center" }]}>
                  {row.empates ?? 0}
                </Text>
                <Text style={[s.td, { width: 26, textAlign: "center" }]}>
                  {row.derrotas ?? 0}
                </Text>
                <Text style={[s.td, { width: 52, textAlign: "center" }]}>
                  {formatPts(row.saldo_pontos ?? 0)}
                </Text>
              </View>
            );
          })}
          {classificacao.length === 0 && (
            <Text style={s.tdMuted}>Nenhum dado de classificação.</Text>
          )}
        </View>

        {/* ── Próxima Rodada ── */}
        {proximaRodadaNumero !== null && (
          <View style={s.section} wrap={false}>
            <SectionTitle>
              Próxima Rodada — {proximaRodadaNumero}
              {proximaFase ? ` (${proximaFase})` : ""}
            </SectionTitle>
            {proximaConfrontos.map((c) => (
              <ConfrontoCardNextPDF key={c.id} c={c} />
            ))}
            {proximaConfrontos.length === 0 && (
              <Text style={s.tdMuted}>Confrontos ainda não definidos.</Text>
            )}
          </View>
        )}

        {/* ── Footer (fixa em todas as páginas) ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Palpitão do Cartola FC · Copa · palpitaodocartola.vercel.app
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminResumoCopa() {
  const [selectedRodadaId, setSelectedRodadaId] = useState<string | null>(null);
  const [proximaRodadaId, setProximaRodadaId] = useState<string | "none" | null>(null);

  const { data: rodadas = [], isLoading: loadingRodadas } = useCopaRodadas();
  const { data: classificacao = [], isLoading: loadingClass } = useCopaClassificacao();

  const selectableRodadas = useMemo(
    () =>
      [...rodadas]
        .filter((r) => r.status === "finalizada" || r.status === "em_andamento")
        .sort((a, b) => b.numero - a.numero),
    [rodadas]
  );

  useEffect(() => {
    if (selectedRodadaId === null && selectableRodadas.length > 0) {
      setSelectedRodadaId(selectableRodadas[0].id);
    }
  }, [selectableRodadas, selectedRodadaId]);

  const selectedRodada: CopaRodada | null = useMemo(
    () => rodadas.find((r) => r.id === selectedRodadaId) ?? null,
    [rodadas, selectedRodadaId]
  );

  const proximaRodadaCandidates = useMemo(() => {
    if (!selectedRodada) return [];
    return [...rodadas]
      .filter(
        (r) =>
          r.numero > selectedRodada.numero &&
          (r.status === "em_andamento" || r.status === "pendente")
      )
      .sort((a, b) => a.numero - b.numero);
  }, [rodadas, selectedRodada]);

  useEffect(() => {
    if (proximaRodadaCandidates.length > 0) {
      setProximaRodadaId(proximaRodadaCandidates[0].id);
    } else {
      setProximaRodadaId("none");
    }
  }, [selectedRodadaId, proximaRodadaCandidates]);

  const proximaRodada: CopaRodada | null = useMemo(
    () =>
      proximaRodadaId && proximaRodadaId !== "none"
        ? (rodadas.find((r) => r.id === proximaRodadaId) ?? null)
        : null,
    [rodadas, proximaRodadaId]
  );

  const { data: confrontos = [], isLoading: loadingConf } = useCopaConfrontos(
    selectedRodada?.id ?? null
  );
  const { data: proximaConfrontos = [], isLoading: loadingProxConf } =
    useCopaConfrontos(proximaRodada?.id ?? null);

  const isLoading =
    loadingRodadas ||
    loadingClass ||
    (!!selectedRodada && loadingConf) ||
    (!!proximaRodada && loadingProxConf);

  const pdfData: CopaPdfData | null = useMemo(() => {
    if (!selectedRodada) return null;
    return {
      rodadaNumero: selectedRodada.numero,
      rodadaFase: faseLabel(selectedRodada),
      confrontos,
      classificacao: classificacao as CopaClassificacaoRow[],
      proximaRodadaNumero: proximaRodada?.numero ?? null,
      proximaFase: proximaRodada ? faseLabel(proximaRodada) : null,
      proximaConfrontos,
    };
  }, [selectedRodada, confrontos, classificacao, proximaRodada, proximaConfrontos]);

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
        ) : selectableRodadas.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma rodada em andamento ou finalizada encontrada para a Copa.
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Rodada (resultado)
                </label>
                <Select
                  value={selectedRodadaId ?? ""}
                  onValueChange={setSelectedRodadaId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione a rodada" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRodadas.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Rodada {r.numero} — {r.fase}
                        {r.fase_detalhe ? ` (${r.fase_detalhe})` : ""}
                        {r.status === "em_andamento" ? " · em andamento" : ""}
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
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {proximaRodadaCandidates.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Rodada {r.numero} — {r.fase}
                        {r.fase_detalhe ? ` (${r.fase_detalhe})` : ""}
                        {r.status === "em_andamento" ? " · em andamento" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {pdfData && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">Fase:</span>{" "}
                  {pdfData.rodadaFase}
                </p>
                <p>
                  <span className="text-foreground font-medium">Confrontos:</span>{" "}
                  {pdfData.confrontos.length}
                </p>
                {pdfData.proximaRodadaNumero && (
                  <p>
                    <span className="text-foreground font-medium">
                      Próxima rodada:
                    </span>{" "}
                    Rodada {pdfData.proximaRodadaNumero}
                    {pdfData.proximaFase ? ` (${pdfData.proximaFase})` : ""}
                    {pdfData.proximaConfrontos.length > 0
                      ? ` · ${pdfData.proximaConfrontos.length} confronto(s)`
                      : " · confrontos ainda não definidos"}
                  </p>
                )}
              </div>
            )}

            {pdfData && (
              <PDFDownloadLink
                document={<CopaDocument data={pdfData} />}
                fileName={fileName}
              >
                {({ loading: pdfLoading, error: pdfError }) => (
                  <div className="flex flex-col gap-1">
                    <Button
                      disabled={pdfLoading || !!pdfError}
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
                    {pdfError && (
                      <p className="text-xs text-destructive">
                        Erro ao gerar PDF: {String(pdfError)}
                      </p>
                    )}
                  </div>
                )}
              </PDFDownloadLink>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
