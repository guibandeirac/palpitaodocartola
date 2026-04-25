import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arredondar2Decimais(valor: number): number {
  return Math.round(valor * 100) / 100;
}

interface AtletaPontuado {
  apelido: string;
  pontuacao: number;
  entrou_em_campo: boolean;
  posicao_id: number;
  clube_id: number;
}

const POSICAO_NOME: Record<number, string> = {
  1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC",
};

interface AtletaTime {
  atleta_id: number;
  apelido?: string;
  pontuacao?: number;
  posicao_id: number;
  entrou_em_campo?: boolean;
  clube_id?: number;
}

interface TimeCartola {
  atletas: AtletaTime[];
  reservas?: AtletaTime[];
  capitao_id: number;
  reserva_luxo_id?: number;
  rodada_time_id?: number;
  pontos?: number;
}

interface JogadorAtivo {
  atleta_id: number;
  posicao_id: number;
  clube_id: number;
  pontuacao: number;
  entrou_em_campo: boolean;
  eh_capitao: boolean;
  eh_reserva_luxo: boolean;
  substituido: boolean;
  jogo_comecou: boolean;
  jogo_invalido: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request body
    const body = await req.json();
    const rodada_numero = body.rodada_numero;
    if (!rodada_numero) {
      return new Response(JSON.stringify({ error: "rodada_numero é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar rodada da Copa
    const { data: rodada, error: rodadaError } = await supabase
      .from("copa_rodadas")
      .select("*")
      .eq("numero", rodada_numero)
      .single();

    if (rodadaError || !rodada) {
      throw new Error(`Copa Rodada ${rodada_numero} não encontrada`);
    }

    const rodadaCartola = rodada.rodada_cartola;
    console.log(`Copa Rodada ${rodada.numero}, Cartola: ${rodadaCartola}`);

    // 2. Buscar confrontos da Copa
    const { data: confrontosCopa, error: confrontosError } = await supabase
      .from("copa_confrontos")
      .select(`
        id,
        equipe1_id,
        equipe2_id,
        equipe1:equipes!copa_confrontos_equipe1_id_fkey(id, nome, logo_url),
        equipe2:equipes!copa_confrontos_equipe2_id_fkey(id, nome, logo_url)
      `)
      .eq("rodada_id", rodada.id);

    if (confrontosError) {
      throw new Error(`Erro ao buscar confrontos copa: ${confrontosError.message}`);
    }

    // 3. Collect all equipe IDs and fetch their jogadores (all 7 including coringa)
    const equipesIds = new Set<string>();
    confrontosCopa?.forEach((c: any) => {
      if (c.equipe1_id) equipesIds.add(c.equipe1_id);
      if (c.equipe2_id) equipesIds.add(c.equipe2_id);
    });

    const { data: allJogadores } = await supabase
      .from("jogadores")
      .select("*")
      .in("equipe_id", Array.from(equipesIds));

    // Filter jogadores valid for this rodada_cartola
    const jogadores = (allJogadores || []).filter((j: any) => {
      const entrada = j.rodada_entrada ?? 1;
      const saida = j.rodada_saida;
      // Valid if: entrada <= rodadaCartola AND (no saida OR saida >= rodadaCartola)
      return entrada <= rodadaCartola && (saida == null || saida >= rodadaCartola);
    });

    // Group jogadores by equipe
    const jogadoresPorEquipe = new Map<string, any[]>();
    jogadores.forEach((j: any) => {
      if (!j.equipe_id) return;
      if (!jogadoresPorEquipe.has(j.equipe_id)) jogadoresPorEquipe.set(j.equipe_id, []);
      jogadoresPorEquipe.get(j.equipe_id)!.push(j);
    });

    // 4. All unique jogadores for fetching
    const todosJogadores = new Map<string, any>();
    jogadores.forEach((j: any) => todosJogadores.set(j.id, j));

    // 5. Fetch /atletas/pontuados ONCE
    console.log("Buscando atletas pontuados...");
    let atletasPontuados: Record<string, AtletaPontuado> = {};
    try {
      const pontuadosResp = await fetch("https://api.cartola.globo.com/atletas/pontuados");
      if (pontuadosResp.ok) {
        const pontuadosData = await pontuadosResp.json();
        atletasPontuados = pontuadosData.atletas || {};
      }
    } catch (e) {
      console.error("Erro ao buscar atletas pontuados:", e);
    }
    console.log(`Atletas pontuados: ${Object.keys(atletasPontuados).length}`);

    // 6. Fetch /partidas/{rodada_cartola} ONCE
    const clubesComJogoIniciado = new Set<number>();
    const clubesJogoInvalido = new Set<number>();
    const clubeAbreviacao = new Map<number, string>();
    const statusJogoComecou = ["PRIMEIRO_TEMPO", "INTERVALO", "SEGUNDO_TEMPO", "POS_JOGO"];
    try {
      const partidasResp = await fetch(`https://api.cartola.globo.com/partidas/${rodadaCartola}`);
      if (partidasResp.ok) {
        const partidasData = await partidasResp.json();
        const partidas = partidasData.partidas || partidasData || [];
        const clubesMap = partidasData.clubes || {};
        for (const [clubeId, clubeInfo] of Object.entries(clubesMap) as any) {
          if (clubeInfo?.abreviacao) {
            clubeAbreviacao.set(Number(clubeId), clubeInfo.abreviacao);
          }
        }
        for (const partida of partidas) {
          if (partida.valida === false) {
            if (partida.clube_casa_id) clubesJogoInvalido.add(partida.clube_casa_id);
            if (partida.clube_visitante_id) clubesJogoInvalido.add(partida.clube_visitante_id);
            continue;
          }
          const periodo = partida.periodo_tr || "";
          if (statusJogoComecou.includes(periodo)) {
            if (partida.clube_casa_id) clubesComJogoIniciado.add(partida.clube_casa_id);
            if (partida.clube_visitante_id) clubesComJogoIniciado.add(partida.clube_visitante_id);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar partidas:", e);
      for (const atletaId of Object.keys(atletasPontuados)) {
        const atleta = atletasPontuados[atletaId];
        if (atleta.clube_id) clubesComJogoIniciado.add(atleta.clube_id);
      }
    }
    console.log(`Clubes com jogo iniciado: ${clubesComJogoIniciado.size}`);

    // 7. For each jogador, fetch Cartola team and calculate parcial
    const apelidoMap = new Map<number, string>();
    const pontuacoesParciais = new Map<string, { pontuacao: number; escalou: boolean; detalhes: any }>();

    for (const [jogadorId, jogador] of todosJogadores) {
      try {
        const resp = await fetch(`https://api.cartola.globo.com/time/id/${jogador.id_cartola}`);
        if (!resp.ok) {
          pontuacoesParciais.set(jogadorId, { pontuacao: 0, escalou: false, detalhes: null });
          continue;
        }
        const data = await resp.json();
        const rodadaTimeId = data.time?.rodada_time_id || 0;
        const escalou = rodadaTimeId >= (rodadaCartola || 0);

        // Store apelidos
        for (const a of (data.atletas || [])) {
          if (a.apelido) apelidoMap.set(a.atleta_id, a.apelido);
        }
        for (const r of (data.reservas || [])) {
          if (r.apelido) apelidoMap.set(r.atleta_id, r.apelido);
        }

        if (!escalou) {
          pontuacoesParciais.set(jogadorId, { pontuacao: 0, escalou: false, detalhes: null });
          continue;
        }

        const time: TimeCartola = {
          atletas: data.atletas || [],
          reservas: data.reservas || [],
          capitao_id: data.capitao_id,
          reserva_luxo_id: data.reserva_luxo_id,
          rodada_time_id: rodadaTimeId,
          pontos: data.pontos,
        };

        const resultado = calcularPontuacaoTime(time, atletasPontuados, clubesComJogoIniciado, clubesJogoInvalido, clubeAbreviacao, apelidoMap);
        pontuacoesParciais.set(jogadorId, {
          pontuacao: arredondar2Decimais(resultado.total),
          escalou: true,
          detalhes: resultado,
        });

        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error(`Erro ao buscar time de ${jogador.nome}:`, e);
        pontuacoesParciais.set(jogadorId, { pontuacao: 0, escalou: false, detalhes: null });
      }
    }

    // Also store apelidos from pontuados
    for (const [atletaId, atleta] of Object.entries(atletasPontuados)) {
      if (atleta.apelido) apelidoMap.set(Number(atletaId), atleta.apelido);
    }

    // 8. Build Copa confrontos results
    // In Copa: all 7 players (including coringa) sum normally, no coringa substitution
    const resultados: any[] = [];

    for (const ce of confrontosCopa || []) {
      const jogadoresE1 = jogadoresPorEquipe.get(ce.equipe1_id) || [];
      const jogadoresE2 = jogadoresPorEquipe.get(ce.equipe2_id) || [];

      const buildJogadorList = (jogadoresList: any[]) => {
        return jogadoresList.map((j: any) => {
          const parcial = pontuacoesParciais.get(j.id);
          return {
            id: j.id,
            nome: j.nome,
            pontuacao: parcial?.pontuacao ?? 0,
            escalou: parcial?.escalou ?? false,
            eh_coringa: j.eh_coringa || false,
            atletas: parcial?.detalhes?.atletasDetalhados || null,
            reservas: parcial?.detalhes?.reservasDetalhados || null,
          };
        });
      };

      const listaE1 = buildJogadorList(jogadoresE1);
      const listaE2 = buildJogadorList(jogadoresE2);

      const totalE1 = Math.floor(listaE1.reduce((s: number, j: any) => s + j.pontuacao, 0));
      const totalE2 = Math.floor(listaE2.reduce((s: number, j: any) => s + j.pontuacao, 0));

      let resultado: string | null = null;
      if (totalE1 > totalE2) resultado = "equipe1";
      else if (totalE2 > totalE1) resultado = "equipe2";
      else resultado = "empate";

      resultados.push({
        id: ce.id,
        equipe1: { id: (ce as any).equipe1?.id, nome: (ce as any).equipe1?.nome, logo_url: (ce as any).equipe1?.logo_url },
        equipe2: { id: (ce as any).equipe2?.id, nome: (ce as any).equipe2?.nome, logo_url: (ce as any).equipe2?.logo_url },
        pontuacao_equipe1: totalE1,
        pontuacao_equipe2: totalE2,
        resultado,
        jogadores_equipe1: listaE1,
        jogadores_equipe2: listaE2,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        rodada: { numero: rodada.numero, rodada_cartola: rodadaCartola },
        confrontos: resultados,
        atualizado_em: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[INTERNAL] Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao calcular parciais da Copa. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// === calcularPontuacaoTime - same logic as Série B ===
function calcularPontuacaoTime(
  time: TimeCartola,
  atletasPontuados: Record<string, AtletaPontuado>,
  clubesComJogoIniciado: Set<number>,
  clubesJogoInvalido: Set<number>,
  clubeAbreviacao: Map<number, string>,
  apelidoMap: Map<number, string>
): { total: number; atletasDetalhados: any[]; reservasDetalhados: any[] } {
  const capitaoId = time.capitao_id;
  const reservaLuxoId = time.reserva_luxo_id;
  const originalAtletaIds = new Map<number, number>();

  // Titulares
  const titulares: (JogadorAtivo)[] = (time.atletas || []).map((a, idx) => {
    const pontuado = atletasPontuados[String(a.atleta_id)];
    const clubeId = pontuado?.clube_id || a.clube_id || 0;
    const jogoInvalido = clubesJogoInvalido.has(clubeId);
    const jogoComecou = jogoInvalido ? true : clubesComJogoIniciado.has(clubeId);
    originalAtletaIds.set(idx, a.atleta_id);

    return {
      atleta_id: a.atleta_id,
      posicao_id: a.posicao_id,
      clube_id: clubeId,
      pontuacao: jogoInvalido ? 0 : (pontuado ? pontuado.pontuacao : 0),
      entrou_em_campo: jogoInvalido ? false : (pontuado ? pontuado.entrou_em_campo : false),
      eh_capitao: a.atleta_id === capitaoId,
      eh_reserva_luxo: false,
      substituido: false,
      jogo_comecou: jogoComecou,
      jogo_invalido: jogoInvalido,
    };
  });

  const reservaEntrou = new Map<number, { substituiu_nome: string; eh_luxo: boolean }>();
  const reservas = time.reservas || [];
  const posicoesSubstituidas = new Set<number>();

  // Position-based substitutions (SKIP the RL - handle separately)
  for (const titular of titulares) {
    if (titular.jogo_comecou && !titular.entrou_em_campo && !posicoesSubstituidas.has(titular.posicao_id)) {
      const reserva = reservas.find((r) => {
        if (r.atleta_id === reservaLuxoId) return false; // Skip RL in normal subs
        const pontuado = atletasPontuados[String(r.atleta_id)];
        return (
          r.posicao_id === titular.posicao_id &&
          pontuado &&
          pontuado.entrou_em_campo &&
          pontuado.pontuacao >= 0
        );
      });

      if (reserva) {
        const pontuadoReserva = atletasPontuados[String(reserva.atleta_id)];
        const titularOriginalNome = apelidoMap.get(titular.atleta_id) || atletasPontuados[String(titular.atleta_id)]?.apelido || String(titular.atleta_id);
        reservaEntrou.set(reserva.atleta_id, { substituiu_nome: titularOriginalNome, eh_luxo: false });
        titular.pontuacao = pontuadoReserva.pontuacao;
        titular.entrou_em_campo = true;
        titular.substituido = true;
        titular.atleta_id = reserva.atleta_id;
        posicoesSubstituidas.add(titular.posicao_id);
      } else {
        titular.pontuacao = 0;
      }
    }
  }

  // Luxury reserve - Priority 1: replace non-playing titular of same position
  //                  Priority 2: replace lowest scorer if all played and RL > lowest
  if (reservaLuxoId) {
    const pontuadoLuxo = atletasPontuados[String(reservaLuxoId)];
    if (pontuadoLuxo && pontuadoLuxo.entrou_em_campo) {
      const luxoReservaInfo = reservas.find((r) => r.atleta_id === reservaLuxoId);
      const luxoPosicaoId = luxoReservaInfo?.posicao_id || pontuadoLuxo.posicao_id;
      const pontosLuxo = pontuadoLuxo.pontuacao;

      const titularesMesmaPosicao = titulares.filter(t => t.posicao_id === luxoPosicaoId);
      
      // Priority 1: A titular of RL's position didn't play and game started
      const titularNaoJogou = titularesMesmaPosicao.find(t => t.jogo_comecou && !t.entrou_em_campo && !t.substituido);
      
      if (titularNaoJogou) {
        const titularOriginalNome = apelidoMap.get(titularNaoJogou.atleta_id) || atletasPontuados[String(titularNaoJogou.atleta_id)]?.apelido || String(titularNaoJogou.atleta_id);
        const substituiuCapitao = titularNaoJogou.eh_capitao;
        titularNaoJogou.pontuacao = pontosLuxo;
        titularNaoJogou.entrou_em_campo = true;
        titularNaoJogou.substituido = true;
        titularNaoJogou.atleta_id = reservaLuxoId;
        titularNaoJogou.eh_reserva_luxo = true;
        if (substituiuCapitao) {
          titularNaoJogou.eh_capitao = true;
        }
        reservaEntrou.set(reservaLuxoId, { substituiu_nome: titularOriginalNome, eh_luxo: true });
      } else {
        // Priority 2: All games started, replace lowest scorer
        const todosJogosComecaram = titularesMesmaPosicao.every(t => t.jogo_comecou);

        if (todosJogosComecaram) {
          const candidatos = titularesMesmaPosicao.filter(t => t.entrou_em_campo);

          if (candidatos.length > 0) {
            const menorPontuador = candidatos.reduce((menor, atual) =>
              atual.pontuacao < menor.pontuacao ? atual : menor
            );

            if (pontosLuxo > menorPontuador.pontuacao) {
              const substituiuNome = apelidoMap.get(menorPontuador.atleta_id) || atletasPontuados[String(menorPontuador.atleta_id)]?.apelido || String(menorPontuador.atleta_id);
              const substituiuCapitao = menorPontuador.eh_capitao;
              menorPontuador.pontuacao = pontosLuxo;
              menorPontuador.atleta_id = reservaLuxoId;
              menorPontuador.eh_reserva_luxo = true;
              menorPontuador.substituido = true;
              if (substituiuCapitao) {
                menorPontuador.eh_capitao = true;
              }
              reservaEntrou.set(reservaLuxoId, { substituiu_nome: substituiuNome, eh_luxo: true });
            }
          }
        }
      }
    }
  }

  // Captain 1.5x
  for (const jogador of titulares) {
    if (jogador.eh_capitao && jogador.entrou_em_campo) {
      jogador.pontuacao = jogador.pontuacao * 1.5;
    }
  }

  // Sum
  const total = titulares.reduce((sum, j) => sum + j.pontuacao, 0);

  // Build detailed titulares
  const atletasDetalhados = titulares.map((t, idx) => {
    const pontuado = atletasPontuados[String(t.atleta_id)];
    const originalId = originalAtletaIds.get(idx);
    const pontuadoOriginal = originalId ? atletasPontuados[String(originalId)] : null;
    const nome = apelidoMap.get(t.atleta_id) || pontuado?.apelido || pontuadoOriginal?.apelido || apelidoMap.get(originalId || 0) || "Atleta";
    const clube = clubeAbreviacao.get(t.clube_id) || String(t.clube_id);
    const posicao = POSICAO_NOME[t.posicao_id] || String(t.posicao_id);

    let status = "ok";
    if (t.jogo_invalido && !t.substituido) {
      status = "jogo_invalido";
    } else if (!t.jogo_comecou) {
      status = "aguardando";
    } else if (!t.entrou_em_campo && !t.substituido) {
      status = "nao_entrou";
    }

    const pontuacaoBase = t.eh_capitao && t.entrou_em_campo
      ? arredondar2Decimais(t.pontuacao / 1.5)
      : arredondar2Decimais(t.pontuacao);
    const pontuacaoFinal = arredondar2Decimais(t.pontuacao);

    return {
      nome,
      clube,
      posicao,
      posicao_id: t.posicao_id,
      pontuacao: pontuacaoFinal,
      pontuacao_base: pontuacaoBase,
      eh_capitao: t.eh_capitao,
      eh_reserva_luxo: t.eh_reserva_luxo,
      substituido: t.substituido && !t.eh_reserva_luxo,
      entrou_como_reserva: t.substituido,
      status,
    };
  });

  // Build detailed reservas
  const reservasDetalhados = reservas.map((r) => {
    const pontuado = atletasPontuados[String(r.atleta_id)];
    const nome = apelidoMap.get(r.atleta_id) || pontuado?.apelido || (r as any).apelido || "Atleta";
    const clubeId = pontuado?.clube_id || (r as any).clube_id || 0;
    const clube = clubeAbreviacao.get(clubeId) || String(clubeId);
    const posicao = POSICAO_NOME[r.posicao_id] || String(r.posicao_id);
    const entrou = reservaEntrou.get(r.atleta_id);
    const ehLuxo = r.atleta_id === reservaLuxoId;

    let status = "banco";
    if (clubesJogoInvalido.has(clubeId)) {
      status = "jogo_invalido";
    } else if (!clubesComJogoIniciado.has(clubeId)) {
      status = "aguardando";
    } else if (pontuado && !pontuado.entrou_em_campo) {
      status = "nao_entrou";
    }

    return {
      nome,
      clube,
      posicao,
      posicao_id: r.posicao_id,
      pontuacao: pontuado ? arredondar2Decimais(pontuado.pontuacao) : null,
      entrou_em_campo: pontuado?.entrou_em_campo || false,
      eh_reserva_luxo: ehLuxo,
      entrou: !!entrou,
      substituiu_nome: entrou?.substituiu_nome || null,
      eh_luxo_entrou: entrou?.eh_luxo || false,
      status,
    };
  });

  return { total, atletasDetalhados, reservasDetalhados };
}
