-- Corrige registros em confrontos_individuais onde vencedor foi gravado como a
-- string "empate" em vez de NULL. Isso acontecia por um bug no AdminPontuacoes
-- que usava 'empate' como fallback de empate em vez do valor correto NULL.
--
-- A lógica de correção:
--   pontuacao_jogador1 > pontuacao_jogador2  → 'jogador1'
--   pontuacao_jogador2 > pontuacao_jogador1  → 'jogador2'
--   iguais (ou ambos NULL)                   → NULL

UPDATE confrontos_individuais
SET vencedor =
  CASE
    WHEN pontuacao_jogador1 > pontuacao_jogador2 THEN 'jogador1'
    WHEN pontuacao_jogador2 > pontuacao_jogador1 THEN 'jogador2'
    ELSE NULL
  END
WHERE vencedor = 'empate';
