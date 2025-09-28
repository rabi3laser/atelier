/*
  # Schéma CORE - Atelier de découpe laser

  1. Tables principales
    - `clients` - Gestion des clients
    - `fournisseurs` - Gestion des fournisseurs
    - `matieres` - Catalogue des matières premières
    - `stocks` - Stock actuel par matière
    - `mouvements_stock` - Historique des mouvements de stock
    - `devis` - Devis clients
    - `devis_lignes` - Lignes de devis
    - `commandes` - Commandes clients
    - `commandes_lignes` - Lignes de commandes
    - `bons_travail` - Bons de travail atelier
    - `factures` - Factures clients
    - `paiements` - Paiements reçus
    - `achats` - Achats fournisseurs
    - `achats_lignes` - Lignes d'achats
    - `settings` - Paramètres application

  2. Fonctions
    - `next_doc_number()` - Génération numéros de documents
    - `assign_facture_numero()` - Attribution automatique numéro facture

  3. Vues
    - `v_stock_valorise` - Stock valorisé
    - `v_balance_agee` - Balance âgée clients

  4. Index et contraintes
    - Index de performance
    - Contraintes de positivité stock
*/

-- =============================================
-- TABLES PRINCIPALES
-- =============================================

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  adresse text DEFAULT '',
  code_postal text DEFAULT '',
  ville text DEFAULT '',
  telephone text DEFAULT '',
  email text DEFAULT '',
  siret text DEFAULT '',
  conditions_paiement integer DEFAULT 30,
  actif boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  adresse text DEFAULT '',
  code_postal text DEFAULT '',
  ville text DEFAULT '',
  telephone text DEFAULT '',
  email text DEFAULT '',
  siret text DEFAULT '',
  conditions_paiement integer DEFAULT 30,
  actif boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table matières premières
CREATE TABLE IF NOT EXISTS matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  designation text NOT NULL,
  unite text NOT NULL DEFAULT 'm²', -- m², feuille, kg, etc.
  prix_achat_unitaire decimal(10,4) DEFAULT 0,
  prix_vente_unitaire decimal(10,4) DEFAULT 0,
  epaisseur decimal(6,2) DEFAULT 0,
  largeur decimal(8,2) DEFAULT 0,
  longueur decimal(8,2) DEFAULT 0,
  couleur text DEFAULT '',
  fournisseur_id uuid REFERENCES fournisseurs(id),
  actif boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table stocks
CREATE TABLE IF NOT EXISTS stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matiere_id uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  quantite decimal(12,4) DEFAULT 0 CHECK (quantite >= 0),
  quantite_reservee decimal(12,4) DEFAULT 0 CHECK (quantite_reservee >= 0),
  quantite_disponible decimal(12,4) GENERATED ALWAYS AS (quantite - quantite_reservee) STORED,
  valeur_stock decimal(12,2) DEFAULT 0,
  prix_moyen_pondere decimal(10,4) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(matiere_id)
);

-- Table mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matiere_id uuid NOT NULL REFERENCES matieres(id),
  type_mouvement text NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'chute')),
  quantite decimal(12,4) NOT NULL,
  prix_unitaire decimal(10,4) DEFAULT 0,
  valeur_mouvement decimal(12,2) DEFAULT 0,
  reference_document text DEFAULT '',
  type_document text DEFAULT '', -- achat, commande, bon_travail, ajustement
  document_id uuid,
  commentaire text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Table devis
CREATE TABLE IF NOT EXISTS devis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id),
  date_devis date DEFAULT CURRENT_DATE,
  date_validite date,
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  montant_ht decimal(12,2) DEFAULT 0,
  montant_tva decimal(12,2) DEFAULT 0,
  montant_ttc decimal(12,2) DEFAULT 0,
  taux_tva decimal(5,2) DEFAULT 20.00,
  conditions text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table lignes de devis
CREATE TABLE IF NOT EXISTS devis_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id uuid NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  ligne_numero integer NOT NULL,
  matiere_id uuid REFERENCES matieres(id),
  designation text NOT NULL,
  quantite decimal(12,4) DEFAULT 1,
  prix_unitaire decimal(10,4) DEFAULT 0,
  montant_ligne decimal(12,2) DEFAULT 0,
  notes text DEFAULT '',
  UNIQUE(devis_id, ligne_numero)
);

-- Table commandes
CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  devis_id uuid REFERENCES devis(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  date_commande date DEFAULT CURRENT_DATE,
  date_livraison_prevue date,
  statut text DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'en_production', 'prete', 'livree', 'annulee')),
  montant_ht decimal(12,2) DEFAULT 0,
  montant_tva decimal(12,2) DEFAULT 0,
  montant_ttc decimal(12,2) DEFAULT 0,
  taux_tva decimal(5,2) DEFAULT 20.00,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table lignes de commandes
