-- Adiciona status independente por série na tabela rodadas.
-- Série A é "só ao vivo" (status_a só usa pendente/em_andamento).
-- Série B usa pendente/em_andamento/finalizada e alimenta classificação.

ALTER TABLE public.rodadas
  ADD COLUMN IF NOT EXISTS status_a TEXT NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS status_b TEXT NOT NULL DEFAULT 'pendente';

UPDATE public.rodadas
SET status_a = COALESCE(status, 'pendente'),
    status_b = COALESCE(status, 'pendente')
WHERE status_a = 'pendente' AND status_b = 'pendente';

-- status_a não tem estado "finalizada" (Série A não tem classificação).
-- Convertemos qualquer 'finalizada' herdada para 'em_andamento' por enquanto;
-- o admin pode ajustar manualmente em /admin.
UPDATE public.rodadas
SET status_a = 'em_andamento'
WHERE status_a = 'finalizada';
