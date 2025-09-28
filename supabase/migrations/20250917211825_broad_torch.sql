/*
  # Table extractions pour workflow company-intake

  1. Nouvelles Tables
    - `extractions`
      - `id` (uuid, primary key)
      - `request_id` (text, unique)
      - `org_id` (text)
      - `processing_stage` (text, enum)
      - `values` (jsonb, données extraites)
      - `confidence` (jsonb, scores de confiance)
      - `validation` (jsonb, résultats validation)
      - `errors` (text[], erreurs)
      - `source` (text, méthode extraction)
      - Colonnes matérialisées pour requêtes rapides
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `extractions`
    - Politiques pour accès public (à adapter selon auth)

  3. Fonctions
    - Trigger pour synchroniser colonnes plates depuis JSONB
*/

-- Table de stockage des extractions
CREATE TABLE IF NOT EXISTS public.extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  org_id text NOT NULL,
  processing_stage text NOT NULL CHECK (processing_stage IN ('READY_FOR_REVIEW','EXTRACT_FAILED','VALIDATION_FAILED')),
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation jsonb,
  errors text[] NOT NULL DEFAULT '{}',
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_extractions_org_stage ON public.extractions(org_id, processing_stage);
CREATE INDEX IF NOT EXISTS idx_extractions_created_at ON public.extractions(created_at);
CREATE INDEX IF NOT EXISTS idx_extractions_request_id ON public.extractions(request_id);

-- Colonnes matérialisées (facultatives) pour requêtes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extractions' AND column_name = 'nom_entreprise'
  ) THEN
    ALTER TABLE public.extractions
      ADD COLUMN nom_entreprise text,
      ADD COLUMN adresse text,
      ADD COLUMN telephones text[],
      ADD COLUMN emails text[],
      ADD COLUMN website text,
      ADD COLUMN ice text,
      ADD COLUMN rc text,
      ADD COLUMN forme_juridique text,
      ADD COLUMN capital_social numeric;
  END IF;
END $$;

-- Trigger pour remplir les colonnes à plat à l'insert/update
CREATE OR REPLACE FUNCTION public.extractions_sync_flat_columns() RETURNS trigger AS $$
BEGIN
  NEW.nom_entreprise   := COALESCE(NEW.values->>'nom_entreprise', null);
  NEW.adresse          := COALESCE(NEW.values->>'adresse', null);
  NEW.telephones       := (SELECT array(SELECT jsonb_array_elements_text(COALESCE(NEW.values->'telephones', '[]'::jsonb))));
  NEW.emails           := (SELECT array(SELECT jsonb_array_elements_text(COALESCE(NEW.values->'emails', '[]'::jsonb))));
  NEW.website          := COALESCE(NEW.values->>'website', null);
  NEW.ice              := COALESCE(NEW.values->>'ice', null);
  NEW.rc               := COALESCE(NEW.values->>'rc', null);
  NEW.forme_juridique  := COALESCE(NEW.values->>'forme_juridique', null);
  NEW.capital_social   := NULLIF(NEW.values->>'capital_social','')::numeric;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_extractions_sync ON public.extractions;
CREATE TRIGGER trg_extractions_sync
BEFORE INSERT OR UPDATE ON public.extractions
FOR EACH ROW EXECUTE FUNCTION public.extractions_sync_flat_columns();

-- RLS
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='extractions_select' AND tablename='extractions') THEN
    CREATE POLICY extractions_select ON public.extractions
    FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='extractions_insert' AND tablename='extractions') THEN
    CREATE POLICY extractions_insert ON public.extractions
    FOR INSERT WITH CHECK (true);
  END IF;
END $$;