CREATE TABLE IF NOT EXISTS commandes_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id uuid NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  ligne_numero integer NOT NULL,
  matiere_id uuid REFERENCES matieres(id),
  designation text NOT NULL,
  quantite decimal(12,4) DEFAULT 1,
  quantite_produite decimal(12,4) DEFAULT 0,
  prix_unitaire decimal(10,4) DEFAULT 0,
  montant_ligne decimal(12,2) DEFAULT 0,
  notes text DEFAULT '',
  UNIQUE(commande_id, ligne_numero)
);

-- Table bons de travail
CREATE TABLE IF NOT EXISTS bons_travail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  commande_id uuid REFERENCES commandes(id),
  date_creation date DEFAULT CURRENT_DATE,
  date_debut timestamptz,
  date_fin timestamptz,
  statut text DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  operateur text DEFAULT '',
  temps_prevu_minutes integer DEFAULT 0,
  temps_reel_minutes integer DEFAULT 0,
  consommation_matiere decimal(12,4) DEFAULT 0,
  chutes_recuperees decimal(12,4) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table factures
CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  commande_id uuid REFERENCES commandes(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  date_facture date DEFAULT CURRENT_DATE,
  date_echeance date,
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee')),
  montant_ht decimal(12,2) DEFAULT 0,
  montant_tva decimal(12,2) DEFAULT 0,
  montant_ttc decimal(12,2) DEFAULT 0,
  montant_paye decimal(12,2) DEFAULT 0,
  reste_du decimal(12,2) GENERATED ALWAYS AS (montant_ttc - montant_paye) STORED,
  taux_tva decimal(5,2) DEFAULT 20.00,
  conditions text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table paiements
CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id uuid NOT NULL REFERENCES factures(id),
  date_paiement date DEFAULT CURRENT_DATE,
  montant decimal(12,2) NOT NULL CHECK (montant > 0),
  mode_paiement text DEFAULT 'virement' CHECK (mode_paiement IN ('especes', 'cheque', 'virement', 'carte', 'prelevement')),
  reference text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Table achats fournisseurs
CREATE TABLE IF NOT EXISTS achats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  fournisseur_id uuid NOT NULL REFERENCES fournisseurs(id),
  date_achat date DEFAULT CURRENT_DATE,
  date_livraison date,
  statut text DEFAULT 'commande' CHECK (statut IN ('commande', 'livree', 'facturee', 'payee')),
  montant_ht decimal(12,2) DEFAULT 0,
  montant_tva decimal(12,2) DEFAULT 0,
  montant_ttc decimal(12,2) DEFAULT 0,
  taux_tva decimal(5,2) DEFAULT 20.00,
  numero_facture_fournisseur text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table lignes d'achats
CREATE TABLE IF NOT EXISTS achats_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achat_id uuid NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
  ligne_numero integer NOT NULL,
  matiere_id uuid REFERENCES matieres(id),
  designation text NOT NULL,
  quantite decimal(12,4) DEFAULT 1,
  prix_unitaire decimal(10,4) DEFAULT 0,
  montant_ligne decimal(12,2) DEFAULT 0,
  notes text DEFAULT '',
  UNIQUE(achat_id, ligne_numero)
);

-- Table paramètres
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text UNIQUE NOT NULL,
  valeur text NOT NULL,
  description text DEFAULT '',
  type_donnee text DEFAULT 'text' CHECK (type_donnee IN ('text', 'number', 'boolean', 'json')),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- FONCTIONS
-- =============================================

