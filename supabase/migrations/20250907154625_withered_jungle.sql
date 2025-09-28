/*
  # Intégration workflows n8n - Tables pour templates et tracking

  1. Nouvelles tables
    - `quote_templates` - Templates de devis personnalisés
    - `branding_assets` - Assets de branding (logos, couleurs)
    - Colonnes ajoutées à `devis` pour intégration n8n

  2. Storage buckets
    - `templates` - Stockage des templates PDF/images
    - `logos` - Logos d'entreprise
    - `quotes` - PDFs générés

  3. Sécurité
    - Politiques RLS pour les nouvelles tables
    - Politiques d'accès Storage publiques
*/

-- 1. Templates de devis
CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  html_template TEXT NOT NULL,
  css_vars JSONB DEFAULT '{}',
  placeholders JSONB DEFAULT '{}',
  background_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Assets de branding  
CREATE TABLE IF NOT EXISTS branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  palette JSONB DEFAULT '{}',
  fonts JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ajouter colonnes à la table devis existante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE devis ADD COLUMN template_id UUID REFERENCES quote_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE devis ADD COLUMN pdf_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE devis ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'meta'
  ) THEN
    ALTER TABLE devis ADD COLUMN meta JSONB DEFAULT '{}';
  END IF;
END $$;

-- 4. Activer RLS
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS (accès public pour simplifier)
CREATE POLICY "Public access quote_templates"
  ON quote_templates
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access branding_assets"
  ON branding_assets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 6. Créer les buckets Storage (ignore si existent déjà)
INSERT INTO storage.buckets (id, name, public) VALUES 
('templates', 'templates', true),
('logos', 'logos', true),
('quotes', 'quotes', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Politiques d'accès Storage
DO $$
BEGIN
  -- Templates
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read templates'
  ) THEN
    CREATE POLICY "Public read templates" ON storage.objects 
    FOR SELECT USING (bucket_id = 'templates');
  END IF;

  -- Logos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read logos'
  ) THEN
    CREATE POLICY "Public read logos" ON storage.objects 
    FOR SELECT USING (bucket_id = 'logos');
  END IF;

  -- Quotes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read quotes'
  ) THEN
    CREATE POLICY "Public read quotes" ON storage.objects 
    FOR SELECT USING (bucket_id = 'quotes');
  END IF;
END $$;

-- 8. Index pour performance
CREATE INDEX IF NOT EXISTS idx_quote_templates_default ON quote_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_devis_template_id ON devis(template_id);
CREATE INDEX IF NOT EXISTS idx_devis_pdf_url ON devis(pdf_url) WHERE pdf_url IS NOT NULL;