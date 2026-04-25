-- RLS admin-only for domain tables.
-- Public SELECT (leaderboards, parciais are public).
-- INSERT/UPDATE/DELETE only for authenticated users with role 'admin' (uses has_role()).

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'rodadas',
    'equipes',
    'jogadores',
    'confrontos_equipe',
    'confrontos_individuais',
    'classificacao',
    'copa_rodadas',
    'copa_confrontos',
    'copa_pontuacoes',
    'copa_classificacao',
    'copa_playoffs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can delete" ON public.%I', t);

    EXECUTE format($p$CREATE POLICY "Public read access" ON public.%I FOR SELECT USING (true)$p$, t);
    EXECUTE format($p$CREATE POLICY "Admins can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role))$p$, t);
    EXECUTE format($p$CREATE POLICY "Admins can update" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role))$p$, t);
    EXECUTE format($p$CREATE POLICY "Admins can delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))$p$, t);
  END LOOP;
END $$;
