
-- Drop all permissive write policies on all tables
-- and replace with admin-only policies using has_role()

-- === rodadas ===
DROP POLICY IF EXISTS "Allow all insert" ON public.rodadas;
DROP POLICY IF EXISTS "Allow all update" ON public.rodadas;
DROP POLICY IF EXISTS "Allow all delete" ON public.rodadas;

CREATE POLICY "Admin insert" ON public.rodadas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.rodadas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.rodadas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === confrontos_equipe ===
DROP POLICY IF EXISTS "Allow all insert" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Allow all update" ON public.confrontos_equipe;
DROP POLICY IF EXISTS "Allow all delete" ON public.confrontos_equipe;

CREATE POLICY "Admin insert" ON public.confrontos_equipe FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.confrontos_equipe FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.confrontos_equipe FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === confrontos_individuais ===
DROP POLICY IF EXISTS "Allow all insert" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Allow all update" ON public.confrontos_individuais;
DROP POLICY IF EXISTS "Allow all delete" ON public.confrontos_individuais;

CREATE POLICY "Admin insert" ON public.confrontos_individuais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.confrontos_individuais FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.confrontos_individuais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === equipes ===
DROP POLICY IF EXISTS "Allow all insert" ON public.equipes;
DROP POLICY IF EXISTS "Allow all update" ON public.equipes;
DROP POLICY IF EXISTS "Allow all delete" ON public.equipes;

CREATE POLICY "Admin insert" ON public.equipes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.equipes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.equipes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === jogadores ===
DROP POLICY IF EXISTS "Allow all insert" ON public.jogadores;
DROP POLICY IF EXISTS "Allow all update" ON public.jogadores;
DROP POLICY IF EXISTS "Allow all delete" ON public.jogadores;

CREATE POLICY "Admin insert" ON public.jogadores FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.jogadores FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.jogadores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === classificacao ===
DROP POLICY IF EXISTS "Allow all insert" ON public.classificacao;
DROP POLICY IF EXISTS "Allow all update" ON public.classificacao;
DROP POLICY IF EXISTS "Allow all delete" ON public.classificacao;

CREATE POLICY "Admin insert" ON public.classificacao FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.classificacao FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.classificacao FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === copa_rodadas ===
DROP POLICY IF EXISTS "Allow all insert" ON public.copa_rodadas;
DROP POLICY IF EXISTS "Allow all update" ON public.copa_rodadas;
DROP POLICY IF EXISTS "Allow all delete" ON public.copa_rodadas;

CREATE POLICY "Admin insert" ON public.copa_rodadas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.copa_rodadas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.copa_rodadas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === copa_confrontos ===
DROP POLICY IF EXISTS "Allow all insert" ON public.copa_confrontos;
DROP POLICY IF EXISTS "Allow all update" ON public.copa_confrontos;
DROP POLICY IF EXISTS "Allow all delete" ON public.copa_confrontos;

CREATE POLICY "Admin insert" ON public.copa_confrontos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.copa_confrontos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.copa_confrontos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === copa_classificacao ===
DROP POLICY IF EXISTS "Allow all insert" ON public.copa_classificacao;
DROP POLICY IF EXISTS "Allow all update" ON public.copa_classificacao;
DROP POLICY IF EXISTS "Allow all delete" ON public.copa_classificacao;

CREATE POLICY "Admin insert" ON public.copa_classificacao FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.copa_classificacao FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.copa_classificacao FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === copa_pontuacoes ===
DROP POLICY IF EXISTS "Allow all insert" ON public.copa_pontuacoes;
DROP POLICY IF EXISTS "Allow all update" ON public.copa_pontuacoes;
DROP POLICY IF EXISTS "Allow all delete" ON public.copa_pontuacoes;

CREATE POLICY "Admin insert" ON public.copa_pontuacoes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.copa_pontuacoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.copa_pontuacoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === copa_playoffs ===
DROP POLICY IF EXISTS "Allow all insert" ON public.copa_playoffs;
DROP POLICY IF EXISTS "Allow all update" ON public.copa_playoffs;
DROP POLICY IF EXISTS "Allow all delete" ON public.copa_playoffs;

CREATE POLICY "Admin insert" ON public.copa_playoffs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.copa_playoffs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.copa_playoffs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
