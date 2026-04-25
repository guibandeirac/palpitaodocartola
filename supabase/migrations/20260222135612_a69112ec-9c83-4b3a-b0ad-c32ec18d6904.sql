-- Enable RLS and add policies for copa tables

ALTER TABLE public.copa_rodadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.copa_rodadas FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.copa_rodadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_rodadas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_rodadas FOR DELETE USING (true);

ALTER TABLE public.copa_confrontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.copa_confrontos FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.copa_confrontos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_confrontos FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_confrontos FOR DELETE USING (true);

ALTER TABLE public.copa_classificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.copa_classificacao FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.copa_classificacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_classificacao FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_classificacao FOR DELETE USING (true);

ALTER TABLE public.copa_pontuacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.copa_pontuacoes FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.copa_pontuacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_pontuacoes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_pontuacoes FOR DELETE USING (true);

ALTER TABLE public.copa_playoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.copa_playoffs FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.copa_playoffs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.copa_playoffs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.copa_playoffs FOR DELETE USING (true);

ALTER TABLE public.competicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.competicoes FOR SELECT USING (true);
