import { supabase } from './supabase';
import type { BonTravail, BonTravailWithDetails, Achat, AchatWithDetails, AchatLigne, ProductionStats, AchatStats } from '../types/production';

// === BONS DE TRAVAIL ===

export async function getBonsTravail(): Promise<BonTravailWithDetails[]> {
  const { data, error } = await supabase
    .from('bons_travail')
    .select(`
      *,
      commandes(numero, clients(nom)),
      matieres(code, designation)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    commande_numero: item.commandes?.numero,
    client_nom: item.commandes?.clients?.nom,
    matiere_code: item.matieres?.code,
    matiere_designation: item.matieres?.designation,
  }));
}

export async function getBonTravailById(id: string): Promise<BonTravail | null> {
  const { data, error } = await supabase
    .from('bons_travail')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBonTravail(bon: Omit<BonTravail, 'id' | 'created_at' | 'updated_at'>): Promise<BonTravail> {
  const { data, error } = await supabase
    .from('bons_travail')
    .insert(bon)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBonTravail(id: string, bon: Partial<BonTravail>): Promise<BonTravail> {
  const { data, error } = await supabase
    .from('bons_travail')
    .update({ ...bon, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function startBonTravail(id: string): Promise<void> {
  const { error } = await supabase
    .from('bons_travail')
    .update({ 
      statut: 'en_cours', 
      date_debut: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw error;
}

export async function completeBonTravail(id: string, quantiteProduite: number, quantiteChutes: number = 0): Promise<void> {
  const { error } = await supabase.rpc('complete_bon_travail', {
    p_bon_id: id,
    p_quantite_produite: quantiteProduite,
    p_quantite_chutes: quantiteChutes
  });

  if (error) throw error;
}

// === ACHATS ===

export async function getAchats(): Promise<AchatWithDetails[]> {
  const { data, error } = await supabase
    .from('achats')
    .select(`
      *,
      fournisseurs(nom)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    fournisseur_nom: item.fournisseurs?.nom || '',
  }));
}

export async function getAchatById(id: string): Promise<AchatWithDetails | null> {
  const { data, error } = await supabase
    .from('achats')
    .select(`
      *,
      fournisseurs(nom),
      achats_lignes(*, matieres(code, designation))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    fournisseur_nom: data.fournisseurs?.nom || '',
    lignes: data.achats_lignes || [],
  };
}

export async function createAchat(achat: Omit<Achat, 'id' | 'created_at' | 'updated_at'>): Promise<Achat> {
  const { data, error } = await supabase
    .from('achats')
    .insert(achat)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAchat(id: string, achat: Partial<Achat>): Promise<Achat> {
  const { data, error } = await supabase
    .from('achats')
    .update({ ...achat, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAchatLignes(achatId: string): Promise<AchatLigne[]> {
  const { data, error } = await supabase
    .from('achats_lignes')
    .select('*')
    .eq('achat_id', achatId)
    .order('ligne_numero');

  if (error) throw error;
  return data || [];
}

export async function saveAchatLignes(achatId: string, lignes: Omit<AchatLigne, 'id' | 'achat_id'>[]): Promise<void> {
  // Supprimer les anciennes lignes
  await supabase
    .from('achats_lignes')
    .delete()
    .eq('achat_id', achatId);

  // Insérer les nouvelles lignes
  if (lignes.length > 0) {
    const { error } = await supabase
      .from('achats_lignes')
      .insert(lignes.map(ligne => ({ ...ligne, achat_id: achatId })));

    if (error) throw error;
  }
}

export async function receiveAchat(id: string): Promise<void> {
  const { error } = await supabase.rpc('receive_achat', {
    p_achat_id: id
  });

  if (error) throw error;
}

// === UTILITAIRES ===

export async function getCommandes() {
  const { data, error } = await supabase
    .from('commandes')
    .select('id, numero, client_id, clients(nom)')
    .in('statut', ['en_cours', 'en_production'])
    .order('numero');

  if (error) throw error;
  return (data || []).map(item => ({
    ...item,
    client_nom: item.clients?.nom || '',
  }));
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

export async function getMatieres() {
  const { data, error } = await supabase
    .from('matieres')
    .select('id, code, designation, unite, prix_achat_unitaire')
    .eq('actif', true)
    .order('designation');

  if (error) throw error;
  return data || [];
}

// === STATISTIQUES ===

export async function getProductionStats(): Promise<ProductionStats> {
  const [planifies, enCours, terminesMois, tempsMoyen] = await Promise.all([
    supabase.from('bons_travail').select('*', { count: 'exact', head: true }).eq('statut', 'planifie'),
    supabase.from('bons_travail').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
    supabase.from('bons_travail').select('*', { count: 'exact', head: true })
      .eq('statut', 'termine')
      .gte('date_fin', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('bons_travail').select('temps_reel_minutes').eq('statut', 'termine').not('temps_reel_minutes', 'is', null)
  ]);

  const moyenneTemps = tempsMoyen.data?.length ? 
    tempsMoyen.data.reduce((sum, bon) => sum + (bon.temps_reel_minutes || 0), 0) / tempsMoyen.data.length : 0;

  return {
    bons_planifies: planifies.count || 0,
    bons_en_cours: enCours.count || 0,
    bons_termines_mois: terminesMois.count || 0,
    temps_moyen_production: moyenneTemps,
  };
}

export async function getAchatStats(): Promise<AchatStats> {
  const [enAttente, montantMois, fournisseurs] = await Promise.all([
    supabase.from('achats').select('*', { count: 'exact', head: true }).eq('statut', 'commande'),
    supabase.from('achats').select('montant_ttc')
      .gte('date_achat', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('fournisseurs').select('*', { count: 'exact', head: true }).eq('actif', true)
  ]);

  const totalMois = montantMois.data?.reduce((sum, achat) => sum + Number(achat.montant_ttc), 0) || 0;

  return {
    achats_en_attente: enAttente.count || 0,
    montant_achats_mois: totalMois,
    nb_fournisseurs_actifs: fournisseurs.count || 0,
  };
}