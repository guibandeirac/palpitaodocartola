-- Cache das escalações do Cartola (resposta de /time/id/{id}) por rodada.
--
-- Depois que o mercado fecha, a escalação de cada time não muda mais até o fim
-- da rodada. As edge functions de parciais guardam aqui o time de cada jogador
-- na primeira busca da rodada e, nas próximas, só buscam no Cartola os
-- pontuados e as partidas.
--
-- Só as edge functions (service role) leem e escrevem: RLS ligado e sem
-- policies, então anon e authenticated não têm acesso.

CREATE TABLE public.cartola_times_cache (
  rodada_cartola integer NOT NULL,
  id_cartola bigint NOT NULL,
  dados jsonb NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rodada_cartola, id_cartola)
);

ALTER TABLE public.cartola_times_cache ENABLE ROW LEVEL SECURITY;
