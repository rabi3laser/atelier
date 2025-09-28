export interface Matiere {
  id: string;
  code: string;
  designation: string;
  unite: string;
  prix_achat_unitaire?: number;
  prix_vente_unitaire?: number;
  epaisseur?: number;
  largeur?: number;
  longueur?: number;
  couleur?: string;
  fournisseur_id?: string;
  actif?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Stock {
  id: string;
  matiere_id: string;
  quantite: number;
  quantite_reservee: number;
  quantite_disponible: number;
  valeur_stock: number;
  prix_moyen_pondere: number;
  updated_at?: string;
}

export interface MouvementStock {
  id: string;
  matiere_id: string;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'chute';
  quantite: number;
  prix_unitaire?: number;
  valeur_mouvement?: number;
  reference_document?: string;
  type_document?: string;
  document_id?: string;
  commentaire?: string;
  created_at?: string;
}

export interface MatiereWithStock extends Matiere {
  stock?: Stock;
  fournisseur_nom?: string;
}

export interface StockAlert {
  matiere_id: string;
  code: string;
  designation: string;
  quantite_disponible: number;
  seuil_alerte: number;
  type_alerte: 'rupture' | 'faible';
}