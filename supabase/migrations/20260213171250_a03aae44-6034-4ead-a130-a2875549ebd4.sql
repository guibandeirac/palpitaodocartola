
-- Drop all restrictive admin policies and replace with permissive ones
-- This allows the anon key to perform writes (admin is protected by client-side password)

-- RODADAS
DROP POLICY IF EXISTS "Admin delete" ON public.rodadas;
DROP POLICY IF EXISTS "Admin insert" ON public.rodadas;
DROP POLICY IF EXISTS "Admin update" ON public.rodadas;
CREATE POLICY "Allow all insert" ON public.rodadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.rodadas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.rodadas FOR DELETE USING (true);

-- CONFRONTOS_EQUIPE
DROP POLICY IF EXISTS "Admin delete" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Admin insert" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Admin update" ON public.confrontos_equipe;
CREATE POLICY "Allow all insert" ON public.confrontos_equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.confrontos_equipe FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.confrontos_equipe FOR DELETE USING (true);

-- CONFRONTOS_INDIVIDUAIS
DROP POLICY IF EXISTS "Admin delete" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Admin insert" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Admin update" ON public.confrontos_individuais;
CREATE POLICY "Allow all insert" ON public.confrontos_individuais FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.confrontos_individuais FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.confrontos_individuais FOR DELETE USING (true);

-- EQUIPES
DROP POLICY IF EXISTS "Admin delete" ON public.equipes;
DROP POLICY IF EXISTS "Admin insert" ON public.equipes;
DROP POLICY IF EXISTS "Admin update" ON public.equipes;
CREATE POLICY "Allow all insert" ON public.equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.equipes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.equipes FOR DELETE USING (true);

-- JOGADORES
DROP POLICY IF EXISTS "Admin delete" ON public.jogadores;
DROP POLICY IF EXISTS "Admin insert" ON public.jogadores;
DROP POLICY IF EXISTS "Admin update" ON public.jogadores;
CREATE POLICY "Allow all insert" ON public.jogadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.jogadores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.jogadores FOR DELETE USING (true);

-- CLASSIFICACAO
DROP POLICY IF EXISTS "Admin delete" ON public.classificacao;
DROP POLICY IF EXISTS "Admin insert" ON public.classificacao;
DROP POLICY IF EXISTS "Admin update" ON public.classificacao;
CREATE POLICY "Allow all insert" ON public.classificacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.classificacao FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.classificacao FOR DELETE USING (true);
