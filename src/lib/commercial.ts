import { supabase } from './supabase';
import type { 
  Devis, DevisLigne, DevisWithClient,
  Commande, CommandeWithClient,
  Facture, FactureWithClient, FactureLigne,
  Paiement, PaiementWithFacture
} from '../types/commercial';

// === DEVIS ===

export async function getDevis(): Promise<DevisWithClient[]> {
  const { data, error } = await supabase
    .from('devis')
    .select(`
      *,
      clients(nom, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    client_nom: item.clients?.nom || '',
    client_email: item.clients?.email,
  }));
}

export async function getDevisById(id: string): Promise<Devis | null> {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDevis(devis: Omit<Devis, 'id' | 'created_at' | 'updated_at'>): Promise<Devis> {
  const { data, error } = await supabase
    .from('devis')
    .insert(devis)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDevis(id: string, devis: Partial<Devis>): Promise<Devis> {
  const { data, error } = await supabase
    .from('devis')
    .update({ ...devis, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDevisLignes(devisId: string): Promise<DevisLigne[]> {
  const { data, error } = await supabase
    .from('devis_lignes')
    .select('*')
    .eq('devis_id', devisId)
    .order('ligne_numero');

  if (error) throw error;
  return data || [];
}

export async function saveDevisLignes(devisId: string, lignes: Omit<DevisLigne, 'id' | 'devis_id'>[]): Promise<void> {
  // Supprimer les anciennes lignes
  await supabase
    .from('devis_lignes')
    .delete()
    .eq('devis_id', devisId);

  // Insérer les nouvelles lignes
  if (lignes.length > 0) {
    const { error } = await supabase
      .from('devis_lignes')
      .insert(lignes.map(ligne => ({ ...ligne, devis_id: devisId })));

    if (error) throw error;
  }
}

export async function convertDevisToCommande(devisId: string): Promise<string> {
  try {
    // Récupérer le devis
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devisId)
      .single();

    if (devisError) throw devisError;
    if (!devis) throw new Error('Devis non trouvé');

    // Générer un numéro de commande
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const numeroCommande = `CMD-${year}${month}-${randomNum}`;

    // Créer la commande
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .insert({
        numero: numeroCommande,
        devis_id: devisId,
        client_id: devis.client_id,
        date_commande: new Date().toISOString().split('T')[0],
        statut: 'en_cours',
        montant_ht: devis.montant_ht,
        montant_tva: devis.montant_tva,
        montant_ttc: devis.montant_ttc,
        taux_tva: devis.taux_tva,
        notes: devis.notes
      })
      .select()
      .single();

    if (commandeError) throw commandeError;

    // Récupérer les lignes du devis
    const { data: devisLignes, error: lignesError } = await supabase
      .from('devis_lignes')
      .select('*')
      .eq('devis_id', devisId)
      .order('ligne_numero');

    if (lignesError) throw lignesError;

    // Créer les lignes de commande
    if (devisLignes && devisLignes.length > 0) {
      const commandeLignes = devisLignes.map(ligne => ({
        commande_id: commande.id,
        ligne_numero: ligne.ligne_numero,
        matiere_id: ligne.matiere_id,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        montant_ligne: ligne.montant_ligne,
        notes: ligne.notes
      }));

      const { error: lignesCommandeError } = await supabase
        .from('commandes_lignes')
        .insert(commandeLignes);

      if (lignesCommandeError) throw lignesCommandeError;
    }

    // Mettre à jour le statut du devis
    await supabase
      .from('devis')
      .update({ statut: 'accepte' })
      .eq('id', devisId);

    return commande.id;
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    throw error;
  }
}

// === COMMANDES ===

export async function getCommandes(): Promise<CommandeWithClient[]> {
  const { data, error } = await supabase
    .from('commandes')
    .select(`
      *,
      clients(nom),
      devis(numero)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    client_nom: item.clients?.nom || '',
    devis_numero: item.devis?.numero,
  }));
}

export async function getCommandeById(id: string): Promise<Commande | null> {
  const { data, error } = await supabase
    .from('commandes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCommande(id: string, commande: Partial<Commande>): Promise<Commande> {
  const { data, error } = await supabase
    .from('commandes')
    .update({ ...commande, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === FACTURES ===

export async function getFactures(): Promise<FactureWithClient[]> {
  const { data, error } = await supabase
    .from('factures')
    .select(`
      *,
      clients(nom),
      commandes(numero)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    client_nom: item.clients?.nom || '',
    commande_numero: item.commandes?.numero,
  }));
}

export async function getFactureById(id: string): Promise<Facture | null> {
  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createFactureFromCommande(commandeId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_facture_from_commande', {
    p_commande_id: commandeId
  });

  if (error) throw error;
  return data;
}

export async function getFactureLignes(factureId: string): Promise<FactureLigne[]> {
  const { data, error } = await supabase
    .from('factures_lignes')
    .select('*')
    .eq('facture_id', factureId)
    .order('ligne_numero');

  if (error) throw error;
  return data || [];
}

// === PAIEMENTS ===

export async function getPaiements(): Promise<PaiementWithFacture[]> {
  const { data, error } = await supabase
    .from('paiements')
    .select(`
      *,
      factures(numero, clients(nom))
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    facture_numero: item.factures?.numero || '',
    client_nom: item.factures?.clients?.nom || '',
  }));
}

export async function createPaiement(paiement: Omit<Paiement, 'id' | 'created_at'>): Promise<Paiement> {
  const { data, error } = await supabase
    .from('paiements')
    .insert(paiement)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFacturePaiements(factureId: string): Promise<Paiement[]> {
  const { data, error } = await supabase
    .from('paiements')
    .select('*')
    .eq('facture_id', factureId)
    .order('date_paiement', { ascending: false });

  if (error) throw error;
  return data || [];
}

// === UTILITAIRES ===

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, nom, email')
    .eq('actif', true)
    .order('nom');

  if (error) throw error;
  return data || [];
}

export async function getMatieres() {
  const { data, error } = await supabase
    .from('matieres')
    .select('id, code, designation, unite, prix_vente_unitaire')
    .eq('actif', true)
    .order('designation');

  if (error) throw error;
  return data || [];
}