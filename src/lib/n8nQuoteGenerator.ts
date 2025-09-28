import { supabase } from './supabase';
import type { 
  N8nQuoteRequest, 
  N8nQuoteResponse, 
  N8nQuoteData, 
  QuoteDraft,
  ValidationError 
} from '../types/n8n';

export class N8nQuoteGenerator {
  private static readonly WEBHOOK_URL = 'https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate';
  private static readonly TIMEOUT = 30000; // 30 secondes
  private static readonly RETRY_ATTEMPTS = 3;

  // Validation des données avant envoi
  static validateQuoteData(quoteData: N8nQuoteData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Champs obligatoires
    if (!quoteData.number?.trim()) {
      errors.push({ field: 'number', message: 'Numéro de devis obligatoire' });
    }

    if (!quoteData.date) {
      errors.push({ field: 'date', message: 'Date du devis obligatoire' });
    }

    if (!quoteData.customer?.name?.trim()) {
      errors.push({ field: 'customer.name', message: 'Nom du client obligatoire' });
    }

    if (!quoteData.company?.name?.trim()) {
      errors.push({ field: 'company.name', message: 'Nom de l\'entreprise obligatoire' });
    }

    if (!quoteData.items || quoteData.items.length === 0) {
      errors.push({ field: 'items', message: 'Au moins un article requis' });
    }

    // Validation des articles
    quoteData.items?.forEach((item, index) => {
      if (!item.label?.trim()) {
        errors.push({ 
          field: `items[${index}].label`, 
          message: `Libellé obligatoire pour l'article ${index + 1}` 
        });
      }

      if (!item.qty || item.qty <= 0) {
        errors.push({ 
          field: `items[${index}].qty`, 
          message: `Quantité invalide pour l'article ${index + 1}`,
          value: item.qty 
        });
      }

      if (item.unit_price < 0) {
        errors.push({ 
          field: `items[${index}].unit_price`, 
          message: `Prix unitaire invalide pour l'article ${index + 1}`,
          value: item.unit_price 
        });
      }
    });

    return errors;
  }

  // Calculs automatiques
  static calculateTotals(quoteData: N8nQuoteData): {
    subtotal: number;
    discount_applied: number;
    tax_applied: number;
    grand_total: number;
  } {
    let subtotal = 0;

    // Calculer sous-total par article
    quoteData.items.forEach(item => {
      const itemTotal = item.qty * item.unit_price;
      const itemDiscount = itemTotal * ((item.discount || 0) / 100);
      subtotal += itemTotal - itemDiscount;
    });

    // Appliquer remise globale
    const globalDiscount = subtotal * ((quoteData.global_discount || 0) / 100);
    const subtotalAfterDiscount = subtotal - globalDiscount;

    // Calculer TVA
    const taxApplied = subtotalAfterDiscount * (quoteData.tax_rate / 100);
    const grandTotal = subtotalAfterDiscount + taxApplied;

    return {
      subtotal,
      discount_applied: globalDiscount,
      tax_applied: taxApplied,
      grand_total: grandTotal,
    };
  }

