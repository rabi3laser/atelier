/*
  # Add mode_facturation column to devis_lignes table

  1. Changes
    - Add mode_facturation column to devis_lignes table with default value 'm2'
    - Add CHECK constraint to ensure valid values (m2, feuille, service)

  2. Security
    - Uses DO block to handle conditional operations safely
    - Prevents errors if column or constraint already exists
*/

-- Add mode_facturation column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis_lignes' AND column_name = 'mode_facturation'
  ) THEN
    ALTER TABLE devis_lignes ADD COLUMN mode_facturation text DEFAULT 'm2';
  END IF;
END $$;

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'devis_lignes' 
    AND constraint_name = 'devis_lignes_mode_facturation_check'
  ) THEN
    ALTER TABLE devis_lignes 
    ADD CONSTRAINT devis_lignes_mode_facturation_check 
    CHECK (mode_facturation = ANY (ARRAY['m2'::text, 'feuille'::text, 'service'::text]));
  END IF;
END $$;