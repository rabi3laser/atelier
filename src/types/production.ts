// Types pour la gestion de production et achats

export interface BonTravail {
  id: string;
  numero: string;
  commande_id?: string;
  matiere_id?: string;
  date_creation: string;
  date_debut?: string;
  date_fin?: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
  operateur?: string;
  temps_prevu_minutes?: number;
  temps_reel_minutes?: number;
  quantite_prevue?: number;
  quantite_produite?: number;
  quantite_chutes?: number;
  prix_matiere?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BonTravailWithDetails extends BonTravail {
  commande_numero?: string;
  client_nom?: string;
  matiere_designation?: string;
  matiere_code?: string;
}

export interface Achat {
  id: string;
  numero: string;
  fournisseur_id: string;
  date_achat: string;
  date_livraison?: string;
  statut: 'commande' | 'livree' | 'facturee' | 'payee';
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  taux_tva: number;
  numero_facture_fournisseur?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AchatLigne {
  id: string;
  achat_id: string;
  ligne_numero: number;
  matiere_id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  notes?: string;
}

export interface AchatWithDetails extends Achat {
  fournisseur_nom: string;
  lignes?: AchatLigne[];
}

export interface AchatLigneWithMatiere extends AchatLigne {
  matiere_code?: string;
  matiere_designation?: string;
}

// Types pour les statistiques
export interface ProductionStats {
  bons_planifies: number;
  bons_en_cours: number;
  bons_termines_mois: number;
  temps_moyen_production: number;
}

export interface AchatStats {
  achats_en_attente: number;
  montant_achats_mois: number;
  nb_fournisseurs_actifs: number;
}