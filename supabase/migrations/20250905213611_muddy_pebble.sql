/*
  # Module Production et Achats

  1. Nouvelles tables
    - `bons_travail` pour la gestion de production
    - `achats` et `achats_lignes` pour les achats fournisseurs
  
  2. Fonctions
    - `complete_bon_travail()` : finalise un bon avec mouvements de stock
    - `receive_achat()` : réceptionne un achat avec entrées de stock
  
  3. Sécurité
    - Contraintes de cohérence sur les statuts et quantités
*/

-- Table bons_travail (déjà existante, on ajoute les champs manquants)
ALTER TABLE bons_travail 
ADD COLUMN IF NOT EXISTS matiere_id uuid REFERENCES matieres(id),
ADD COLUMN IF NOT EXISTS quantite_prevue numeric(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantite_produite numeric(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantite_chutes numeric(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_matiere numeric(10,4) DEFAULT 0;

-- Index pour les bons de travail
CREATE INDEX IF NOT EXISTS idx_bons_travail_statut ON bons_travail(statut);
CREATE INDEX IF NOT EXISTS idx_bons_travail_matiere ON bons_travail(matiere_id);

-- Table achats (déjà existante, vérification)
-- Table achats_lignes (déjà existante, vérification)

-- Fonction pour finaliser un bon de travail
CREATE OR REPLACE FUNCTION complete_bon_travail(
  p_bon_id uuid,
  p_quantite_produite numeric,
  p_quantite_chutes numeric DEFAULT 0
) RETURNS void AS $$
DECLARE
  v_bon bons_travail%ROWTYPE;
  v_matiere_code text;
BEGIN
  -- Récupérer le bon de travail
  SELECT * INTO v_bon FROM bons_travail WHERE id = p_bon_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bon de travail non trouvé';
  END IF;
  
  IF v_bon.statut != 'en_cours' THEN
    RAISE EXCEPTION 'Le bon de travail doit être en cours pour être finalisé';
  END IF;
  
  -- Récupérer le code matière pour les références
  SELECT code INTO v_matiere_code FROM matieres WHERE id = v_bon.matiere_id;
  
  -- Mouvement SORTIE pour la consommation
  IF p_quantite_produite > 0 THEN
    INSERT INTO mouvements_stock (
      matiere_id,
      type_mouvement,
      quantite,
      prix_unitaire,
      valeur_mouvement,
      reference_document,
      type_document,
      document_id,
      commentaire
    ) VALUES (
      v_bon.matiere_id,
      'sortie',
      -p_quantite_produite,
      v_bon.prix_matiere,
      -(p_quantite_produite * v_bon.prix_matiere),
      v_bon.numero,
      'bon_travail',
      v_bon.id,
      'Consommation production - ' || v_bon.numero
    );
  END IF;
  
  -- Mouvement ENTREE pour les chutes récupérées
  IF p_quantite_chutes > 0 THEN
    INSERT INTO mouvements_stock (
      matiere_id,
      type_mouvement,
      quantite,
      prix_unitaire,
      valeur_mouvement,
      reference_document,
      type_document,
      document_id,
      commentaire
    ) VALUES (
      v_bon.matiere_id,
      'chute',
      p_quantite_chutes,
      0, -- Chutes valorisées à 0
      0,
      v_bon.numero,
      'bon_travail',
      v_bon.id,
      'Chutes récupérées - ' || v_bon.numero
    );
  END IF;
  
  -- Mettre à jour le bon de travail
  UPDATE bons_travail 
  SET 
    statut = 'termine',
    quantite_produite = p_quantite_produite,
    quantite_chutes = p_quantite_chutes,
    date_fin = now(),
    updated_at = now()
  WHERE id = p_bon_id;
  
  -- Recalculer le stock
  PERFORM update_stock_from_movements(v_bon.matiere_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour réceptionner un achat
CREATE OR REPLACE FUNCTION receive_achat(p_achat_id uuid) RETURNS void AS $$
DECLARE
  v_achat achats%ROWTYPE;
  v_ligne achats_lignes%ROWTYPE;
BEGIN
  -- Récupérer l'achat
  SELECT * INTO v_achat FROM achats WHERE id = p_achat_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Achat non trouvé';
  END IF;
  
  IF v_achat.statut != 'commande' THEN
    RAISE EXCEPTION 'L''achat doit être en statut "commande" pour être réceptionné';
  END IF;
  
  -- Traiter chaque ligne d'achat
  FOR v_ligne IN 
    SELECT * FROM achats_lignes 
    WHERE achat_id = p_achat_id AND matiere_id IS NOT NULL
  LOOP
    -- Créer le mouvement d'entrée de stock
    INSERT INTO mouvements_stock (
      matiere_id,
      type_mouvement,
      quantite,
      prix_unitaire,
      valeur_mouvement,
      reference_document,
      type_document,
      document_id,
      commentaire
    ) VALUES (
      v_ligne.matiere_id,
      'entree',
      v_ligne.quantite,
      v_ligne.prix_unitaire,
      v_ligne.montant_ligne,
      v_achat.numero,
      'achat',
      v_achat.id,
      'Réception achat - ' || v_achat.numero
    );
    
    -- Recalculer le stock pour cette matière
    PERFORM update_stock_from_movements(v_ligne.matiere_id);
  END LOOP;
  
  -- Mettre à jour le statut de l'achat
  UPDATE achats 
  SET 
    statut = 'livree',
    date_livraison = CURRENT_DATE,
    updated_at = now()
  WHERE id = p_achat_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction utilitaire pour recalculer le stock depuis les mouvements
CREATE OR REPLACE FUNCTION update_stock_from_movements(p_matiere_id uuid) RETURNS void AS $$
DECLARE
  v_total_qty numeric := 0;
  v_total_value numeric := 0;
  v_pmp numeric := 0;
BEGIN
  -- Calculer les totaux depuis les mouvements
  SELECT 
    COALESCE(SUM(quantite), 0),
    COALESCE(SUM(valeur_mouvement), 0)
  INTO v_total_qty, v_total_value
  FROM mouvements_stock 
  WHERE matiere_id = p_matiere_id;
  
  -- Calculer le PMP
  IF v_total_qty > 0 THEN
    v_pmp := v_total_value / v_total_qty;
  END IF;
  
  -- Mettre à jour ou créer le stock
  INSERT INTO stocks (matiere_id, quantite, valeur_stock, prix_moyen_pondere)
  VALUES (p_matiere_id, v_total_qty, v_total_value, v_pmp)
  ON CONFLICT (matiere_id) 
  DO UPDATE SET
    quantite = v_total_qty,
    quantite_disponible = v_total_qty - COALESCE(stocks.quantite_reservee, 0),
    valeur_stock = v_total_value,
    prix_moyen_pondere = v_pmp,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Contraintes supplémentaires
ALTER TABLE bons_travail 
ADD CONSTRAINT chk_quantite_produite CHECK (quantite_produite >= 0),
ADD CONSTRAINT chk_quantite_chutes CHECK (quantite_chutes >= 0);

-- Index pour les achats
CREATE INDEX IF NOT EXISTS idx_achats_statut ON achats(statut);
CREATE INDEX IF NOT EXISTS idx_achats_fournisseur ON achats(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_achats_lignes_achat ON achats_lignes(achat_id);