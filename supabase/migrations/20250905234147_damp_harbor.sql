/*
  # Remove obsolete trigger and function referencing qty column

  1. Cleanup
    - Remove trigger `trg_sync_devis_lignes_names` on devis_lignes table
    - Remove function `sync_devis_lignes_names()` that references non-existent qty column
  
  2. Compatibility View (Optional)
    - Create view `devis_lignes_compat` for backward compatibility
    - Maps current schema fields to old field names if needed
  
  3. Schema Reload
    - Notify PostgREST to reload schema cache
*/

-- 1) Supprimer le trigger et la fonction qui référencent "qty"
DROP TRIGGER IF EXISTS trg_sync_devis_lignes_names ON devis_lignes;
DROP FUNCTION IF EXISTS sync_devis_lignes_names();

-- 2) (Optionnel) Vue de compat si un vieux code SELECT attend encore qty/mode/libelle
CREATE OR REPLACE VIEW devis_lignes_compat AS
SELECT
  id,
  ligne_numero,
  designation,
  designation       AS libelle,
  mode_facturation,
  mode_facturation  AS mode,
  quantite,
  quantite          AS qty,
  prix_unitaire_ht,
  remise_pct,
  tva_pct,
  montant_ht,
  montant_tva,
  montant_ttc,
  notes,
  matiere_id,
  devis_id
FROM devis_lignes;

-- 3) Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';