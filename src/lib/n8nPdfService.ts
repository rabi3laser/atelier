import type { N8nQuoteRequest, N8nQuoteResponse } from '../types/n8n';

export class N8nPdfService {
  private static readonly WEBHOOK_URL = 'https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate';
  
  static async generatePDF(requestData: N8nQuoteRequest): Promise<N8nQuoteResponse> {
    
    try {
      console.log('🚀 Génération PDF via n8n:', requestData.quote_data.number);
      console.log('📊 Données envoyées:', requestData);

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('📡 Statut réponse:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Impossible de lire la réponse');
        console.error('❌ Réponse d\'erreur:', errorText);
        
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

      const result = await this.generatePDF(testData);
      return result.success;
    } catch {
      return false;
    }
  }
}

export const n8nPdfService = N8nPdfService;