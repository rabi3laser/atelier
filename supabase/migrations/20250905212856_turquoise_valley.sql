/*
  # Pipeline Commercial - Devis, Commandes, Factures, Paiements

  1. Nouvelles tables
    - `devis_lignes` : lignes de devis avec calculs
    - `commandes_lignes` : lignes de commandes
    - `factures_lignes` : lignes de factures  
    - `paiements` : paiements des factures

  2. Fonctions
    - `convert_devis_to_commande()` : conversion devis → commande
    - `create_facture_from_commande()` : création facture depuis commande
    - `update_facture_totals()` : recalcul automatique des totaux
    - `update_facture_reste_du()` : mise à jour du reste dû

  3. Triggers
    - Recalcul automatique des totaux sur modification des lignes
    - Mise à jour du reste dû sur ajout/modification de paiements
*/

-- Extension des tables existantes
ALTER TABLE devis ADD COLUMN IF NOT EXISTS remise_globale_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS remise_globale_pct NUMERIC(5,2) DEFAULT 0;

-- Table des lignes de devis
CREATE TABLE IF NOT EXISTS devis_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  ligne_numero INTEGER NOT NULL,
  matiere_id UUID REFERENCES matieres(id),
  designation TEXT NOT NULL,
  mode_facturation TEXT DEFAULT 'm2' CHECK (mode_facturation IN ('m2', 'feuille', 'service')),
  quantite NUMERIC(12,4) DEFAULT 1,
  prix_unitaire_ht NUMERIC(10,4) DEFAULT 0,
  remise_pct NUMERIC(5,2) DEFAULT 0,
  montant_ht NUMERIC(12,2) DEFAULT 0,
  tva_pct NUMERIC(5,2) DEFAULT 20.00,
  montant_tva NUMERIC(12,2) DEFAULT 0,
  montant_ttc NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  UNIQUE(devis_id, ligne_numero)
);

-- Table des lignes de factures
CREATE TABLE IF NOT EXISTS factures_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  ligne_numero INTEGER NOT NULL,
  matiere_id UUID REFERENCES matieres(id),
  designation TEXT NOT NULL,
  mode_facturation TEXT DEFAULT 'm2' CHECK (mode_facturation IN ('m2', 'feuille', 'service')),
  quantite NUMERIC(12,4) DEFAULT 1,
  prix_unitaire_ht NUMERIC(10,4) DEFAULT 0,
  remise_pct NUMERIC(5,2) DEFAULT 0,
  montant_ht NUMERIC(12,2) DEFAULT 0,
  tva_pct NUMERIC(5,2) DEFAULT 20.00,
  montant_tva NUMERIC(12,2) DEFAULT 0,
  montant_ttc NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  UNIQUE(facture_id, ligne_numero)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_devis_lignes_devis_id ON devis_lignes(devis_id);
CREATE INDEX IF NOT EXISTS idx_factures_lignes_facture_id ON factures_lignes(facture_id);

-- Fonction de calcul des totaux de devis
CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_devis_id UUID;
  v_total_ht NUMERIC(12,2);
  v_total_tva NUMERIC(12,2);
  v_total_ttc NUMERIC(12,2);
  v_remise_globale_pct NUMERIC(5,2);
BEGIN
  -- Récupérer l'ID du devis
  IF TG_OP = 'DELETE' THEN
    v_devis_id := OLD.devis_id;
  ELSE
    v_devis_id := NEW.devis_id;
  END IF;

  -- Calculer les totaux des lignes
  SELECT 
    COALESCE(SUM(montant_ht), 0),
    COALESCE(SUM(montant_tva), 0),
    COALESCE(SUM(montant_ttc), 0)
  INTO v_total_ht, v_total_tva, v_total_ttc
  FROM devis_lignes 
  WHERE devis_id = v_devis_id;

  -- Récupérer la remise globale
  SELECT remise_globale_pct INTO v_remise_globale_pct
  FROM devis WHERE id = v_devis_id;

  -- Appliquer la remise globale
  IF v_remise_globale_pct > 0 THEN
    v_total_ht := v_total_ht * (1 - v_remise_globale_pct / 100);
    v_total_tva := v_total_tva * (1 - v_remise_globale_pct / 100);
    v_total_ttc := v_total_ttc * (1 - v_remise_globale_pct / 100);
  END IF;

  -- Mettre à jour le devis
  UPDATE devis 
  SET 
    montant_ht = v_total_ht,
    montant_tva = v_total_tva,
    montant_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = v_devis_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction de calcul des totaux de factures
CREATE OR REPLACE FUNCTION update_facture_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_facture_id UUID;
  v_total_ht NUMERIC(12,2);
  v_total_tva NUMERIC(12,2);
  v_total_ttc NUMERIC(12,2);
BEGIN
  -- Récupérer l'ID de la facture
  IF TG_OP = 'DELETE' THEN
    v_facture_id := OLD.facture_id;
  ELSE
    v_facture_id := NEW.facture_id;
  END IF;

  -- Calculer les totaux des lignes
  SELECT 
    COALESCE(SUM(montant_ht), 0),
    COALESCE(SUM(montant_tva), 0),
    COALESCE(SUM(montant_ttc), 0)
  INTO v_total_ht, v_total_tva, v_total_ttc
  FROM factures_lignes 
  WHERE facture_id = v_facture_id;

  -- Mettre à jour la facture
  UPDATE factures 
  SET 
    montant_ht = v_total_ht,
    montant_tva = v_total_tva,
    montant_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = v_facture_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction de mise à jour du reste dû
CREATE OR REPLACE FUNCTION update_facture_reste_du()
RETURNS TRIGGER AS $$
DECLARE
  v_facture_id UUID;
  v_total_paye NUMERIC(12,2);
