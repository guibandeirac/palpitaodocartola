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
  foto?: string;
  scout?: Record<string, number>;
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
  foto?: string;
}

interface TimeCartola {
  atletas: AtletaTime[];
  reservas?: AtletaTime[];
  capitao_id: number;
  reserva_luxo_id?: number;
  rodada_time_id?: number;
  pontos?: number;
  pontos_campeonato?: number;
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
  substituto_de?: number;
  jogo_comecou: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { rodada_numero } = await req.json();

    if (!rodada_numero) {
      throw new Error("rodada_numero é obrigatório");
    }

    // 1. Buscar rodada
    const { data: rodada, error: rodadaError } = await supabase
      .from("rodadas")
      .select("*")
      .eq("numero", rodada_numero)
      .single();

    if (rodadaError || !rodada) {
      throw new Error(`Rodada ${rodada_numero} não encontrada`);
    }

    const rodadaCartola = rodada.rodada_cartola;
    console.log(`Rodada ${rodada.numero}, Cartola: ${rodadaCartola}`);

    // 2. Buscar confrontos da rodada
    const { data: confrontosEquipe, error: confrontosError } = await supabase
      .from("confrontos_equipe")
      .select(`
        id,
        equipe1_id,
        equipe2_id,
        equipe1:equipes!confrontos_equipe_equipe1_id_fkey(id, nome, logo_url),
        equipe2:equipes!confrontos_equipe_equipe2_id_fkey(id, nome, logo_url),
        confrontos_individuais(
          id,
          ordem,
          confronto_equipe_id,
          jogador1_original_id,
          jogador2_original_id,
          jogador1_original:jogadores!confrontos_individuais_jogador1_original_id_fkey(id, id_cartola, nome, eh_coringa, equipe_id),
          jogador2_original:jogadores!confrontos_individuais_jogador2_original_id_fkey(id, id_cartola, nome, eh_coringa, equipe_id)
        )
      `)
      .eq("rodada_id", rodada.id);

    if (confrontosError) {
      throw new Error(`Erro ao buscar confrontos: ${confrontosError.message}`);
    }

    // 3. Buscar coringas de cada equipe
    const equipesIds = new Set<string>();
    confrontosEquipe?.forEach((ce: any) => {
      if (ce.equipe1_id) equipesIds.add(ce.equipe1_id);
      if (ce.equipe2_id) equipesIds.add(ce.equipe2_id);
    });

    const { data: coringas } = await supabase
      .from("jogadores")
      .select("*")
      .eq("eh_coringa", true)
      .in("equipe_id", Array.from(equipesIds));

    const coringasPorEquipe = new Map<string, any>();
    coringas?.forEach((c: any) => {
      if (c.equipe_id) coringasPorEquipe.set(c.equipe_id, c);
    });

    // 4. Collect all unique id_cartola values
    const todosJogadores = new Map<string, any>();
    confrontosEquipe?.forEach((ce: any) => {
      ce.confrontos_individuais?.forEach((ci: any) => {
        if (ci.jogador1_original) todosJogadores.set(ci.jogador1_original.id, ci.jogador1_original);
        if (ci.jogador2_original) todosJogadores.set(ci.jogador2_original.id, ci.jogador2_original);
      });
    });
    coringas?.forEach((c: any) => {
      todosJogadores.set(c.id, c);
    });

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

