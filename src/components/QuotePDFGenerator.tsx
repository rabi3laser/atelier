import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  Save, 
  Plus, 
  Trash2, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { N8nQuoteGenerator } from '../lib/n8nQuoteGenerator';
import type { N8nQuoteData, N8nQuoteItem, QuoteDraft, ValidationError } from '../types/n8n';
import { getClients } from '../lib/commercial';
import { templateService } from '../lib/templateService';
import Card from './Card';
import Button from './Button';
import FormRow from './FormRow';
import NumberInput from './NumberInput';
import Badge from './Badge';
import Modal from './Modal';

interface QuotePDFGeneratorProps {
  initialData?: Partial<N8nQuoteData>;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

export default function QuotePDFGenerator({ 
  initialData, 
  onSuccess, 
  onError 
}: QuotePDFGeneratorProps) {
  const [quoteData, setQuoteData] = useState<N8nQuoteData>({
    id: '',
    number: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'MAD',
    customer_id: '',
    customer: {
      name: '',
      address: '',
      postal_code: '',
      city: '',
      phone: '',
      email: '',
      ice: '',
      rc: '',
    },
    company: {
      name: 'DECOUPE EXPRESS',
      address: 'BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA',
      city: 'MOHAMMEDIA',
      phone: 'TEL: 05 23 30 58 80 / 06 66 04 58 24',
      email: 'contact@decoupe-express.ma',
      ice: 'ICE: 002741154000000',
      rc: 'RC: 27441/14',
      if: 'IF: 40208300',
    },
    items: [{
      label: '',
      qty: 1,
      unit: 'm²',
      unit_price: 0,
      discount: 0,
      tax_rate: 20,
    }],
    global_discount: 0,
    tax_rate: 20,
    payment_terms: 'Paiement à 30 jours fin de mois',
    notes: '',
    ...initialData,
  });

  const [clients, setClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState<QuoteDraft[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  useEffect(() => {
    loadInitialData();
    loadDrafts();
    testN8nConnection();
  }, []);

  useEffect(() => {
    // Auto-validation en temps réel
    const errors = N8nQuoteGenerator.validateQuoteData(quoteData);
    setValidationErrors(errors);
  }, [quoteData]);

  useEffect(() => {
    // Auto-sauvegarde brouillon toutes les 30 secondes
    const interval = setInterval(() => {
      if (quoteData.number && quoteData.customer.name) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [quoteData]);

  const loadInitialData = async () => {
    try {
      const [clientsData, templatesData] = await Promise.all([
        getClients(),
        templateService.getTemplates(),
      ]);
      
      setClients(clientsData);
      setTemplates(templatesData);

      // Sélectionner template par défaut
      const defaultTemplate = templatesData.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const loadDrafts = () => {
    const savedDrafts = N8nQuoteGenerator.getDrafts();
    setDrafts(savedDrafts);
  };

  const testN8nConnection = async () => {
    const isConnected = await N8nQuoteGenerator.testConnection();
    setConnectionStatus(isConnected ? 'success' : 'error');
  };

  const generateQuoteNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}${month}-${random}`;
  };

  const updateQuoteData = (field: string, value: any) => {
    setQuoteData(prev => {
      const keys = field.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, {
        label: '',
        qty: 1,
        unit: 'm²',
        unit_price: 0,
        discount: 0,
        tax_rate: 20,
      }],
    }));
  };

  const removeItem = (index: number) => {
    if (quoteData.items.length > 1) {
      setQuoteData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const selectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      updateQuoteData('customer_id', clientId);
      updateQuoteData('customer.name', client.nom);
      updateQuoteData('customer.address', client.adresse || '');
      updateQuoteData('customer.postal_code', client.code_postal || '');
      updateQuoteData('customer.city', client.ville || '');
      updateQuoteData('customer.phone', client.telephone || '');
      updateQuoteData('customer.email', client.email || '');
      updateQuoteData('customer.ice', client.ice || '');
      updateQuoteData('customer.rc', client.rc || '');
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      // Générer ID et numéro si manquants
      if (!quoteData.id) {
        updateQuoteData('id', `quote_${Date.now()}`);
      }
      if (!quoteData.number) {
        updateQuoteData('number', generateQuoteNumber());
      }

      const result = await N8nQuoteGenerator.generatePDF(
        quoteData,
        selectedTemplateId,
        'default'
      );

      setGenerationResult(result);

      if (result.success) {
        N8nQuoteGenerator.saveGenerationHistory(result);
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Erreur génération PDF');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setGenerationResult({
        success: false,
        error: errorMsg,
        error_type: 'client_error',
      });
      onError?.(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = () => {
    if (!quoteData.number || !quoteData.customer.name) return;

    const draft: QuoteDraft = {
      id: quoteData.id || `draft_${Date.now()}`,
      number: quoteData.number,
      customer_id: quoteData.customer_id,
      date: quoteData.date,
      valid_until: quoteData.valid_until,
      items: quoteData.items,
      global_discount: quoteData.global_discount || 0,
      tax_rate: quoteData.tax_rate,
      payment_terms: quoteData.payment_terms || '',
      notes: quoteData.notes || '',
      template_id: selectedTemplateId,
      saved_at: new Date().toISOString(),
    };

    N8nQuoteGenerator.saveDraft(draft);
    loadDrafts();
  };

  const loadDraft = (draft: QuoteDraft) => {
    setQuoteData(prev => ({
      ...prev,
      id: draft.id,
      number: draft.number,
      customer_id: draft.customer_id,
      date: draft.date,
      valid_until: draft.valid_until,
      items: draft.items,
      global_discount: draft.global_discount,
      tax_rate: draft.tax_rate,
      payment_terms: draft.payment_terms,
      notes: draft.notes,
    }));
    setSelectedTemplateId(draft.template_id || '');
    setShowDraftsModal(false);
  };

  const deleteDraft = (draftId: string) => {
    N8nQuoteGenerator.deleteDraft(draftId);
    loadDrafts();
  };

  // Calculs automatiques
  const calculations = N8nQuoteGenerator.calculateTotals(quoteData);

  const getErrorMessage = (result: any) => {
    if (!result?.error) return 'Erreur inconnue';
    
    const baseError = result.error;
    const suggestions = result.troubleshooting?.next_steps?.join(', ') || '';
    
    return suggestions ? `${baseError}. ${suggestions}` : baseError;
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut connexion */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Générateur PDF Devis
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'success' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus === 'success' ? 'n8n connecté' : 
               connectionStatus === 'error' ? 'n8n déconnecté' : 'Test connexion...'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => setShowDraftsModal(true)}
          >
            <Save size={16} className="mr-2" />
            Brouillons ({drafts.length})
          </Button>
          <Button
            variant="secondary"
            onClick={saveDraft}
            disabled={!quoteData.number || !quoteData.customer.name}
          >
            <Save size={16} className="mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Erreurs de validation */}
      {validationErrors.length > 0 && (
        <Card>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Erreurs de validation
              </h4>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 dark:text-red-400">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card title="Informations générales">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow label="Numéro de devis" required>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={quoteData.number}
                    onChange={(e) => updateQuoteData('number', e.target.value)}
                    placeholder="Auto-généré si vide"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuoteData('number', generateQuoteNumber())}
                    title="Générer numéro"
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>
              </FormRow>

              <FormRow label="Client" required>
                <select
                  value={quoteData.customer_id}
                  onChange={(e) => selectClient(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              </FormRow>

              <FormRow label="Date" required>
                <input
                  type="date"
                  value={quoteData.date}
                  onChange={(e) => updateQuoteData('date', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </FormRow>

              <FormRow label="Validité">
                <input
                  type="date"
                  value={quoteData.valid_until || ''}
                  onChange={(e) => updateQuoteData('valid_until', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </FormRow>
            </div>
          </Card>

          {/* Articles */}
          <Card title="Articles">
            <div className="space-y-4">
              {quoteData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Article {index + 1}
                    </h4>
                    {quoteData.items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormRow label="Désignation" required>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(index, 'label', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </FormRow>

                    <FormRow label="Quantité" required>
                      <NumberInput
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        decimals={3}
                        min="0"
                      />
                    </FormRow>

                    <FormRow label="Prix unitaire" required>
                      <NumberInput
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        decimals={2}
                        min="0"
                      />
                    </FormRow>

                    <FormRow label="Remise (%)">
                      <NumberInput
                        value={item.discount || 0}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        decimals={2}
                        min="0"
                        max="100"
                      />
                    </FormRow>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormRow label="Unité">
                      <select
                        value={item.unit || 'm²'}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="m²">m²</option>
                        <option value="pièce">pièce</option>
                        <option value="service">service</option>
                        <option value="ml">ml</option>
                      </select>
                    </FormRow>

                    <FormRow label="Notes">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </FormRow>
                  </div>

                  {/* Total ligne */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total ligne: <span className="font-medium">
                        {(item.qty * item.unit_price * (1 - (item.discount || 0) / 100)).toFixed(2)} MAD
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={addItem}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Ajouter un article
              </Button>
            </div>
          </Card>

          {/* Conditions et notes */}
          <Card title="Conditions et notes">
            <div className="space-y-4">
              <FormRow label="Conditions de paiement">
                <textarea
                  value={quoteData.payment_terms || ''}
                  onChange={(e) => updateQuoteData('payment_terms', e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </FormRow>

              <FormRow label="Notes">
                <textarea
                  value={quoteData.notes || ''}
                  onChange={(e) => updateQuoteData('notes', e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </FormRow>
            </div>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Template */}
          <Card title="Template">
            <FormRow label="Modèle de devis">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Template par défaut</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </FormRow>
          </Card>

          {/* Calculs */}
          <Card title="Calculs automatiques">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Sous-total:</span>
                <span className="font-medium">{calculations.subtotal.toFixed(2)} MAD</span>
              </div>
              
              <FormRow label="Remise globale (%)">
                <NumberInput
                  value={quoteData.global_discount || 0}
                  onChange={(e) => updateQuoteData('global_discount', parseFloat(e.target.value) || 0)}
                  decimals={2}
                  min="0"
                  max="100"
                />
              </FormRow>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Remise appliquée:</span>
                <span className="font-medium text-red-600">-{calculations.discount_applied.toFixed(2)} MAD</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">TVA ({quoteData.tax_rate}%):</span>
                <span className="font-medium">{calculations.tax_applied.toFixed(2)} MAD</span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total TTC:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {calculations.grand_total.toFixed(2)} MAD
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              <Button
                onClick={generatePDF}
                disabled={isGenerating || validationErrors.length > 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-2" />
                    Générer PDF
                  </>
                )}
              </Button>

              {generationResult?.success && generationResult.quote?.pdf_url && (
                <Button
                  variant="secondary"
                  onClick={() => window.open(generationResult.quote.pdf_url, '_blank')}
                  className="w-full"
                >
                  <Download size={16} className="mr-2" />
                  Télécharger PDF
                </Button>
              )}
            </div>
          </Card>

          {/* Résultat génération */}
          {generationResult && (
            <Card title="Résultat">
              {generationResult.success ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <CheckCircle size={16} />
                    <span className="font-medium">PDF généré avec succès</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fichier:</span>
                      <span className="font-medium">{generationResult.quote?.file_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                      <span className="font-medium">{generationResult.quote?.file_size_kb} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pages:</span>
                      <span className="font-medium">{generationResult.quote?.pages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Template:</span>
                      <span className="font-medium">{generationResult.template_used}</span>
                    </div>
                  </div>

                  {generationResult.calculations && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        Calculs vérifiés
                      </h5>
                      <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <div>Articles: {generationResult.calculations.items_count}</div>
                        <div>Total: {generationResult.calculations.grand_total.toFixed(2)} MAD</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                    <XCircle size={16} />
                    <span className="font-medium">Erreur de génération</span>
                  </div>
                  
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <div className="font-medium mb-1">
                      {generationResult.error_type || 'Erreur inconnue'}
                    </div>
                    <div>{getErrorMessage(generationResult)}</div>
                  </div>

                  {generationResult.troubleshooting && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Causes possibles:
                      </h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {generationResult.troubleshooting.possible_causes.map((cause: string, i: number) => (
                          <li key={i}>• {cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Réessayer
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Modal brouillons */}
      <Modal
        isOpen={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        title="Brouillons sauvegardés"
        size="lg"
      >
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun brouillon sauvegardé
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {draft.number}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {draft.items.length} articles • {new Date(draft.saved_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadDraft(draft)}
                  >
                    Charger
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDraft(draft.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}