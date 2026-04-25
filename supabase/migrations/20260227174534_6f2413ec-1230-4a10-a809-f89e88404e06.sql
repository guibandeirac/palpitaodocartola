-- Add serie column to equipes table
ALTER TABLE public.equipes ADD COLUMN serie text NOT NULL DEFAULT 'A';

-- Update the column comment
COMMENT ON COLUMN public.equipes.serie IS 'Serie da equipe: A ou B';