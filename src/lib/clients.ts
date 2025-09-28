import { supabase } from './supabase';
import type { Client, ClientHistorique, ClientStats } from '../types/client';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('actif', true)
    .order('nom');

  if (error) throw error;
  return data || [];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, client: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...client, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ actif: false })
    .eq('id', id);

  if (error) throw error;
}

export async function getClientHistorique(clientId: string): Promise<ClientHistorique[]> {
  const { data, error } = await supabase
    .from('v_client_historique')
    .select('*')
    .eq('client_id', clientId)
    .order('date_doc', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClientStats(clientId: string): Promise<ClientStats> {
  // CA total (factures payées)
  const { data: facturesPayees } = await supabase
    .from('factures')
    .select('montant_ttc')
    .eq('client_id', clientId)
    .eq('statut', 'payee');

  // Reste dû (factures non soldées)
  const { data: facturesImpayees } = await supabase
    .from('factures')
    .select('reste_du')
    .eq('client_id', clientId)
    .gt('reste_du', 0);

  // Compteurs
  const { count: nbDevis } = await supabase
    .from('devis')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: nbCommandes } = await supabase
    .from('commandes')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: nbFactures } = await supabase
    .from('factures')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  // Dernière commande
  const { data: derniereCommande } = await supabase
    .from('commandes')
    .select('date_commande')
    .eq('client_id', clientId)
    .order('date_commande', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ca_total: facturesPayees?.reduce((sum, f) => sum + Number(f.montant_ttc), 0) || 0,
    reste_du: facturesImpayees?.reduce((sum, f) => sum + Number(f.reste_du), 0) || 0,
    nb_devis: nbDevis || 0,
    nb_commandes: nbCommandes || 0,
    nb_factures: nbFactures || 0,
    derniere_commande: derniereCommande?.date_commande,
  };
}