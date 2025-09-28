/*
  # Fonctions pour la gestion du stock

  1. Fonctions
    - `create_mouvement_stock` : Crée un mouvement et met à jour le stock automatiquement
    - `update_stock_from_mouvement` : Met à jour les quantités et valorisation du stock

  2. Sécurité
    - Contraintes de cohérence sur les quantités
    - Calcul automatique du prix moyen pondéré
*/

-- Fonction pour créer un mouvement de stock et mettre à jour le stock
CREATE OR REPLACE FUNCTION create_mouvement_stock(
  p_matiere_id UUID,
  p_type_mouvement TEXT,
  p_quantite NUMERIC,
  p_prix_unitaire NUMERIC DEFAULT 0,
  p_reference_document TEXT DEFAULT '',
  p_type_document TEXT DEFAULT '',
  p_document_id UUID DEFAULT NULL,
  p_commentaire TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
  v_stock_record RECORD;
  v_nouvelle_quantite NUMERIC;
  v_nouvelle_valeur NUMERIC;
  v_nouveau_pmp NUMERIC;
BEGIN
  -- Récupérer le stock actuel
  SELECT * INTO v_stock_record 
  FROM stocks 
  WHERE matiere_id = p_matiere_id;
  
  -- Si pas de stock, le créer
  IF NOT FOUND THEN
    INSERT INTO stocks (matiere_id, quantite, quantite_reservee, valeur_stock, prix_moyen_pondere)
    VALUES (p_matiere_id, 0, 0, 0, 0);
    
    SELECT * INTO v_stock_record 
    FROM stocks 
    WHERE matiere_id = p_matiere_id;
  END IF;
  
  -- Calculer les nouvelles valeurs selon le type de mouvement
  CASE p_type_mouvement
    WHEN 'entree' THEN
      v_nouvelle_quantite := v_stock_record.quantite + p_quantite;
      v_nouvelle_valeur := v_stock_record.valeur_stock + (p_quantite * p_prix_unitaire);
      
      -- Calcul du nouveau PMP pour les entrées
      IF v_nouvelle_quantite > 0 THEN
        v_nouveau_pmp := v_nouvelle_valeur / v_nouvelle_quantite;
      ELSE
        v_nouveau_pmp := 0;
      END IF;
      
    WHEN 'sortie' THEN
      v_nouvelle_quantite := v_stock_record.quantite - ABS(p_quantite);
      v_nouvelle_valeur := v_stock_record.valeur_stock - (ABS(p_quantite) * v_stock_record.prix_moyen_pondere);
      v_nouveau_pmp := v_stock_record.prix_moyen_pondere; -- PMP inchangé pour les sorties
      
      -- Vérifier que le stock ne devient pas négatif
      IF v_nouvelle_quantite < 0 THEN
        RAISE EXCEPTION 'Stock insuffisant. Stock actuel: %, Quantité demandée: %', 
          v_stock_record.quantite, ABS(p_quantite);
      END IF;
      
    WHEN 'ajustement' THEN
      v_nouvelle_quantite := v_stock_record.quantite + p_quantite;
      
      IF p_quantite > 0 THEN
        -- Ajustement positif : ajouter la valeur
        v_nouvelle_valeur := v_stock_record.valeur_stock + (p_quantite * p_prix_unitaire);
        IF v_nouvelle_quantite > 0 THEN
          v_nouveau_pmp := v_nouvelle_valeur / v_nouvelle_quantite;
        ELSE
          v_nouveau_pmp := 0;
        END IF;
      ELSE
        -- Ajustement négatif : retirer au PMP actuel
        v_nouvelle_valeur := v_stock_record.valeur_stock + (p_quantite * v_stock_record.prix_moyen_pondere);
        v_nouveau_pmp := v_stock_record.prix_moyen_pondere;
      END IF;
      
    WHEN 'chute' THEN
      -- Les chutes sont des entrées à prix 0 (récupération)
      v_nouvelle_quantite := v_stock_record.quantite + p_quantite;
      v_nouvelle_valeur := v_stock_record.valeur_stock; -- Pas de valeur ajoutée
      
      IF v_nouvelle_quantite > 0 THEN
        v_nouveau_pmp := v_nouvelle_valeur / v_nouvelle_quantite;
      ELSE
        v_nouveau_pmp := 0;
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Type de mouvement non reconnu: %', p_type_mouvement;
  END CASE;
  
  -- S'assurer que les valeurs ne sont pas négatives
  v_nouvelle_valeur := GREATEST(v_nouvelle_valeur, 0);
  v_nouveau_pmp := GREATEST(v_nouveau_pmp, 0);
  
  -- Insérer le mouvement
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
    p_matiere_id,
    p_type_mouvement,
    p_quantite,
    p_prix_unitaire,
    p_quantite * p_prix_unitaire,
    p_reference_document,
    p_type_document,
    p_document_id,
    p_commentaire
  );
  
  -- Mettre à jour le stock
  UPDATE stocks SET
    quantite = v_nouvelle_quantite,
    quantite_disponible = v_nouvelle_quantite - quantite_reservee,
    valeur_stock = v_nouvelle_valeur,
    prix_moyen_pondere = v_nouveau_pmp,
    updated_at = NOW()
  WHERE matiere_id = p_matiere_id;
  
END;
$$ LANGUAGE plpgsql;