-- Fonction génération numéros de documents
CREATE OR REPLACE FUNCTION next_doc_number(doc_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text;
  counter_key text;
  current_counter integer;
  new_number text;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  counter_key := doc_type || '_counter_' || current_year;
  
  -- Récupérer le compteur actuel
  SELECT COALESCE(valeur::integer, 0) INTO current_counter
  FROM settings 
  WHERE cle = counter_key;
  
  -- Incrémenter
  current_counter := current_counter + 1;
  
  -- Mettre à jour ou insérer le compteur
  INSERT INTO settings (cle, valeur, description, type_donnee)
  VALUES (counter_key, current_counter::text, 'Compteur ' || doc_type || ' pour ' || current_year, 'number')
  ON CONFLICT (cle) 
  DO UPDATE SET valeur = current_counter::text, updated_at = now();
  
  -- Générer le numéro selon le type
  CASE doc_type
    WHEN 'devis' THEN
      new_number := 'DEV' || current_year || '-' || LPAD(current_counter::text, 4, '0');
    WHEN 'commande' THEN
      new_number := 'CMD' || current_year || '-' || LPAD(current_counter::text, 4, '0');
    WHEN 'facture' THEN
      new_number := 'FAC' || current_year || '-' || LPAD(current_counter::text, 4, '0');
    WHEN 'bon_travail' THEN
      new_number := 'BT' || current_year || '-' || LPAD(current_counter::text, 4, '0');
    WHEN 'achat' THEN
      new_number := 'ACH' || current_year || '-' || LPAD(current_counter::text, 4, '0');
    ELSE
      new_number := UPPER(doc_type) || current_year || '-' || LPAD(current_counter::text, 4, '0');
  END CASE;
  
  RETURN new_number;
END;
$$;

-- Fonction attribution automatique numéro facture
CREATE OR REPLACE FUNCTION assign_facture_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL AND NEW.statut != 'brouillon' THEN
    NEW.numero := next_doc_number('facture');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger pour attribution automatique numéro facture
DROP TRIGGER IF EXISTS trigger_assign_facture_numero ON factures;
CREATE TRIGGER trigger_assign_facture_numero
  BEFORE INSERT OR UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION assign_facture_numero();

-- =============================================
-- VUES
-- =============================================

-- Vue stock valorisé
CREATE OR REPLACE VIEW v_stock_valorise AS
SELECT 
  m.id,
  m.code,
  m.designation,
  m.unite,
  s.quantite,
  s.quantite_reservee,
  s.quantite_disponible,
  s.prix_moyen_pondere,
  s.valeur_stock,
  m.prix_vente_unitaire,
  (s.quantite * m.prix_vente_unitaire) as valeur_vente_potentielle,
  m.actif
FROM matieres m
LEFT JOIN stocks s ON m.id = s.matiere_id
WHERE m.actif = true;

-- Vue balance âgée
CREATE OR REPLACE VIEW v_balance_agee AS
SELECT 
  f.id,
  f.numero,
  c.nom as client_nom,
  f.date_facture,
  f.date_echeance,
  f.montant_ttc,
  f.montant_paye,
  f.reste_du,
  CASE 
    WHEN f.reste_du <= 0 THEN 'Payée'
    WHEN f.date_echeance >= CURRENT_DATE THEN 'En cours'
    WHEN f.date_echeance < CURRENT_DATE - INTERVAL '90 days' THEN '> 90 jours'
    WHEN f.date_echeance < CURRENT_DATE - INTERVAL '60 days' THEN '60-90 jours'
    WHEN f.date_echeance < CURRENT_DATE - INTERVAL '30 days' THEN '30-60 jours'
    ELSE '< 30 jours'
  END as tranche_age,
  CURRENT_DATE - f.date_echeance as jours_retard
FROM factures f
JOIN clients c ON f.client_id = c.id
WHERE f.statut != 'annulee';

-- =============================================
-- INDEX
-- =============================================

-- Index sur les stocks
CREATE INDEX IF NOT EXISTS idx_stocks_matiere_id ON stocks(matiere_id);

-- Index sur les mouvements de stock
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_created_at ON mouvements_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_matiere_id ON mouvements_stock(matiere_id);

-- Index sur les factures
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);

-- Index partiel sur les factures impayées
CREATE INDEX IF NOT EXISTS idx_factures_reste_du ON factures(reste_du) WHERE reste_du > 0;

-- Index sur les documents par client
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON commandes(client_id);

-- =============================================
-- CONTRAINTES ADDITIONNELLES
-- =============================================

-- Contrainte positivité stock (déjà dans la définition de table)
-- Contrainte cohérence quantités commandes
ALTER TABLE commandes_lignes 
ADD CONSTRAINT chk_quantite_produite 
CHECK (quantite_produite <= quantite);

-- =============================================
-- DONNÉES INITIALES (SEED)
-- =============================================

-- Paramètres par défaut
INSERT INTO settings (cle, valeur, description, type_donnee) VALUES
('entreprise_nom', 'Atelier Laser Pro', 'Nom de l''entreprise', 'text'),
('entreprise_adresse', '123 Rue de l''Industrie', 'Adresse de l''entreprise', 'text'),
('entreprise_ville', '75000 Paris', 'Ville de l''entreprise', 'text'),
('entreprise_telephone', '01 23 45 67 89', 'Téléphone de l''entreprise', 'text'),
('entreprise_email', 'contact@atelierlaser.fr', 'Email de l''entreprise', 'text'),
('tva_defaut', '20.00', 'Taux de TVA par défaut', 'number'),
('conditions_paiement_defaut', '30', 'Conditions de paiement par défaut (jours)', 'number')
ON CONFLICT (cle) DO NOTHING;

-- Client générique
INSERT INTO clients (code, nom, adresse, ville, telephone, email) VALUES
('CLI-GENERIQUE', 'Client Générique', 'Adresse non renseignée', 'Ville', '', '')
ON CONFLICT (code) DO NOTHING;

-- Fournisseur générique
INSERT INTO fournisseurs (code, nom, adresse, ville, telephone, email) VALUES
('FOUR-GENERIQUE', 'Fournisseur Générique', 'Adresse non renseignée', 'Ville', '', '')
ON CONFLICT (code) DO NOTHING;

-- Matière exemple
INSERT INTO matieres (code, designation, unite, prix_achat_unitaire, prix_vente_unitaire, epaisseur) VALUES
('ACIER-3MM', 'Tôle acier 3mm', 'm²', 25.00, 35.00, 3.00)
ON CONFLICT (code) DO NOTHING;

-- Stock initial pour la matière exemple
INSERT INTO stocks (matiere_id, quantite, valeur_stock, prix_moyen_pondere)
SELECT m.id, 0, 0, 25.00
FROM matieres m 
WHERE m.code = 'ACIER-3MM'
ON CONFLICT (matiere_id) DO NOTHING;