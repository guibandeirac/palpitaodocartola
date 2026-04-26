import type { AtletaDetalhe, ReservaDetalhe } from "@/hooks/useParciais";
import { cn } from "@/lib/utils";
import { formatarPontuacao } from "@/lib/pontuacao";

interface CampoFutebolProps {
  atletas: AtletaDetalhe[];
  reservas: ReservaDetalhe[];
  total: number;
}

function fotoUrl(foto: string | null | undefined): string | null {
  if (!foto) return null;
  return foto.replace("FORMATO", "140x140");
}

interface PlayerLike {
  nome: string;
  clube?: string;
  posicao: string;
  posicao_id: number;
  foto: string | null;
  pontuacao: number | null;
  pontuacao_base?: number;
  eh_capitao?: boolean;
  eh_reserva_luxo?: boolean;
  entrou?: boolean;
  status: string;
  saiu?: boolean;
}

function PlayerCard({ player, small = false }: { player: PlayerLike; small?: boolean }) {
  const { nome, foto, pontuacao, pontuacao_base, eh_capitao, eh_reserva_luxo, entrou, status, saiu } = player;
  const url = fotoUrl(foto);

  let pontuacaoNode: React.ReactNode;
  if (saiu) {
    pontuacaoNode = <span className="text-destructive/70 text-[9px]">↓ saiu</span>;
  } else if (status === "jogo_invalido") {
    pontuacaoNode = <span>🚫</span>;
  } else if (status === "aguardando") {
    pontuacaoNode = <span className="text-muted-foreground">-</span>;
  } else if (status === "nao_entrou") {
    pontuacaoNode = <span>🪑</span>;
  } else if (eh_capitao && pontuacao_base != null && pontuacao != null) {
    pontuacaoNode = (
      <span className="tabular-nums font-bold">{formatarPontuacao(pontuacao)}</span>
    );
  } else {
    pontuacaoNode = (
      <span className="tabular-nums font-semibold">
        {pontuacao != null ? formatarPontuacao(pontuacao) : "-"}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 relative shrink-0",
        small ? "w-[46px]" : "w-[54px]",
        saiu && "opacity-50",
      )}
    >
      <div
        className={cn(
          "w-full bg-[#0b1c3a] border border-[#1e3464] rounded px-0.5 py-[1px] text-center font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap text-white",
          small ? "text-[7px]" : "text-[8px]",
        )}
        title={nome}
      >
        {nome}
      </div>

      <div
        className={cn(
          "relative rounded-full bg-gradient-to-b from-[#1e3464] to-[#0b1c3a] border-2 border-blue-500/80 flex items-center justify-center shadow-md",
          small ? "w-8 h-8" : "w-10 h-10",
        )}
      >
        {url ? (
          <img
            src={url}
            alt={nome}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-white/60 text-[10px]">?</span>
        )}

        {eh_capitao && !saiu && (
          <div className="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full border border-[#0b1c3a] bg-blue-500 text-white flex items-center justify-center text-[8px] font-black z-10 shadow">
            C
          </div>
        )}
        {eh_reserva_luxo && !eh_capitao && !saiu && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full border border-[#0b1c3a] bg-orange-500 text-white flex items-center justify-center text-[8px] font-black z-10 shadow">
            RL
          </div>
        )}
        {entrou && !eh_reserva_luxo && !saiu && (
          <div className="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full border border-[#0b1c3a] bg-green-500 text-white flex items-center justify-center text-[9px] font-black leading-none z-10 shadow">
            ↑
          </div>
        )}
      </div>

      <div
        className={cn(
          "bg-[#0b1c3a] border border-[#1e3464] rounded text-center text-white mt-0.5 px-0.5",
          small ? "min-w-[30px] text-[8px]" : "min-w-[34px] text-[9px]",
        )}
      >
        {pontuacaoNode}
      </div>
    </div>
  );
}

function FieldBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 600"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="campo-grass" patternUnits="userSpaceOnUse" width="400" height="60">
          <rect width="400" height="60" fill="#16a34a" />
          <rect width="400" height="30" fill="#15803d" />
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#campo-grass)" />
      <rect x="8" y="8" width="384" height="584" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <line x1="8" y1="300" x2="392" y2="300" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <circle cx="200" cy="300" r="55" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <circle cx="200" cy="300" r="3" fill="white" opacity="0.85" />
      <rect x="100" y="8" width="200" height="80" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <rect x="150" y="8" width="100" height="30" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <circle cx="200" cy="65" r="3" fill="white" opacity="0.85" />
      <path d="M 165 88 A 40 40 0 0 0 235 88" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <rect x="100" y="512" width="200" height="80" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <rect x="150" y="562" width="100" height="30" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <circle cx="200" cy="535" r="3" fill="white" opacity="0.85" />
      <path d="M 165 512 A 40 40 0 0 1 235 512" fill="none" stroke="white" strokeWidth="2.5" opacity="0.85" />
      <path d="M 8 18 A 10 10 0 0 1 18 8" fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
      <path d="M 392 18 A 10 10 0 0 0 382 8" fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
      <path d="M 8 582 A 10 10 0 0 0 18 592" fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
      <path d="M 392 582 A 10 10 0 0 1 382 592" fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
    </svg>
  );
}