  // Génération PDF avec retry automatique
  static async generatePDF(
    quoteData: N8nQuoteData, 
    templateId?: string,
    orgId: string = 'default'
  ): Promise<N8nQuoteResponse> {
    // Validation préalable
    const validationErrors = this.validateQuoteData(quoteData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Données invalides: ${validationErrors.map(e => e.message).join(', ')}`,
        error_type: 'validation_error',
        stage: 'client_validation',
      };
    }

    const request: N8nQuoteRequest = {
      quote_data: quoteData,
      template_id: templateId,
      org_id: orgId,
    };

    console.log('🚀 Génération PDF via n8n:', {
      quote_number: quoteData.number,
      customer: quoteData.customer.name,
      items_count: quoteData.items.length,
      template_id: templateId,
    });

    // Retry avec backoff exponentiel
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`📡 Tentative ${attempt} - Statut:`, response.status);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Erreur de communication');
          
          if (attempt === this.RETRY_ATTEMPTS) {
            throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
          }
          
          // Attendre avant retry (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        const result: N8nQuoteResponse = await response.json();
        console.log('✅ PDF généré avec succès:', result);

        // Mettre à jour Supabase si succès
        if (result.success && result.quote?.pdf_url) {
          await this.updateDevisWithPDF(quoteData.id, result.quote.pdf_url);
        }

        return result;

      } catch (error) {
        console.error(`❌ Tentative ${attempt} échouée:`, error);

        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt === this.RETRY_ATTEMPTS) {
            return {
              success: false,
              error: 'Timeout - Le serveur n8n ne répond pas',
              error_type: 'timeout_error',
              stage: 'network_request',
            };
          }
        } else if (attempt === this.RETRY_ATTEMPTS) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur de connexion',
            error_type: 'network_error',
            stage: 'network_request',
          };
        }

        // Attendre avant retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error: 'Échec après plusieurs tentatives',
      error_type: 'retry_exhausted',
      stage: 'final_attempt',
    };
  }

  // Mettre à jour le devis avec l'URL du PDF
  private static async updateDevisWithPDF(devisId: string, pdfUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('devis')
        .update({ 
          pdf_url: pdfUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', devisId);
      
      if (error) {
        console.error('❌ Erreur mise à jour Supabase:', error);
      } else {
        console.log('✅ Devis mis à jour avec PDF URL');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour devis:', error);
    }
  }

  // Convertir données Supabase vers format n8n
  static convertSupabaseToN8n(
    devis: any,
    client: any,
    lignes: any[],
    company?: any
  ): N8nQuoteData {
    return {
      id: devis.id,
      number: devis.numero,
      date: devis.date_devis,
      valid_until: devis.date_validite,
      currency: 'MAD',
      customer_id: client.id,
      customer: {
        name: client.nom,
        address: client.adresse,
        postal_code: client.code_postal,
        city: client.ville,
        phone: client.telephone,
        email: client.email,
        ice: client.ice,
        rc: client.rc,
      },
      company: company || {
        name: 'DECOUPE EXPRESS',
        address: 'BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA',
        city: 'MOHAMMEDIA',
        phone: 'TEL: 05 23 30 58 80 / 06 66 04 58 24',
        email: 'contact@decoupe-express.ma',
        ice: 'ICE: 002741154000000',
        rc: 'RC: 27441/14',
        if: 'IF: 40208300',
      },
      items: lignes.map(ligne => ({
        sku: ligne.matiere_id || undefined,
        label: ligne.designation,
        qty: ligne.quantite,
        unit: ligne.mode_facturation,
        unit_price: ligne.prix_unitaire_ht,
        discount: ligne.remise_pct,
        tax_rate: ligne.tva_pct,
        notes: ligne.notes,
      })),
      global_discount: devis.remise_globale_pct || 0,
      tax_rate: devis.taux_tva || 20,
      payment_terms: devis.conditions || 'Paiement à 30 jours fin de mois',
      notes: devis.notes,
    };
  }

  // Gestion des brouillons
  static saveDraft(draft: QuoteDraft): void {
    try {
      const drafts = this.getDrafts();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = { ...draft, saved_at: new Date().toISOString() };
      } else {
        drafts.push({ ...draft, saved_at: new Date().toISOString() });
      }
      
      localStorage.setItem('quote_drafts', JSON.stringify(drafts));
      console.log('💾 Brouillon sauvegardé:', draft.number);
    } catch (error) {
      console.error('❌ Erreur sauvegarde brouillon:', error);
    }
  }

  static getDrafts(): QuoteDraft[] {
    try {
      const drafts = localStorage.getItem('quote_drafts');
      return drafts ? JSON.parse(drafts) : [];
    } catch {
      return [];
    }
  }

  static deleteDraft(draftId: string): void {
    try {
      const drafts = this.getDrafts().filter(d => d.id !== draftId);
      localStorage.setItem('quote_drafts', JSON.stringify(drafts));
    } catch (error) {
      console.error('❌ Erreur suppression brouillon:', error);
    }
  }

  // Historique des générations
  static saveGenerationHistory(response: N8nQuoteResponse): void {
    try {
      const history = this.getGenerationHistory();
      history.unshift({
        ...response,
        generated_at: new Date().toISOString(),
      });
      
      // Garder seulement les 50 dernières générations
      const limitedHistory = history.slice(0, 50);
      localStorage.setItem('pdf_generation_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('❌ Erreur sauvegarde historique:', error);
    }
  }

  static getGenerationHistory(): any[] {
    try {
      const history = localStorage.getItem('pdf_generation_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  // Test de connexion
  static async testConnection(): Promise<boolean> {
    try {
      const testData: N8nQuoteRequest = {
        quote_data: {
          id: 'test-connection',
          number: 'TEST-001',
          date: new Date().toISOString().split('T')[0],
          currency: 'MAD',
          customer_id: 'test',
          customer: { name: 'Test Client' },
          company: { name: 'DECOUPE EXPRESS' },
          items: [{
            label: 'Test Item',
            qty: 1,
            unit_price: 100,
          }],
          tax_rate: 20,
        },
        org_id: 'default',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}