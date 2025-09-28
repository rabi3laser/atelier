import { supabase } from './supabase';
import { DevisData } from './pdfGenerator';

export interface N8nQuoteRequest {
  quote_data: {
    id: string;
    number: string;
    date: string;
    valid_until?: string;
    currency: string;
    customer_id: string;
    customer: {
      name: string;
      address?: string;
      postal_code?: string;
      city?: string;
      phone?: string;
      email?: string;
      ice?: string;
      rc?: string;
    };
    company: {
      name: string;
      address?: string;
      city?: string;
      phone?: string;
      email?: string;
      ice?: string;
      rc?: string;
      if?: string;
    };
    items: Array<{
      sku?: string;
      label: string;
      qty: number;
      unit?: string;
      unit_price: number;
      discount?: number;
      tax_rate?: number;
      notes?: string;
    }>;
    global_discount?: number;
    tax_rate: number;
    payment_terms?: string;
    notes?: string;
  };
  template_id?: string;
  org_id: string;
}

export interface N8nQuoteResponse {
  success: boolean;
  quote?: {
    id: string;
    number: string;
    pdf_url: string;
    file_name: string;
    file_size: number;
    file_size_kb: number;
    pages: number;
  };
  upload?: {
    successful: boolean;
    url: string;
  };
  database_update?: {
    successful: boolean;
    updated_records: number;
  };
  template_used?: string;
  generation_time?: string;
  calculations?: {
    items_count: number;
    subtotal: number;
    discount_applied: number;
    tax_applied: number;
    grand_total: number;
  };
  error?: string;
  error_type?: string;
  stage?: string;
  quote_number?: string;
  timestamp?: string;
  troubleshooting?: {
    possible_causes: string[];
    next_steps: string[];
  };
  message?: string;
}

export interface N8nSendRequest {
  quote_id: string;
  send_methods: ('email' | 'whatsapp')[];
  recipient_email?: string;
  recipient_phone?: string;
  custom_message?: string;
  send_reminders?: boolean;
  allow_signature?: boolean;
}

export interface N8nSendResponse {
  success: boolean;
  sent_via?: string[];
  tracking_id?: string;
  error?: string;
}

export class N8nQuoteService {
  // Convertir données devis existantes vers format n8n
  static convertDevisToN8nFormat(devisData: DevisData): N8nQuoteRequest {
    // S'assurer que les lignes existent et sont valides
    const validItems = devisData.lignes && devisData.lignes.length > 0 
      ? devisData.lignes.map(ligne => ({
          sku: ligne.matiere_id || undefined,
          label: ligne.designation || 'Article sans nom',
          qty: ligne.quantite || 1,
          unit: ligne.mode_facturation || 'm²',
          unit_price: ligne.prix_unitaire_ht || 0,
          discount: ligne.remise_pct || 0,
          tax_rate: ligne.tva_pct || 20,
          notes: ligne.notes || undefined,
        }))
      : [{
          label: 'Article par défaut',
          qty: 1,
          unit: 'm²',
          unit_price: 0,
          discount: 0,
          tax_rate: 20,
        }];

    return {
      quote_data: {
        id: `quote_${Date.now()}`,
        number: devisData.numero,
        date: devisData.date_devis,
        valid_until: devisData.date_validite,
        currency: 'MAD',
        customer_id: 'legacy',
        customer: {
          name: devisData.client.nom,
          address: devisData.client.adresse,
          postal_code: devisData.client.code_postal,
          city: devisData.client.ville,
          phone: devisData.client.telephone,
          email: devisData.client.email,
          ice: devisData.client.ice,
          rc: devisData.client.rc,
        },
        company: {
          name: devisData.entreprise?.nom || 'DECOUPE EXPRESS',
          address: devisData.entreprise?.adresse || 'BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA',
          city: devisData.entreprise?.ville || 'MOHAMMEDIA',
          phone: devisData.entreprise?.telephone || 'TEL: 05 23 30 58 80 / 06 66 04 58 24',
          email: devisData.entreprise?.email || 'contact@decoupe-express.ma',
          ice: devisData.entreprise?.ice || 'ICE: 002741154000000',
          rc: devisData.entreprise?.rc || 'RC: 27441/14',
          if: devisData.entreprise?.if || 'IF: 40208300',
        },
        items: validItems,
        global_discount: devisData.remise_globale_pct || 0,
        tax_rate: devisData.taux_tva,
        payment_terms: devisData.conditions || 'Paiement à 30 jours fin de mois',
        notes: devisData.notes,
      },
      template_id: localStorage.getItem('devis_template_id') || undefined,
      org_id: 'test123',
    };
  }

  // Générer PDF via n8n workflow
  static async generateQuotePDF(quoteData: N8nQuoteRequest): Promise<N8nQuoteResponse> {
    try {
      console.log('🚀 Génération PDF via n8n workflow:', quoteData.quote_data.number);
      console.log('📊 Données envoyées:', quoteData);
      
      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        
        // Essayer de parser l'erreur JSON
        try {
          const errorJson = JSON.parse(errorText);
          return errorJson;
        } catch {
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }
      }
      
      const result: N8nQuoteResponse = await response.json();
      console.log('✅ Réponse n8n:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Erreur n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        error_type: 'network_error',
        stage: 'request_failed',
      };
    }
  }

  // Envoyer devis via n8n workflow
  static async sendQuote(sendData: N8nSendRequest): Promise<N8nSendResponse> {
    try {
      console.log('📧 Envoi devis via n8n workflow Send & Track');
      console.log('📊 Données envoi:', sendData);
      
      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/quotes/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result: N8nSendResponse = await response.json();
      console.log('✅ Réponse n8n Send & Track:', result);
      
      // Mettre à jour le devis dans Supabase
      if (result.success) {
        await supabase
          .from('devis')
          .update({ 
            sent_at: new Date().toISOString(),
            meta: { 
              tracking_id: result.tracking_id,
              sent_via: result.sent_via 
            }
          })
          .eq('numero', sendData.quote_id);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur envoi devis n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Mettre à jour devis avec PDF généré
  static async updateDevisWithPDF(devisId: string, pdfUrl: string): Promise<void> {
    const { error } = await supabase
      .from('devis')
      .update({ 
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', devisId);
    
    if (error) throw error;
  }
}

export const n8nQuoteService = N8nQuoteService;