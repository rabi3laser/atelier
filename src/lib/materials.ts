import { supabase } from './supabase';
import type { Matiere, Stock, MouvementStock, MatiereWithStock } from '../types/material';

export async function getMatieres(): Promise<MatiereWithStock[]> {
  const { data, error } = await supabase
    .from('matieres')
    .select(`
      *,
      fournisseurs(nom),
      stocks(*)
    `)
    .eq('actif', true)
    .order('designation');

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    fournisseur_nom: item.fournisseurs?.nom,
    stock: item.stocks?.[0] || null,
  }));
}

export async function getMatiere(id: string): Promise<MatiereWithStock | null> {
  const { data, error } = await supabase
    .from('matieres')
    .select(`
      *,
      fournisseurs(nom),
      stocks(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    fournisseur_nom: data.fournisseurs?.nom,
    stock: data.stocks?.[0] || null,
  };
}

export async function createMatiere(matiere: Omit<Matiere, 'id' | 'created_at' | 'updated_at'>): Promise<Matiere> {
  const { data, error } = await supabase
    .from('matieres')
    .insert(matiere)
    .select()
    .single();

  if (error) throw error;
  
  // Créer le stock initial à 0
  await supabase
    .from('stocks')
    .insert({
      matiere_id: data.id,
      quantite: 0,
      quantite_reservee: 0,
      valeur_stock: 0,
      prix_moyen_pondere: 0,
    });

  return data;
}

export async function updateMatiere(id: string, matiere: Partial<Matiere>): Promise<Matiere> {
  const { data, error } = await supabase
    .from('matieres')
    .update({ ...matiere, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMatiere(id: string): Promise<void> {
  const { error } = await supabase
    .from('matieres')
    .update({ actif: false })
    .eq('id', id);

  if (error) throw error;
}

export async function getMouvementsStock(matiereId: string, limit = 20): Promise<MouvementStock[]> {
  const { data, error } = await supabase
    .from('mouvements_stock')
    .select('*')
    .eq('matiere_id', matiereId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createMouvementStock(mouvement: Omit<MouvementStock, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.rpc('create_mouvement_stock', {
    p_matiere_id: mouvement.matiere_id,
    p_type_mouvement: mouvement.type_mouvement,
    p_quantite: mouvement.quantite,
    p_prix_unitaire: mouvement.prix_unitaire || 0,
    p_reference_document: mouvement.reference_document || '',
    p_type_document: mouvement.type_document || '',
    p_document_id: mouvement.document_id || null,
    p_commentaire: mouvement.commentaire || '',
  });

  if (error) throw error;
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