const POSICAO_IDS = { GOL: 1, LAT: 2, ZAG: 3, MEI: 4, ATA: 5, TEC: 6 } as const;

function buildDefenseRow(atletas: PlayerLike[]): PlayerLike[] {
  const lats = atletas.filter((a) => a.posicao_id === POSICAO_IDS.LAT);
  const zags = atletas.filter((a) => a.posicao_id === POSICAO_IDS.ZAG);

  if (lats.length === 0) return zags;
  if (lats.length === 1) return [lats[0], ...zags];
  return [lats[0], ...zags, lats[1]];
}

function toPlayerLike(a: AtletaDetalhe): PlayerLike {
  return {
    nome: a.nome,
    clube: a.clube,
    posicao: a.posicao,
    posicao_id: a.posicao_id,
    foto: a.foto,
    pontuacao: a.pontuacao,
    pontuacao_base: a.pontuacao_base,
    eh_capitao: a.eh_capitao,
    eh_reserva_luxo: a.eh_reserva_luxo,
    entrou: a.entrou_como_reserva,
    status: a.status,
  };
}

function reservaToPlayerLike(r: ReservaDetalhe, saiu = false): PlayerLike {
  return {
    nome: r.nome,
    clube: r.clube,
    posicao: r.posicao,
    posicao_id: r.posicao_id,
    foto: r.foto,
    pontuacao: r.pontuacao,
    eh_capitao: false,
    eh_reserva_luxo: r.eh_reserva_luxo,
    entrou: r.entrou,
    status: r.status,
    saiu,
  };
}

export function CampoFutebol({ atletas, reservas, total }: CampoFutebolProps) {
  const titulares = atletas.map(toPlayerLike);

  const ataques = titulares.filter((a) => a.posicao_id === POSICAO_IDS.ATA);
  const meias = titulares.filter((a) => a.posicao_id === POSICAO_IDS.MEI);
  const defesa = buildDefenseRow(titulares);
  const goleiro = titulares.find((a) => a.posicao_id === POSICAO_IDS.GOL);
  const tecnico = titulares.find((a) => a.posicao_id === POSICAO_IDS.TEC);

  const enteredReserves = reservas.filter((r) => r.entrou);
  const benchReserves = reservas.filter((r) => !r.entrou);

  // Reserva substituído (saiu) → mostra na lista de reservas com saiu=true
  const replacedSlots: PlayerLike[] = enteredReserves
    .filter((r) => r.substituiu_nome)
    .map((r) => ({
      nome: r.substituiu_nome as string,
      posicao: r.posicao,
      posicao_id: r.posicao_id,
      foto: null,
      pontuacao: null,
      status: "banco",
      saiu: true,
    }));

  const RESERVA_ORDER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  const reservasDisplay: PlayerLike[] = [
    ...replacedSlots,
    ...benchReserves.map((r) => reservaToPlayerLike(r, false)),
  ].sort((a, b) => (RESERVA_ORDER[a.posicao_id] ?? 99) - (RESERVA_ORDER[b.posicao_id] ?? 99));

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col">
      {/* CAMPO */}
      <div className="px-2">
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: "2 / 3" }}
        >
          <FieldBackground />

          <div className="absolute inset-0 flex flex-col justify-between py-4 z-10">
            {/* Atacantes */}
            <div className="flex justify-around items-start px-1">
              {ataques.map((p, i) => (
                <PlayerCard key={`ata-${i}`} player={p} />
              ))}
            </div>

            {/* Meias */}
            <div className="flex justify-around items-start px-1">
              {meias.map((p, i) => (
                <PlayerCard key={`mei-${i}`} player={p} />
              ))}
            </div>

            {/* Defesa (LAT + ZAG combinados) */}
            <div className="flex justify-around items-start px-1">
              {defesa.map((p, i) => (
                <PlayerCard key={`def-${i}`} player={p} />
              ))}
            </div>

            {/* GOL + TEC */}
            <div className="relative flex justify-center px-1">
              {goleiro && <PlayerCard player={goleiro} />}
              {tecnico && (
                <div className="absolute right-1 top-0">
                  <PlayerCard player={tecnico} small />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-xs font-bold border-t border-border/50 pt-2 mt-3 px-3">
        <span>Total</span>
        <span className="tabular-nums">{formatarPontuacao(total)}</span>
      </div>

      {/* RESERVAS */}
      {reservasDisplay.length > 0 && (
        <div className="px-3 pt-3 pb-2">
          <h4 className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Reservas
          </h4>
          <div className="flex justify-around items-start gap-1 flex-nowrap">
            {reservasDisplay.map((r, i) => (
              <PlayerCard key={`res-${i}`} player={r} small />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