    // 5b. Determine which clubs have started their match using periodo_tr from /partidas endpoint
    const clubesComJogoIniciado = new Set<number>();
    const clubesJogoInvalido = new Set<number>(); // clubs with valida = false
    const clubeAbreviacao = new Map<number, string>();
    const statusJogoComecou = ["PRIMEIRO_TEMPO", "INTERVALO", "SEGUNDO_TEMPO", "POS_JOGO"];
    try {
      const partidasResp = await fetch(`https://api.cartola.globo.com/partidas/${rodadaCartola}`);
      if (partidasResp.ok) {
        const partidasData = await partidasResp.json();
        const partidas = partidasData.partidas || partidasData || [];
        // Collect club abbreviations from clubes map if available
        const clubesMap = partidasData.clubes || {};
        for (const [clubeId, clubeInfo] of Object.entries(clubesMap) as any) {
          if (clubeInfo?.abreviacao) {
            clubeAbreviacao.set(Number(clubeId), clubeInfo.abreviacao);
          }
        }
        for (const partida of partidas) {
          if (partida.valida === false) {
            // Track invalid match clubs - these athletes get 0 points and are substitutable
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
      console.error("Erro ao buscar partidas da rodada:", e);
      for (const atletaId of Object.keys(atletasPontuados)) {
        const atleta = atletasPontuados[atletaId];
        if (atleta.clube_id) clubesComJogoIniciado.add(atleta.clube_id);
      }
    }
    console.log(`Clubes com jogo iniciado: ${clubesComJogoIniciado.size} - [${Array.from(clubesComJogoIniciado).join(', ')}]`);
    console.log(`Clubes com jogo inválido: ${clubesJogoInvalido.size} - [${Array.from(clubesJogoInvalido).join(', ')}]`);

    // 6. For each player, fetch their Cartola team
    const timesCartola = new Map<string, TimeCartola>();
    const escalouMap = new Map<string, boolean>();
    const pontosCampeonatoMap = new Map<string, number>();

    // Build a global apelido map from team data (to avoid showing numeric IDs)
    const apelidoMap = new Map<number, string>();
    const fotoMap = new Map<number, string>();

    for (const [jogadorId, jogador] of todosJogadores) {
      try {
        const resp = await fetch(`https://api.cartola.globo.com/time/id/${jogador.id_cartola}`);
        if (resp.ok) {
          const data = await resp.json();
          const rodadaTimeId = data.time?.rodada_time_id || 0;
          const escalou = rodadaTimeId >= (rodadaCartola || 0);
          escalouMap.set(jogadorId, escalou);

          // Store pontos_campeonato
          const pontosCamp = data.pontos_campeonato ?? 0;
          pontosCampeonatoMap.set(jogadorId, arredondar2Decimais(pontosCamp));

          // Store apelidos and fotos from team athletes and reserves
          for (const a of (data.atletas || [])) {
            if (a.apelido) apelidoMap.set(a.atleta_id, a.apelido);
            if (a.foto) fotoMap.set(a.atleta_id, a.foto);
          }
          for (const r of (data.reservas || [])) {
            if (r.apelido) apelidoMap.set(r.atleta_id, r.apelido);
            if (r.foto) fotoMap.set(r.atleta_id, r.foto);
          }

          if (escalou) {
            timesCartola.set(jogadorId, {
              atletas: data.atletas || [],
              reservas: data.reservas || [],
              capitao_id: data.capitao_id,
              reserva_luxo_id: data.reserva_luxo_id,
              rodada_time_id: rodadaTimeId,
              pontos: data.pontos,
              pontos_campeonato: pontosCamp,
            });
          }
        } else {
          escalouMap.set(jogadorId, false);
        }
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error(`Erro ao buscar time de ${jogador.nome}:`, e);
        escalouMap.set(jogadorId, false);
      }
    }

    // Also store apelidos and fotos from pontuados
    for (const [atletaId, atleta] of Object.entries(atletasPontuados)) {
      if (atleta.apelido) apelidoMap.set(Number(atletaId), atleta.apelido);
      if (atleta.foto) fotoMap.set(Number(atletaId), atleta.foto);
    }
    // 7. Calculate partial score for each player's Cartola team
    const pontuacoesParciais = new Map<string, { pontuacao: number; escalou: boolean; detalhes: any }>();

    for (const [jogadorId, jogador] of todosJogadores) {
      const escalou = escalouMap.get(jogadorId) || false;
      if (!escalou) {
        pontuacoesParciais.set(jogadorId, { pontuacao: 0, escalou: false, detalhes: null });
        continue;
      }

      const time = timesCartola.get(jogadorId);
      if (!time) {
        pontuacoesParciais.set(jogadorId, { pontuacao: 0, escalou: false, detalhes: null });
        continue;
      }

      const resultado = calcularPontuacaoTime(time, atletasPontuados, clubesComJogoIniciado, clubesJogoInvalido, clubeAbreviacao, apelidoMap, fotoMap);
      pontuacoesParciais.set(jogadorId, {
        pontuacao: arredondar2Decimais(resultado.total),
        escalou: true,
        detalhes: resultado,
      });
    }

    // 8. Process each team confrontation with coringa logic
    const resultados: any[] = [];

    for (const ce of confrontosEquipe || []) {
      const confrontosIndividuais = (ce.confrontos_individuais || []).sort(
        (a: any, b: any) => a.ordem - b.ordem
      );

      const jogadoresEquipe1 = confrontosIndividuais
        .filter((ci: any) => ci.jogador1_original)
        .map((ci: any) => ({
          confronto_id: ci.id,
          ordem: ci.ordem,
          jogador: ci.jogador1_original,
          pontuacao: pontuacoesParciais.get(ci.jogador1_original.id),
        }));

      const jogadoresEquipe2 = confrontosIndividuais
        .filter((ci: any) => ci.jogador2_original)
        .map((ci: any) => ({
          confronto_id: ci.id,
          ordem: ci.ordem,
          jogador: ci.jogador2_original,
          pontuacao: pontuacoesParciais.get(ci.jogador2_original.id),
        }));

      const coringaE1 = coringasPorEquipe.get(ce.equipe1_id);
      const subsE1 = aplicarCoringa(jogadoresEquipe1, coringaE1, pontuacoesParciais, rodadaCartola || 0);

      const coringaE2 = coringasPorEquipe.get(ce.equipe2_id);
      const subsE2 = aplicarCoringa(jogadoresEquipe2, coringaE2, pontuacoesParciais, rodadaCartola || 0);

      let vitoriasE1 = 0;
      let vitoriasE2 = 0;
      const individuais: any[] = [];

      for (const ci of confrontosIndividuais) {
        const sub1 = subsE1.get(ci.id);
        const sub2 = subsE2.get(ci.id);

        const jogador1Original = ci.jogador1_original;
        const jogador2Original = ci.jogador2_original;

        const pontos1 = arredondar2Decimais(
          sub1?.pontuacao ?? pontuacoesParciais.get(ci.jogador1_original_id)?.pontuacao ?? 0
        );
        const pontos2 = arredondar2Decimais(
          sub2?.pontuacao ?? pontuacoesParciais.get(ci.jogador2_original_id)?.pontuacao ?? 0
        );

        const pontosCamp1 = pontosCampeonatoMap.get(ci.jogador1_original_id) ?? 0;
        const pontosCamp2 = pontosCampeonatoMap.get(ci.jogador2_original_id) ?? 0;

        let vencedor: string | null = null;
        if (pontos1 > pontos2) {
          vencedor = "jogador1";
          vitoriasE1++;
        } else if (pontos2 > pontos1) {
          vencedor = "jogador2";
          vitoriasE2++;
        } else {
          // Tiebreaker: pontos_campeonato
          if (pontosCamp1 > pontosCamp2) {
            vencedor = "jogador1";
            vitoriasE1++;
          } else if (pontosCamp2 > pontosCamp1) {
            vencedor = "jogador2";
            vitoriasE2++;
          }
          // If still tied, vencedor stays null (true draw)
        }

        const escalou1 = pontuacoesParciais.get(ci.jogador1_original_id)?.escalou ?? false;
        const escalou2 = pontuacoesParciais.get(ci.jogador2_original_id)?.escalou ?? false;

        const detalhes1 = pontuacoesParciais.get(ci.jogador1_original_id)?.detalhes;
        const detalhes2 = pontuacoesParciais.get(ci.jogador2_original_id)?.detalhes;

        individuais.push({
          id: ci.id,
          ordem: ci.ordem,
          jogador1: {
            id: jogador1Original?.id,
            nome: sub1?.coringa ? sub1.coringaNome : jogador1Original?.nome,
            pontuacao: pontos1,
            eh_coringa: !!sub1?.coringa,
            escalou: sub1?.coringa ? true : escalou1,
            jogador_original_nome: sub1?.coringa ? jogador1Original?.nome : null,
            pontos_campeonato: pontosCamp1,
            atletas: detalhes1?.atletasDetalhados || null,
            reservas: detalhes1?.reservasDetalhados || null,
          },
          jogador2: {
            id: jogador2Original?.id,
            nome: sub2?.coringa ? sub2.coringaNome : jogador2Original?.nome,
            pontuacao: pontos2,
            eh_coringa: !!sub2?.coringa,
            escalou: sub2?.coringa ? true : escalou2,
            jogador_original_nome: sub2?.coringa ? jogador2Original?.nome : null,
            pontos_campeonato: pontosCamp2,
            atletas: detalhes2?.atletasDetalhados || null,
            reservas: detalhes2?.reservasDetalhados || null,
          },
          vencedor,
        });
      }

      resultados.push({
        id: ce.id,
        equipe1: { id: (ce as any).equipe1?.id, nome: (ce as any).equipe1?.nome },
        equipe2: { id: (ce as any).equipe2?.id, nome: (ce as any).equipe2?.nome },
        vitorias_equipe1: vitoriasE1,
        vitorias_equipe2: vitoriasE2,
        confrontos_individuais: individuais,
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
      JSON.stringify({ success: false, error: "Erro ao calcular parciais. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calcularPontuacaoTime(
  time: TimeCartola,
  atletasPontuados: Record<string, AtletaPontuado>,
  clubesComJogoIniciado: Set<number>,
  clubesJogoInvalido: Set<number>,
  clubeAbreviacao: Map<number, string>,
  apelidoMap: Map<number, string>,
  fotoMap: Map<number, string>
): { total: number; jogadoresAtivos: JogadorAtivo[]; atletasDetalhados: any[]; reservasDetalhados: any[] } {
  const capitaoId = time.capitao_id;
  const reservaLuxoId = time.reserva_luxo_id;

  const originalAtletaIds = new Map<number, number>();

  // 2a. Mount titulares
  const titulares: (JogadorAtivo & { jogo_invalido: boolean })[] = (time.atletas || []).map((a, idx) => {
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

  // Track which reserves entered and who they replaced
  const reservaEntrou = new Map<number, { substituiu_nome: string; eh_luxo: boolean }>();

  // 2b. Position-based substitutions (SKIP the RL - handle separately)
  const reservas = time.reservas || [];
  const posicoesSubstituidas = new Set<number>();

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
        titular.substituto_de = titular.atleta_id;
        titular.atleta_id = reserva.atleta_id;
        posicoesSubstituidas.add(titular.posicao_id);
      } else {
        titular.pontuacao = 0;
      }
    }
  }

  // 2c. Luxury reserve - Priority 1: replace non-playing titular of same position
  //                      Priority 2: replace lowest scorer if all played and RL > lowest
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

  // 2d. Captain 1.5x
  for (const jogador of titulares) {
    if (jogador.eh_capitao && jogador.entrou_em_campo) {
      jogador.pontuacao = jogador.pontuacao * 1.5;
    }
  }

  // 2e. Sum
  const total = titulares.reduce((sum, j) => sum + j.pontuacao, 0);

  // 2f. Build detailed titulares list
  // Also track which original titulares were replaced (for "↓ saiu" display)
  const titularSubstituido = new Map<number, { reserva_nome: string }>(); // originalAtletaId -> info
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

    // If this titular was substituted, track the original
    if (t.substituido && originalId && originalId !== t.atleta_id) {
      const originalNome = apelidoMap.get(originalId) || pontuadoOriginal?.apelido || "Atleta";
      const reservaNome = apelidoMap.get(t.atleta_id) || pontuado?.apelido || "Atleta";
      titularSubstituido.set(originalId, { reserva_nome: reservaNome });
    }

    const pontuacaoBase = t.eh_capitao && t.entrou_em_campo
      ? arredondar2Decimais(t.pontuacao / 1.5)
      : arredondar2Decimais(t.pontuacao);
    const pontuacaoFinal = arredondar2Decimais(t.pontuacao);
    const foto = fotoMap.get(t.atleta_id) || (originalId ? fotoMap.get(originalId) : null) || null;

    return {
      nome,
      clube,
      posicao,
      posicao_id: t.posicao_id,
      foto,
      pontuacao: pontuacaoFinal,
      pontuacao_base: pontuacaoBase,
      eh_capitao: t.eh_capitao,
      eh_reserva_luxo: t.eh_reserva_luxo,
      substituido: t.substituido && !t.eh_reserva_luxo,
      entrou_como_reserva: t.substituido, // this slot was filled by a reserve
      status,
    };
  });

  // 2g. Build detailed reservas list
  const reservasDetalhados = reservas.map((r) => {
    const pontuado = atletasPontuados[String(r.atleta_id)];
    const nome = apelidoMap.get(r.atleta_id) || pontuado?.apelido || r.apelido || "Atleta";
    const clubeId = pontuado?.clube_id || r.clube_id || 0;
    const clube = clubeAbreviacao.get(clubeId) || String(clubeId);
    const posicao = POSICAO_NOME[r.posicao_id] || String(r.posicao_id);
    const entrou = reservaEntrou.get(r.atleta_id);
    const ehLuxo = r.atleta_id === reservaLuxoId;

    let status = "banco"; // sitting on bench
    if (clubesJogoInvalido.has(clubeId)) {
      status = "jogo_invalido";
    } else if (!clubesComJogoIniciado.has(clubeId)) {
      status = "aguardando";
    } else if (pontuado && !pontuado.entrou_em_campo) {
      status = "nao_entrou";
    }

    const foto = fotoMap.get(r.atleta_id) || null;

    return {
      nome,
      clube,
      posicao,
      posicao_id: r.posicao_id,
      foto,
      pontuacao: pontuado ? arredondar2Decimais(pontuado.pontuacao) : null,
      entrou_em_campo: pontuado?.entrou_em_campo || false,
      eh_reserva_luxo: ehLuxo,
      entrou: !!entrou,
      substituiu_nome: entrou?.substituiu_nome || null,
      eh_luxo_entrou: entrou?.eh_luxo || false,
      status,
    };
  });

  return { total, jogadoresAtivos: titulares, atletasDetalhados, reservasDetalhados };
}
function aplicarCoringa(
  jogadores: Array<{ confronto_id: string; ordem: number; jogador: any; pontuacao: any }>,
  coringa: any | undefined,
  pontuacoesParciais: Map<string, any>,
  rodadaCartola: number
): Map<string, { pontuacao: number; coringa: boolean; coringaNome: string }> {
  const subs = new Map<string, { pontuacao: number; coringa: boolean; coringaNome: string }>();

  if (!coringa) return subs;

  const pontuacaoCoringa = pontuacoesParciais.get(coringa.id);
  if (!pontuacaoCoringa) return subs;

  const pontosCoringa = arredondar2Decimais(pontuacaoCoringa.pontuacao);

  const naoEscalou = jogadores.find((j) => !j.pontuacao?.escalou);

  if (naoEscalou) {
    subs.set(naoEscalou.confronto_id, {
      pontuacao: pontosCoringa,
      coringa: true,
      coringaNome: coringa.nome,
    });
  } else {
    const menorPontuador = jogadores.reduce((menor, atual) => {
      const pontosMenor = menor.pontuacao?.pontuacao ?? Infinity;
      const pontosAtual = atual.pontuacao?.pontuacao ?? Infinity;
      return pontosAtual < pontosMenor ? atual : menor;
    }, jogadores[0]);

    if (menorPontuador && pontosCoringa > (menorPontuador.pontuacao?.pontuacao ?? 0)) {
      subs.set(menorPontuador.confronto_id, {
        pontuacao: pontosCoringa,
        coringa: true,
        coringaNome: coringa.nome,
      });
    }
  }

  return subs;
}
