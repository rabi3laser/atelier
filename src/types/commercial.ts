// Types pour le pipeline commercial

export interface Devis {
  id: string;
  numero: string;
  client_id: string;
  date_devis: string;
  date_validite: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  taux_tva: number;
  remise_globale_pct?: number;
  conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DevisLigne {
  id: string;
  devis_id: string;
  ligne_numero: number;
  matiere_id?: string;
  designation: string;
  mode_facturation: 'm2' | 'feuille' | 'service';
  quantite: number;
  prix_unitaire_ht: number;
  remise_pct: number;
  montant_ht: number;
  tva_pct: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
}

export interface Commande {
  id: string;
  numero: string;
  devis_id?: string;
  client_id: string;
  date_commande: string;
  date_livraison_prevue?: string;
  statut: 'en_cours' | 'en_production' | 'prete' | 'livree' | 'annulee';
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  taux_tva: number;
  remise_globale_pct?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Facture {
  id: string;
  numero?: string;
  commande_id?: string;
  client_id: string;
  date_facture: string;
  date_echeance: string;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  montant_paye: number;
  reste_du: number;
  taux_tva: number;
  conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FactureLigne {
  id: string;
  facture_id: string;
  ligne_numero: number;
  matiere_id?: string;
  designation: string;
  mode_facturation: 'm2' | 'feuille' | 'service';
  quantite: number;
  prix_unitaire_ht: number;
  remise_pct: number;
  montant_ht: number;
  tva_pct: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
}

export interface Paiement {
  id: string;
  facture_id: string;
  date_paiement: string;
  montant: number;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'prelevement';
  reference?: string;
  notes?: string;
  created_at: string;
}

// Types avec relations
export interface DevisWithClient extends Devis {
  client_nom: string;
  client_email?: string;
}

export interface CommandeWithClient extends Commande {
  client_nom: string;
  devis_numero?: string;
}

export interface FactureWithClient extends Facture {
  client_nom: string;
  commande_numero?: string;
}

export interface PaiementWithFacture extends Paiement {
  facture_numero: string;
  client_nom: string;
}