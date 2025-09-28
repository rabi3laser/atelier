// Types pour le module analytique et traçabilité

export interface Projet {
  id: string;
  code: string;
  nom: string;
  client_id: string;
  date_debut: string;
  date_fin_prevue?: string;
  date_fin_reelle?: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
  budget_prevu: number;
  cout_reel: number;
  marge_prevue_pct: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjetWithClient extends Projet {
  client_nom: string;
}

export interface Emplacement {
  id: string;
  code: string;
  nom: string;
  type_emplacement: 'stock' | 'production' | 'expedition' | 'quarantaine';
  capacite_max: number;
  unite_capacite: string;
  actif: boolean;
  notes?: string;
  created_at: string;
}

export interface LotMatiere {
  id: string;
  numero_lot: string;
  matiere_id: string;
  fournisseur_id?: string;
  date_reception: string;
  quantite_initiale: number;
  quantite_restante: number;
  prix_unitaire_lot: number;
  date_peremption?: string;
  statut: 'disponible' | 'quarantaine' | 'epuise' | 'perime';
  certificat_qualite?: string;
  notes?: string;
  created_at: string;
}

export interface LotMatiereWithDetails extends LotMatiere {
  matiere_code: string;
  matiere_designation: string;
  fournisseur_nom?: string;
}

export interface PlanningRessource {
  id: string;
  ressource_type: 'machine' | 'operateur' | 'outil';
  ressource_nom: string;
  date_debut: string;
  date_fin: string;
  projet_id?: string;
  bon_travail_id?: string;
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningRessourceWithDetails extends PlanningRessource {
  projet_nom?: string;
  bon_travail_numero?: string;
}

export interface ChuteValorisable {
  id: string;
  matiere_id: string;
  lot_origine_id?: string;
  bon_travail_origine_id?: string;
  dimensions_l: number;
  dimensions_w: number;
  surface_m2: number;
  emplacement_id?: string;
  statut: 'disponible' | 'reserve' | 'utilise' | 'rebut';
  prix_estime: number;
  date_creation: string;
  date_utilisation?: string;
  notes?: string;
  created_at: string;
}

export interface ChuteValorisableWithDetails extends ChuteValorisable {
  matiere_code: string;
  matiere_designation: string;
  emplacement_nom?: string;
  bon_travail_numero?: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  changed_fields?: string[];
  user_id: string;
  timestamp: string;
}

// Types pour les vues analytiques
export interface PerformanceMensuelle {
  mois: string;
  nb_factures: number;
  ca_ht: number;
  ca_ttc: number;
  nb_clients_actifs: number;
  panier_moyen: number;
  nb_bons_termines: number;
  production_totale_m2: number;
  temps_moyen_minutes: number;
  ca_par_m2: number;
}

export interface AnalyseABCMatiere {
  id: string;
  code: string;
  designation: string;
  valeur_totale_mouvements: number;
  quantite_consommee: number;
  nb_mouvements: number;
  quantite_disponible: number;
  valeur_stock: number;
  pourcentage_cumul: number;
  classe_abc: 'A' | 'B' | 'C';
}

export interface SuggestionRestock {
  matiere_id: string;
  code: string;
  designation: string;
  unite: string;
  quantite_disponible: number;
  prix_moyen_pondere: number;
  conso_moyenne_jour: number;
  derniere_sortie?: string;
  jours_stock_restant: number;
  niveau_alerte: 'URGENT' | 'ATTENTION' | 'SURVEILLER' | 'OK';
  quantite_suggeree: number;
}

// Types pour les statistiques
export interface AnalyticsStats {
  projets_actifs: number;
  ressources_occupees: number;
  chutes_valorisables: number;
  valeur_chutes_disponibles: number;
}