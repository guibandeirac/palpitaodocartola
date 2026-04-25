
-- Drop existing restrictive write policies and replace with permissive ones for all admin tables

-- rodadas
DROP POLICY IF EXISTS "Admin delete" ON public.rodadas;
DROP POLICY IF EXISTS "Admin insert" ON public.rodadas;
DROP POLICY IF EXISTS "Admin update" ON public.rodadas;
CREATE POLICY "Allow all insert" ON public.rodadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.rodadas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.rodadas FOR DELETE USING (true);

-- copa_rodadas
DROP POLICY IF EXISTS "Admin delete" ON public.copa_rodadas;
DROP POLICY IF EXISTS "Admin insert" ON public.copa_rodadas;
DROP POLICY IF EXISTS "Admin update" ON public.copa_rodadas;
CREATE POLICY "Allow all insert" ON public.copa_rodadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_rodadas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_rodadas FOR DELETE USING (true);

-- copa_confrontos
DROP POLICY IF EXISTS "Admin delete" ON public.copa_confrontos;
DROP POLICY IF EXISTS "Admin insert" ON public.copa_confrontos;
DROP POLICY IF EXISTS "Admin update" ON public.copa_confrontos;
CREATE POLICY "Allow all insert" ON public.copa_confrontos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_confrontos FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_confrontos FOR DELETE USING (true);

-- copa_classificacao
DROP POLICY IF EXISTS "Admin delete" ON public.copa_classificacao;
DROP POLICY IF EXISTS "Admin insert" ON public.copa_classificacao;
DROP POLICY IF EXISTS "Admin update" ON public.copa_classificacao;
CREATE POLICY "Allow all insert" ON public.copa_classificacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_classificacao FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_classificacao FOR DELETE USING (true);

-- copa_pontuacoes
DROP POLICY IF EXISTS "Admin delete" ON public.copa_pontuacoes;
DROP POLICY IF EXISTS "Admin insert" ON public.copa_pontuacoes;
DROP POLICY IF EXISTS "Admin update" ON public.copa_pontuacoes;
CREATE POLICY "Allow all insert" ON public.copa_pontuacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_pontuacoes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_pontuacoes FOR DELETE USING (true);

-- copa_playoffs
DROP POLICY IF EXISTS "Admin delete" ON public.copa_playoffs;
DROP POLICY IF EXISTS "Admin insert" ON public.copa_playoffs;
DROP POLICY IF EXISTS "Admin update" ON public.copa_playoffs;
CREATE POLICY "Allow all insert" ON public.copa_playoffs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_playoffs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_playoffs FOR DELETE USING (true);

-- classificacao
DROP POLICY IF EXISTS "Admin delete" ON public.classificacao;
DROP POLICY IF EXISTS "Admin insert" ON public.classificacao;
DROP POLICY IF EXISTS "Admin update" ON public.classificacao;
CREATE POLICY "Allow all insert" ON public.classificacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.classificacao FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.classificacao FOR DELETE USING (true);

-- confrontos_equipe
DROP POLICY IF EXISTS "Admin delete" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Admin insert" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Admin update" ON public.confrontos_equipe;
CREATE POLICY "Allow all insert" ON public.confrontos_equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.confrontos_equipe FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.confrontos_equipe FOR DELETE USING (true);

-- confrontos_individuais
DROP POLICY IF EXISTS "Admin delete" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Admin insert" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Admin update" ON public.confrontos_individuais;
CREATE POLICY "Allow all insert" ON public.confrontos_individuais FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.confrontos_individuais FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.confrontos_individuais FOR DELETE USING (true);

-- equipes
DROP POLICY IF EXISTS "Admin delete" ON public.equipes;
DROP POLICY IF EXISTS "Admin insert" ON public.equipes;
DROP POLICY IF EXISTS "Admin update" ON public.equipes;
CREATE POLICY "Allow all insert" ON public.equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.equipes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.equipes FOR DELETE USING (true);

-- jogadores
DROP POLICY IF EXISTS "Admin delete" ON public.jogadores;
DROP POLICY IF EXISTS "Admin insert" ON public.jogadores;
DROP POLICY IF EXISTS "Admin update" ON public.jogadores;
CREATE POLICY "Allow all insert" ON public.jogadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.jogadores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.jogadores FOR DELETE USING (true);
