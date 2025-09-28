/*
  # Table pour sauvegarder les extractions d'informations société

  1. Nouvelle table
    - `company_extractions`
      - `id` (uuid, primary key)
      - `request_id` (text, unique)
      - `org_id` (text)
      - `extracted_info` (jsonb) - Données extraites du PDF
      - `validation_results` (jsonb) - Résultats de validation
      - `confidence_scores` (jsonb) - Scores de confiance
      - `processing_stage` (text) - Étape de traitement
      - `source_file_name` (text) - Nom du fichier source
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `company_extractions`
    - Politique d'accès public pour les tests
*/

CREATE TABLE IF NOT EXISTS company_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text UNIQUE NOT NULL,
  org_id text NOT NULL,
  extracted_info jsonb DEFAULT '{}',
  validation_results jsonb DEFAULT '{}',
  confidence_scores jsonb DEFAULT '{}',
  processing_stage text DEFAULT 'PENDING',
  source_file_name text,
  errors text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access company_extractions"
  ON company_extractions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);