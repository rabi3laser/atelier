/*
  # Mise à jour table company_extractions pour workflow company-intake

  1. Modifications
    - Ajout colonnes pour nouvelle structure
    - Support pour tableaux telephones/emails
    - Champs de validation détaillés
    
  2. Nouvelles colonnes
    - extracted_values (jsonb) : Valeurs extraites
    - confidence_scores (jsonb) : Scores de confiance
    - field_validations (jsonb) : Validations par champ
    - extraction_summary (jsonb) : Résumé extraction
*/

-- Ajouter nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_extractions' AND column_name = 'extracted_values'
  ) THEN
    ALTER TABLE company_extractions ADD COLUMN extracted_values JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_extractions' AND column_name = 'field_validations'
  ) THEN
    ALTER TABLE company_extractions ADD COLUMN field_validations JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_extractions' AND column_name = 'extraction_summary'
  ) THEN
    ALTER TABLE company_extractions ADD COLUMN extraction_summary JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_extractions' AND column_name = 'extraction_source'
  ) THEN
    ALTER TABLE company_extractions ADD COLUMN extraction_source TEXT DEFAULT '';
  END IF;
END $$;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_company_extractions_processing_stage 
ON company_extractions(processing_stage);

CREATE INDEX IF NOT EXISTS idx_company_extractions_org_id 
ON company_extractions(org_id);