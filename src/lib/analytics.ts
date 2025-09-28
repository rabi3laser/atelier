import { supabase } from './supabase';
import type { 
  Projet, ProjetWithClient,
  Emplacement,
  LotMatiere, LotMatiereWithDetails,
  PlanningRessource, PlanningRessourceWithDetails,
  ChuteValorisable, ChuteValorisableWithDetails,
  PerformanceMensuelle,
  AnalyseABCMatiere,
  SuggestionRestock,
  AnalyticsStats
} from '../types/analytics';

// === PROJETS ===

export async function getProjets(): Promise<ProjetWithClient[]> {
  const { data, error } = await supabase
    .from('commandes')
    .select(`
      *,
      clients(nom)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    client_nom: item.clients?.nom || '',
  }));
}

export async function getProjetById(id: string): Promise<Projet | null> {
  const { data, error } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProjet(projet: Omit<Projet, 'id' | 'created_at' | 'updated_at'>): Promise<Projet> {
  const { data, error } = await supabase
    .from('commandes')
    .insert(projet)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjet(id: string, projet: Partial<Projet>): Promise<Projet> {
  const { data, error } = await supabase
    .from('commandes')
    .update({ ...projet, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === EMPLACEMENTS ===

export async function getEmplacements(): Promise<Emplacement[]> {
  // Table emplacements n'existe pas encore, retourner un tableau vide
  return [];
}

export async function createEmplacement(emplacement: Omit<Emplacement, 'id' | 'created_at'>): Promise<Emplacement> {
  // Table emplacements n'existe pas encore, simuler une création
  throw new Error('La fonctionnalité des emplacements n\'est pas encore disponible. Veuillez créer la table emplacements dans Supabase.');
}

export async function updateEmplacement(id: string, emplacement: Partial<Emplacement>): Promise<Emplacement> {
  // Table emplacements n'existe pas encore, simuler une mise à jour
  throw new Error('La fonctionnalité des emplacements n\'est pas encore disponible. Veuillez créer la table emplacements dans Supabase.');
}

// === LOTS MATIÈRES ===

export async function getLotsMatiere(): Promise<LotMatiereWithDetails[]> {
  // Table lots_matieres n'existe pas encore, retourner un tableau vide
  return [];
}

export async function createLotMatiere(lot: Omit<LotMatiere, 'id' | 'created_at'>): Promise<LotMatiere> {
  // Table lots_matieres n'existe pas encore, simuler une création
  throw new Error('La fonctionnalité des lots de matières n\'est pas encore disponible. Veuillez créer la table lots_matieres dans Supabase.');
}

// === PLANNING RESSOURCES ===

export async function getPlanningRessources(dateDebut?: string, dateFin?: string): Promise<PlanningRessourceWithDetails[]> {
  // Table planning_ressources n'existe pas encore, retourner un tableau vide
  return [];
}

export async function createPlanningRessource(planning: Omit<PlanningRessource, 'id' | 'created_at' | 'updated_at'>): Promise<PlanningRessource> {
  // Table planning_ressources n'existe pas encore, simuler une création
  throw new Error('La fonctionnalité du planning des ressources n\'est pas encore disponible. Veuillez créer la table planning_ressources dans Supabase.');
}

export async function updatePlanningRessource(id: string, planning: Partial<PlanningRessource>): Promise<PlanningRessource> {
  // Table planning_ressources n'existe pas encore, simuler une mise à jour
  throw new Error('La fonctionnalité du planning des ressources n\'est pas encore disponible. Veuillez créer la table planning_ressources dans Supabase.');
}

// === CHUTES VALORISABLES ===

export async function getChutesValorisables(): Promise<ChuteValorisableWithDetails[]> {
  const { data, error } = await supabase
    .from('v_stock_valorise')
    .select(`
      *,
      matieres(code, designation),
      matieres!inner(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    matiere_code: item.matieres?.code || '',
    matiere_designation: item.matieres?.designation || '',
    emplacement_nom: '',
    bon_travail_numero: '',
  }));
}

export async function createChuteValorisable(chute: Omit<ChuteValorisable, 'id' | 'created_at'>): Promise<ChuteValorisable> {
  const { data, error } = await supabase
    .from('v_stock_valorise')
    .insert(chute)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChuteValorisable(id: string, chute: Partial<ChuteValorisable>): Promise<ChuteValorisable> {
  const { data, error } = await supabase
    .from('v_stock_valorise')
    .update(chute)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === VUES ANALYTIQUES ===

export async function getPerformanceMensuelle(): Promise<PerformanceMensuelle[]> {
  // Vue v_performance_mensuelle n'existe pas encore, retourner un tableau vide
  return [];
}

export async function getAnalyseABCMatieres(): Promise<AnalyseABCMatiere[]> {
  // Vue v_analyse_abc_matieres n'existe pas encore, retourner un tableau vide
  return [];
}

export async function getSuggestionsRestock(): Promise<SuggestionRestock[]> {
  // Vue v_suggestions_restock n'existe pas encore, retourner un tableau vide
  return [];
}

// === STATISTIQUES ===

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const [projetsActifs, ressourcesOccupees, chutesDisponibles, valeurChutes] = await Promise.all([
    supabase.from('commandes').select('*', { count: 'exact', head: true }).in('statut', ['en_cours', 'en_production']),
    supabase.from('bons_travail').select('*', { count: 'exact', head: true }).in('statut', ['planifie', 'en_cours']),
    supabase.from('v_stock_valorise').select('*', { count: 'exact', head: true }).gt('quantite_disponible', 0),
    supabase.from('v_stock_valorise').select('valeur_stock').gt('quantite_disponible', 0)
  ]);

  const valeurTotaleChutes = valeurChutes.data?.reduce((sum, chute) => sum + Number(chute.valeur_stock), 0) || 0;

  return {
    projets_actifs: projetsActifs.count || 0,
    ressources_occupees: ressourcesOccupees.count || 0,
    chutes_valorisables: chutesDisponibles.count || 0,
    valeur_chutes_disponibles: valeurTotaleChutes,
  };
}

// === UTILITAIRES ===

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, nom')
    .eq('actif', true)
    .order('nom');

  if (error) throw error;
  return data || [];
}

export async function getMatieres() {
  const { data, error } = await supabase
    .from('matieres')
    .select('id, code, designation')
    .eq('actif', true)
    .order('designation');

  if (error) throw error;
  return data || [];
}

export async function getFournisseurs() {
  const { data, error } = await supabase
    .from('fournisseurs')
    .select('id, nom')
    .eq('actif', true)
    .order('nom');

  if (error) throw error;
  return data || [];
}

// Cache localStorage pour optimiser les performances
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore localStorage errors
  }
}

export async function getCachedMatieres() {
  const cached = getCachedData<any[]>('matieres');
  if (cached) return cached;
  
  const data = await getMatieres();
  setCachedData('matieres', data);
  return data;
}

export async function getCachedClients() {
  const cached = getCachedData<any[]>('clients');
  if (cached) return cached;
  
  const data = await getClients();
  setCachedData('clients', data);
  return data;
}