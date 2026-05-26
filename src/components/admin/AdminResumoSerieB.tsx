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
  bg: "#0d1117",
  card: "#161b22",
  header: "#3fb950",
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
    backgroundColor: C.header,
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
    backgroundColor: "#1a3025",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#2ea043",
    borderStyle: "solid",
  },
  headerBadgeText: {
    color: C.header,
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
    backgroundColor: C.header,
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
  tdGreen: {
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  // ── confronto cards ──
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  confrontoBody: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  confrontoScore: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.header,
  },
  indRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  indName: {
    flex: 3,
    fontSize: 9,
    color: C.text,
  },
  indPts: {
    flex: 1.5,
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
  },
  indPtsWinner: {
    flex: 1.5,
    fontSize: 9,
    color: C.winner,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  indNameRight: {
    flex: 3,
    fontSize: 9,
    color: C.text,
    textAlign: "right",
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
  smallNote: {
    fontSize: 8,
    color: C.muted,
    marginTop: 8,
    textAlign: "center",
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

function ConfrontoCardPDF({ c }: { c: ConfrontoEquipe }) {
  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <View style={s.confrontoTeamBlock}>
          <TeamLogo url={c.equipe1.logo_url} name={c.equipe1.nome} size={30} />
          <Text style={s.confrontoEquipeName}>{c.equipe1.nome}</Text>
        </View>
        <View style={s.confrontoScoreBlock}>
          <Text style={s.confrontoScore}>
            {c.vitorias_equipe1 ?? 0} × {c.vitorias_equipe2 ?? 0}
          </Text>
        </View>
        <View style={s.confrontoTeamBlockRight}>
          <Text style={s.confrontoEquipeNameRight}>{c.equipe2.nome}</Text>
          <TeamLogo url={c.equipe2.logo_url} name={c.equipe2.nome} size={30} />
        </View>
      </View>
      <View style={s.confrontoBody}>
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
    </View>
  );
}

function ConfrontoCardNextPDF({ c }: { c: ConfrontoEquipe }) {
  return (
    <View style={s.confrontoCard} wrap={false}>
      <View style={s.confrontoHeader}>
        <View style={s.confrontoTeamBlock}>
          <TeamLogo url={c.equipe1.logo_url} name={c.equipe1.nome} size={30} />
          <Text style={s.confrontoEquipeName}>{c.equipe1.nome}</Text>
        </View>
        <View style={s.confrontoScoreBlock}>
          <Text style={[s.confrontoScore, { color: C.muted, fontSize: 11 }]}>
            vs
          </Text>
        </View>
        <View style={s.confrontoTeamBlockRight}>
          <Text style={s.confrontoEquipeNameRight}>{c.equipe2.nome}</Text>
          <TeamLogo url={c.equipe2.logo_url} name={c.equipe2.nome} size={30} />
        </View>
      </View>
      <View style={s.confrontoBody}>
        {c.confrontos_individuais.map((ci) => (
          <View key={ci.id} style={s.indRow}>
            <Text style={s.indName}>{getPlayerName(ci, "1")}</Text>
            <Text style={[s.tdMuted, { flex: 0.5, textAlign: "center" }]}>
              vs
            </Text>
            <Text style={s.indNameRight}>{getPlayerName(ci, "2")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
interface SerieBPdfData {
  rodadaNumero: number;
  confrontos: ConfrontoEquipe[];
  classificacao: ClassificacaoEquipe[];
  artilheiros: Artilheiro[];
  pontuacoes: PontuacaoEquipe[];
  proximaRodadaNumero: number | null;
  proximaConfrontos: ConfrontoEquipe[];
  logoMap: Record<string, string | null>;
}

function SerieBDocument({ data }: { data: SerieBPdfData }) {
  const {
    rodadaNumero,
    confrontos,
    classificacao,
    artilheiros,
    pontuacoes,
    proximaRodadaNumero,
    proximaConfrontos,
    logoMap,
  } = data;

  const top10 = artilheiros.slice(0, 10);

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
                Resumo · Rodada {rodadaNumero} · {formatDate()}
              </Text>
            </View>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>SÉRIE B</Text>
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

        {/* ── Classificação ── */}
        <View style={s.section} break={true}>
          <View wrap={false}>
            <SectionTitle>Classificação</SectionTitle>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: 30 }]}>POS</Text>
              <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
              <Text style={[s.th, { width: 32, textAlign: "center" }]}>PTS</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>V</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>E</Text>
              <Text style={[s.th, { width: 26, textAlign: "center" }]}>D</Text>
              <Text style={[s.th, { width: 40, textAlign: "center" }]}>SALDO</Text>
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
                <Text style={[s.tdGreen, { width: 32, textAlign: "center" }]}>
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
                <Text style={[s.td, { width: 40, textAlign: "center" }]}>
                  {row.saldo_confrontos ?? 0}
                </Text>
              </View>
            );
          })}
          {classificacao.length === 0 && (
            <Text style={s.tdMuted}>Nenhum dado de classificação.</Text>
          )}
        </View>

        {/* ── Artilheiros Top 10 ── */}
        <View style={s.section}>
          <View wrap={false}>
            <SectionTitle>Artilheiros — Top 10</SectionTitle>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: 24 }]}>#</Text>
              <Text style={[s.th, { flex: 1 }]}>JOGADOR</Text>
              <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
              <Text style={[s.th, { width: 32, textAlign: "center" }]}>V</Text>
            </View>
          </View>
          {top10.map((art, idx) => {
            const color = posColor(idx);
            return (
              <View
                key={art.jogador_id}
                style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}
                wrap={false}
              >
                {color ? (
                  <View style={[s.posBadge, { backgroundColor: color, width: 24 }]}>
                    <Text style={s.posBadgeText}>{idx + 1}</Text>
                  </View>
                ) : (
                  <Text style={[s.td, { width: 24 }]}>{idx + 1}</Text>
                )}
                <Text style={[s.td, { flex: 1 }]}>{art.jogador_nome}</Text>
                <Text style={[s.tdMuted, { flex: 1 }]}>{art.equipe_nome}</Text>
                <Text style={[s.tdGreen, { width: 32, textAlign: "center" }]}>
                  {art.vitorias}
                </Text>
              </View>
            );
          })}
          {top10.length === 0 && (
            <Text style={s.tdMuted}>Nenhum artilheiro registrado.</Text>
          )}
          <Text style={s.smallNote}>
            Artilharia completa: palpitaodocartola.vercel.app/serie-b
          </Text>
        </View>

        {/* ── Pontuação das Equipes ── */}
        <View style={s.section} break={true}>
          <View wrap={false}>
            <SectionTitle>Pontuação das Equipes</SectionTitle>
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 1 }]}>EQUIPE</Text>
              <Text style={[s.th, { width: 54, textAlign: "center" }]}>TOTAL</Text>
              <Text style={[s.th, { width: 46, textAlign: "center" }]}>MÉDIA</Text>
              <Text style={[s.th, { width: 62, textAlign: "center" }]}>ÚLT. RODADA</Text>
            </View>
          </View>
          {pontuacoes.map((p, idx) => (
            <View
              key={p.equipe_id}
              style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}
              wrap={false}
            >
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }}>
                <TeamLogo
                  url={logoMap[p.equipe_id] ?? null}
                  name={p.equipe_nome}
                  size={16}
                />
                <Text style={[s.td, { flex: 1 }]}>{p.equipe_nome}</Text>
              </View>
              <Text style={[s.tdGreen, { width: 54, textAlign: "center" }]}>
                {formatarPontuacao(p.pontuacao_total)}
              </Text>
              <Text style={[s.td, { width: 46, textAlign: "center" }]}>
                {formatarPontuacao(p.media_por_rodada)}
              </Text>
              <Text style={[s.td, { width: 62, textAlign: "center" }]}>
                {formatarPontuacao(p.pontuacao_ultima_rodada)}
              </Text>
            </View>
          ))}
          {pontuacoes.length === 0 && (
            <Text style={s.tdMuted}>Nenhuma pontuação registrada.</Text>
          )}
        </View>

        {/* ── Próxima Rodada ── */}
        {proximaRodadaNumero !== null && (
          <View style={s.section} wrap={false}>
            <SectionTitle>Próxima Rodada — {proximaRodadaNumero}</SectionTitle>
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
            Palpitão do Cartola FC · Série B · palpitaodocartola.vercel.app
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

  const selectableRodadas = useMemo(
    () =>
      [...rodadas]
        .filter(
          (r) => r.status_b === "finalizada" || r.status_b === "em_andamento"
        )
        .sort((a, b) => b.numero - a.numero),
    [rodadas]
  );

  useEffect(() => {
    if (selectedRodadaId === null && selectableRodadas.length > 0) {
      setSelectedRodadaId(selectableRodadas[0].id);
    }
  }, [selectableRodadas, selectedRodadaId]);

  const selectedRodada = useMemo(
    () => rodadas.find((r) => r.id === selectedRodadaId) ?? null,
    [rodadas, selectedRodadaId]
  );

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

  const logoMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    (classificacao as ClassificacaoEquipe[]).forEach((row) => {
      map[row.equipe.id] = row.equipe.logo_url ?? null;
    });
    return map;
  }, [classificacao]);

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
      logoMap,
    };
  }, [
    selectedRodada,
    confrontos,
    classificacao,
    artilheiros,
    pontuacoes,
    proximaRodada,
    proximaConfrontos,
    logoMap,
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
                {({ loading: pdfLoading, error: pdfError }) => (
                  <div className="flex flex-col gap-1">
                    <Button disabled={pdfLoading || !!pdfError} className="gap-2">
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