BEGIN
  -- Récupérer l'ID de la facture
  IF TG_OP = 'DELETE' THEN
    v_facture_id := OLD.facture_id;
  ELSE
    v_facture_id := NEW.facture_id;
  END IF;

  -- Calculer le total payé
  SELECT COALESCE(SUM(montant), 0)
  INTO v_total_paye
  FROM paiements 
  WHERE facture_id = v_facture_id;

  -- Mettre à jour le reste dû et le statut
  UPDATE factures 
  SET 
    montant_paye = v_total_paye,
    reste_du = montant_ttc - v_total_paye,
    statut = CASE 
      WHEN montant_ttc - v_total_paye <= 0 THEN 'payee'
      WHEN date_echeance < CURRENT_DATE AND montant_ttc - v_total_paye > 0 THEN 'en_retard'
      ELSE statut
    END,
    updated_at = NOW()
  WHERE id = v_facture_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction de conversion devis → commande
CREATE OR REPLACE FUNCTION convert_devis_to_commande(p_devis_id UUID)
RETURNS UUID AS $$
DECLARE
  v_devis RECORD;
  v_commande_id UUID;
  v_ligne RECORD;
BEGIN
  -- Récupérer le devis
  SELECT * INTO v_devis FROM devis WHERE id = p_devis_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Devis non trouvé';
  END IF;

  IF v_devis.statut != 'accepte' THEN
    RAISE EXCEPTION 'Seuls les devis acceptés peuvent être convertis';
  END IF;

  -- Créer la commande
  INSERT INTO commandes (
    numero, client_id, devis_id, date_commande, 
    montant_ht, montant_tva, montant_ttc, taux_tva,
    remise_globale_pct, notes
  ) VALUES (
    'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('doc_sequence')::TEXT, 4, '0'),
    v_devis.client_id, v_devis.id, CURRENT_DATE,
    v_devis.montant_ht, v_devis.montant_tva, v_devis.montant_ttc, v_devis.taux_tva,
    v_devis.remise_globale_pct, v_devis.notes
  ) RETURNING id INTO v_commande_id;

  -- Copier les lignes
  FOR v_ligne IN 
    SELECT * FROM devis_lignes WHERE devis_id = p_devis_id ORDER BY ligne_numero
  LOOP
    INSERT INTO commandes_lignes (
      commande_id, ligne_numero, matiere_id, designation, 
      quantite, prix_unitaire, montant_ligne, notes
    ) VALUES (
      v_commande_id, v_ligne.ligne_numero, v_ligne.matiere_id, v_ligne.designation,
      v_ligne.quantite, v_ligne.prix_unitaire_ht, v_ligne.montant_ttc, v_ligne.notes
    );
  END LOOP;

  RETURN v_commande_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction de création facture depuis commande
CREATE OR REPLACE FUNCTION create_facture_from_commande(p_commande_id UUID)
RETURNS UUID AS $$
DECLARE
  v_commande RECORD;
  v_facture_id UUID;
  v_ligne RECORD;
BEGIN
  -- Récupérer la commande
  SELECT * INTO v_commande FROM commandes WHERE id = p_commande_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande non trouvée';
  END IF;

  -- Créer la facture (sans numéro, sera attribué par le trigger)
  INSERT INTO factures (
    client_id, commande_id, date_facture, date_echeance,
    montant_ht, montant_tva, montant_ttc, taux_tva, statut
  ) VALUES (
    v_commande.client_id, v_commande.id, CURRENT_DATE, 
    CURRENT_DATE + INTERVAL '30 days',
    v_commande.montant_ht, v_commande.montant_tva, v_commande.montant_ttc, 
    v_commande.taux_tva, 'envoyee'
  ) RETURNING id INTO v_facture_id;

  -- Copier les lignes
  FOR v_ligne IN 
    SELECT * FROM commandes_lignes WHERE commande_id = p_commande_id ORDER BY ligne_numero
  LOOP
    INSERT INTO factures_lignes (
      facture_id, ligne_numero, matiere_id, designation,
      quantite, prix_unitaire_ht, montant_ttc
    ) VALUES (
      v_facture_id, v_ligne.ligne_numero, v_ligne.matiere_id, v_ligne.designation,
      v_ligne.quantite, v_ligne.prix_unitaire, v_ligne.montant_ligne
    );
  END LOOP;

  RETURN v_facture_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour recalcul automatique
CREATE TRIGGER trigger_update_devis_totals
  AFTER INSERT OR UPDATE OR DELETE ON devis_lignes
  FOR EACH ROW EXECUTE FUNCTION update_devis_totals();

CREATE TRIGGER trigger_update_facture_totals
  AFTER INSERT OR UPDATE OR DELETE ON factures_lignes
  FOR EACH ROW EXECUTE FUNCTION update_facture_totals();

CREATE TRIGGER trigger_update_facture_reste_du
  AFTER INSERT OR UPDATE OR DELETE ON paiements
  FOR EACH ROW EXECUTE FUNCTION update_facture_reste_du();

-- Trigger pour recalcul des lignes sur modification
CREATE OR REPLACE FUNCTION calculate_ligne_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer les montants de la ligne
  NEW.montant_ht := NEW.quantite * NEW.prix_unitaire_ht * (1 - COALESCE(NEW.remise_pct, 0) / 100);
  NEW.montant_tva := NEW.montant_ht * NEW.tva_pct / 100;
  NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_devis_ligne_totals
  BEFORE INSERT OR UPDATE ON devis_lignes
  FOR EACH ROW EXECUTE FUNCTION calculate_ligne_totals();

CREATE TRIGGER trigger_calculate_facture_ligne_totals
  BEFORE INSERT OR UPDATE ON factures_lignes
  FOR EACH ROW EXECUTE FUNCTION calculate_ligne_totals();