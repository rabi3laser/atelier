export interface Client {
  id: string;
  code: string;
  nom: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siret?: string;
  ice?: string;
  rc?: string;
  if?: string;
  conditions_paiement?: number;
  actif?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientHistorique {
  client_id: string;
  client_nom: string;
  type_doc: 'devis' | 'commande' | 'facture' | 'paiement';
  doc_id: string;
  doc_numero: string;
  date_doc: string;
  montant: number;
  statut: string;
  created_at: string;
}

export interface ClientStats {
  ca_total: number;
  reste_du: number;
  nb_devis: number;
  nb_commandes: number;
  nb_factures: number;
  derniere_commande?: string;
}