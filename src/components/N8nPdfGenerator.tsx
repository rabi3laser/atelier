import React, { useState, useEffect } from 'react';
import { Download, TestTube, CheckCircle, XCircle, FileText, RefreshCw } from 'lucide-react';
import { N8nQuoteGenerator } from '../lib/n8nQuoteGenerator';
import type { N8nQuoteData } from '../types/n8n';
import Button from './Button';
import Card from './Card';

interface N8nPdfGeneratorProps {
  quoteData: N8nQuoteData;
  templateId?: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export default function N8nPdfGenerator({ 
  quoteData, 
  templateId, 
  onClose, 
  onSuccess 
}: N8nPdfGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('unknown');
      const isConnected = await N8nQuoteGenerator.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch {
      setConnectionStatus('error');
    }
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      setError('');
      setPdfUrl('');
      setResult(null);

      const response = await N8nQuoteGenerator.generatePDF(quoteData, templateId);
      setResult(response);

      if (result.success) {
        setPdfUrl(result.quote?.pdf_url || '');
        onSuccess?.(result);
      } else {
        setError(result.error || 'Erreur lors de la génération PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `devis-${quoteData.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Génération PDF - Devis {quoteData.number}
          </h3>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={testConnection}
            >
              <TestTube size={16} className="mr-2" />
              Test connexion
            </Button>
            <Button
              onClick={generatePDF}
              disabled={!pdfUrl}
              variant="secondary"
            >
              <Download size={16} className="mr-2" />
              {isGenerating ? 'Génération...' : 'Générer PDF'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-6 space-y-6">
          {/* Statut connexion */}
          <Card>
            <div className="flex items-center space-x-3">
              {connectionStatus === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">Connexion n8n OK</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">
                    Connexion n8n échouée
                  </span>
                </>
              )}
              {connectionStatus === 'unknown' && (
                <span className="text-gray-500 dark:text-gray-400">Test de connexion...</span>
              )}
            </div>
          </Card>

          {/* Aperçu des données */}
          <Card title="Données du devis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations</h4>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div>Numéro: {quoteData.number}</div>
                  <div>Date: {new Date(quoteData.date).toLocaleDateString('fr-FR')}</div>
                  <div>Articles: {quoteData.items.length}</div>
                  <div>Template: {templateId || 'Par défaut'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Client</h4>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div>Nom: {quoteData.customer.name}</div>
                  <div>Ville: {quoteData.customer.city || '-'}</div>
                  <div>Email: {quoteData.customer.email || '-'}</div>
                  <div>ICE: {quoteData.customer.ice || '-'}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action génération */}
          <Card>
            <div className="text-center space-y-4">
              <Button
                onClick={generatePDF}
                disabled={isGenerating || connectionStatus === 'error'}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileText size={20} className="mr-2" />
                    Générer PDF via n8n
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Résultat */}
          {result && (
            <Card title="Résultat de la génération">
              {result.success ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-green-700 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">PDF généré avec succès !</span>
                  </div>
                  
                  {result.quote && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fichier:</span>
                        <span className="font-medium">{result.quote.file_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                        <span className="font-medium">{result.quote.file_size_kb} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pages:</span>
                        <span className="font-medium">{result.quote.pages}</span>
                      </div>
                    </div>
                  )}

                  {result.calculations && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        Calculs vérifiés
                      </h5>
                      <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <div>Articles: {result.calculations.items_count}</div>
                        <div>Sous-total: {result.calculations.subtotal.toFixed(2)} MAD</div>
                        <div>Remise: -{result.calculations.discount_applied.toFixed(2)} MAD</div>
                        <div>TVA: {result.calculations.tax_applied.toFixed(2)} MAD</div>
                        <div className="font-medium">Total: {result.calculations.grand_total.toFixed(2)} MAD</div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button onClick={downloadPDF} className="flex-1">
                      <Download size={16} className="mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Erreur de génération</span>
                  </div>
                  
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <div className="font-medium mb-1">
                      {result.error_type || 'Erreur inconnue'}
                    </div>
                    <div>{result.error}</div>
                  </div>

                  {result.troubleshooting && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Causes possibles:
                      </h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {result.troubleshooting.possible_causes.map((cause: string, i: number) => (
                          <li key={i}>• {cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
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
    </div>
  );
}