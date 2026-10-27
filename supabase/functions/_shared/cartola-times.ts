import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LIMITE_REQUISICOES_SIMULTANEAS = 8;
const STATUS_MERCADO_FECHADO = 2;

// Marca quando cada etapa terminou (ms desde o início da requisição) para o
// header Server-Timing, visível na aba Network do navegador.
export function criarCronometro() {
  const inicio = performance.now();
  const marcas: string[] = [];
  return {
    marcar(nome: string) {
      marcas.push(`${nome};dur=${Math.round(performance.now() - inicio)}`);
    },
    header() {
      return marcas.join(", ");
    },
  };
}

// Retorna o JSON da resposta, ou null se o status não for OK.
// Erros de rede são propagados.
export async function buscarJson(url: string): Promise<any> {
  const resp = await fetch(url);
  if (!resp.ok) {
    await resp.body?.cancel();
    return null;
  }
  return await resp.json();
}

// Status do mercado ({ rodada_atual, status_mercado }), ou null se falhar.
export async function buscarStatusMercado(): Promise<any> {
  try {
    return await buscarJson("https://api.cartola.globo.com/mercado/status");
  } catch (e) {
    console.error("Erro ao buscar status do mercado:", e);
    return null;
  }
}

// A rodada já terminou quando o Cartola está numa rodada posterior — com o
// mercado aberto, rodada_atual já é a próxima a ser jogada.
export function rodadaEncerrada(statusMercado: any, rodadaCartola: number): boolean {
  return !!statusMercado?.rodada_atual && rodadaCartola < statusMercado.rodada_atual;
}

// Rodada encerrada: pontuação completa da rodada. Ao vivo: /atletas/pontuados,
// que só traz a rodada em andamento.
export function buscarPontuados(rodadaCartola: number, encerrada: boolean): Promise<any> {
  return buscarJson(
    encerrada
      ? `https://api.cartola.globo.com/atletas/pontuados/${rodadaCartola}`
      : "https://api.cartola.globo.com/atletas/pontuados"
  );
}

// Como Array.map assíncrono, mas com no máximo `limite` chamadas em andamento.
// Mantém a ordem dos itens no resultado.
async function mapComLimite<T, R>(itens: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  const workers = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i]);
    }
  });
  await Promise.all(workers);
  return resultados;
}

// A escalação só está travada com o mercado fechado da própria rodada ou
// depois que ela terminou — só aí é seguro guardar o time no cache.
function podeGravarCache(status: any, rodadaCartola: number): boolean {
  if (rodadaEncerrada(status, rodadaCartola)) return true;
  return status?.status_mercado === STATUS_MERCADO_FECHADO && status?.rodada_atual === rodadaCartola;
}

// A tabela cartola_times_cache só é acessível com a service role.
function clienteServico() {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return serviceRoleKey ? createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey) : null;
}

// A resposta de /time/id tem ~10 KB por time; as parciais só usam estes
// campos (~3x menor), o que deixa o cache bem mais rápido de ler.
function compactarAtleta(a: any) {
  return { atleta_id: a.atleta_id, apelido: a.apelido, foto: a.foto, posicao_id: a.posicao_id, clube_id: a.clube_id };
}

// oficial = veio de /time/id/{id}/{rodada} com a rodada encerrada: a
// escalação já tem as substituições feitas pelo Cartola e `pontos` é o total.
function compactarTime(data: any, oficial = !!data.oficial) {
  return {
    oficial,
    time: { rodada_time_id: data.time?.rodada_time_id },
    pontos: data.pontos,
    pontos_campeonato: data.pontos_campeonato,
    capitao_id: data.capitao_id,
    reserva_luxo_id: data.reserva_luxo_id,
    atletas: (data.atletas || []).map(compactarAtleta),
    reservas: (data.reservas || []).map(compactarAtleta),
  };
}

// Cópia em memória do que já está gravado no cache (rodada_cartola ->
// id_cartola -> time). Vale enquanto a função estiver aquecida; como a
// escalação gravada não muda mais, não precisa expirar.
const memoria = new Map<number, Map<number, any>>();

function guardarNaMemoria(rodadaCartola: number, times: Map<number, any>) {
  if (!memoria.has(rodadaCartola)) memoria.set(rodadaCartola, new Map());
  const daRodada = memoria.get(rodadaCartola)!;
  times.forEach((dados, idCartola) => daRodada.set(idCartola, dados));
}

