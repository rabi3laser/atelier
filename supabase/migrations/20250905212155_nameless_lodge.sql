/*
  # Module Clients - Extension du schéma

  1. Modifications de la table clients
    - Ajout des champs ICE, RC, IF pour l'identification fiscale
    - Mise à jour des champs existants

  2. Vue historique client
    - `v_client_historique` : union de tous les documents par client
    - Colonnes : client_id, nom, type_doc, doc_id, date, montant, statut
    - Tri par date décroissante pour affichage chronologique
*/

-- Extension de la table clients avec les champs fiscaux
DO $$
BEGIN
  -- Ajout du champ ICE (Identifiant Commun de l'Entreprise)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'ice'
  ) THEN
    ALTER TABLE clients ADD COLUMN ice text DEFAULT '' NOT NULL;
  END IF;

  -- Ajout du champ RC (Registre de Commerce)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'rc'
  ) THEN
    ALTER TABLE clients ADD COLUMN rc text DEFAULT '' NOT NULL;
  END IF;

  -- Ajout du champ IF (Identifiant Fiscal)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'if'
  ) THEN
    ALTER TABLE clients ADD COLUMN if text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Vue historique complète des clients
CREATE OR REPLACE VIEW v_client_historique AS
-- Devis
SELECT 
  d.client_id,
  c.nom as client_nom,
  'devis' as type_doc,
  d.id as doc_id,
  d.numero as doc_numero,
  d.date_devis as date_doc,
  d.montant_ttc as montant,
  d.statut,
  d.created_at
FROM devis d
JOIN clients c ON d.client_id = c.id

UNION ALL

-- Commandes
SELECT 
  cmd.client_id,
  c.nom as client_nom,
  'commande' as type_doc,
  cmd.id as doc_id,
  cmd.numero as doc_numero,
  cmd.date_commande as date_doc,
  cmd.montant_ttc as montant,
  cmd.statut,
  cmd.created_at
FROM commandes cmd
JOIN clients c ON cmd.client_id = c.id

UNION ALL

-- Factures
SELECT 
  f.client_id,
  c.nom as client_nom,
  'facture' as type_doc,
  f.id as doc_id,
  f.numero as doc_numero,
  f.date_facture as date_doc,
  f.montant_ttc as montant,
  f.statut,
  f.created_at
FROM factures f
JOIN clients c ON f.client_id = c.id

UNION ALL

-- Paiements
SELECT 
  f.client_id,
  c.nom as client_nom,
  'paiement' as type_doc,
  p.id as doc_id,
  p.reference as doc_numero,
  p.date_paiement as date_doc,
  p.montant,
  p.mode_paiement as statut,
  p.created_at
FROM paiements p
JOIN factures f ON p.facture_id = f.id
JOIN clients c ON f.client_id = c.id

ORDER BY date_doc DESC, created_at DESC;