// Lê do banco as escalações guardadas da rodada (todas, ou só os ids pedidos).
async function lerDoBanco(rodadaCartola: number, idsCartola?: number[]): Promise<Map<number, any>> {
  const times = new Map<number, any>();
  const supabase = clienteServico();
  if (!supabase) return times;
  try {
    let query = supabase
      .from("cartola_times_cache")
      .select("id_cartola, dados")
      .eq("rodada_cartola", rodadaCartola);
    if (idsCartola) query = query.in("id_cartola", idsCartola);
    const { data: linhas, error } = await query;
    if (error) console.error("Erro ao ler cache de times:", error.message);
    linhas?.forEach((l: any) => times.set(Number(l.id_cartola), compactarTime(l.dados)));
  } catch (e) {
    console.error("Erro ao ler cache de times:", e);
  }
  guardarNaMemoria(rodadaCartola, times);
  return times;
}

// Escalações já guardadas da rodada (id_cartola -> time compactado). Não
// depende da lista de jogadores, então pode começar junto com as outras
// consultas. Se a função está aquecida, vem da memória sem ir ao banco.
// Nunca rejeita: em caso de erro, devolve o cache vazio.
export async function lerCacheTimes(rodadaCartola: number): Promise<{ times: Map<number, any>; daMemoria: boolean }> {
  if (!rodadaCartola) return { times: new Map(), daMemoria: false };
  const naMemoria = memoria.get(rodadaCartola);
  if (naMemoria && naMemoria.size > 0) return { times: new Map(naMemoria), daMemoria: true };
  return { times: await lerDoBanco(rodadaCartola), daMemoria: false };
}

// Busca o time de cada jogador no Cartola. data = null quando a busca falha.
// Usa o cache de escalações da rodada (memória e tabela cartola_times_cache)
// e só vai ao Cartola para os jogadores que ainda não estão nele.
export async function buscarTimes(
  jogadores: Map<string, any>,
  rodadaCartola: number,
  cachePromise = lerCacheTimes(rodadaCartola),
  statusPromise = buscarStatusMercado()
): Promise<{ jogadorId: string; data: any }[]> {
  const lista = Array.from(jogadores);
  const { times: cache, daMemoria } = await cachePromise;
  const idDe = (jogador: any) => Number(jogador.id_cartola);

  let faltando = lista.filter(([, j]) => !cache.has(idDe(j)));

  // A memória pode ter só parte da rodada (outra função gravou o resto)
  if (faltando.length > 0 && daMemoria) {
    const doBanco = await lerDoBanco(rodadaCartola, faltando.map(([, j]) => idDe(j)));
    doBanco.forEach((dados, idCartola) => cache.set(idCartola, dados));
    faltando = faltando.filter(([, j]) => !cache.has(idDe(j)));
  }
  console.log(`Times no cache: ${lista.length - faltando.length}/${lista.length}`);

  if (faltando.length > 0) {
    const status = await statusPromise;
    // Rodada encerrada: a escalação daquela rodada, não a atual
    const oficial = rodadaEncerrada(status, rodadaCartola);
    const sufixo = oficial ? `/${rodadaCartola}` : "";

    const buscados = await mapComLimite(faltando, LIMITE_REQUISICOES_SIMULTANEAS, async ([, jogador]) => {
      try {
        const data = await buscarJson(`https://api.cartola.globo.com/time/id/${jogador.id_cartola}${sufixo}`);
        return { idCartola: idDe(jogador), data: data ? compactarTime(data, oficial) : null };
      } catch (e) {
        console.error(`Erro ao buscar time de ${jogador.nome}:`, e);
        return { idCartola: idDe(jogador), data: null };
      }
    });

    const novos = new Map<number, any>();
    buscados.forEach((b) => b.data && novos.set(b.idCartola, b.data));
    novos.forEach((dados, idCartola) => cache.set(idCartola, dados));

    const supabase = clienteServico();
    if (supabase && novos.size > 0 && rodadaCartola && podeGravarCache(status, rodadaCartola)) {
      const { error } = await supabase
        .from("cartola_times_cache")
        .upsert(Array.from(novos, ([idCartola, dados]) => ({ rodada_cartola: rodadaCartola, id_cartola: idCartola, dados })));
      if (error) {
        console.error("Erro ao gravar cache de times:", error.message);
      } else {
        guardarNaMemoria(rodadaCartola, novos);
        console.log(`Times gravados no cache: ${novos.size}`);
      }
    }
  }

  return lista.map(([jogadorId, jogador]) => ({ jogadorId, data: cache.get(idDe(jogador)) ?? null }));
}
