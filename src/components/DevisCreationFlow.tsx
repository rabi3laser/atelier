import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Send } from 'lucide-react';
import { Devis, DevisLigne } from '../types/commercial';
import { createDevis, saveDevisLignes } from '../lib/commercial';
import { N8nQuoteService } from '../lib/n8nQuoteService';
import { PDFGenerator, DevisData } from '../lib/pdfGenerator';
import DevisForm from './DevisForm';
import PDFPreview from './PDFPreview';
import SendQuoteModal from './SendQuoteModal';
import Button from './Button';
import Card from './Card';
import { toast } from 'sonner';

interface DevisCreationFlowProps {
  templateId: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function DevisCreationFlow({ templateId, onComplete, onBack }: DevisCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<'form' | 'preview' | 'send'>('form');
  const [devisData, setDevisData] = useState<DevisData | null>(null);
  const [devisId, setDevisId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const handleDevisSubmit = async (
    devisFormData: Omit<Devis, 'id' | 'created_at' | 'updated_at'>, 
    lignesData: Omit<DevisLigne, 'id' | 'devis_id'>[]
  ) => {
    try {
      // Créer le devis en base
      const newDevis = await createDevis({
        ...devisFormData,
        template_id: templateId,
      });
      
      // Sauvegarder les lignes
      await saveDevisLignes(newDevis.id, lignesData);
      
      setDevisId(newDevis.id);
      
      // Préparer les données pour la génération PDF
      const devisDataForPdf: DevisData = {
        numero: newDevis.numero,
        date_devis: newDevis.date_devis,
        date_validite: newDevis.date_validite,
        client: {
          nom: 'Client', // À récupérer depuis la base
          adresse: '',
          code_postal: '',
          ville: '',
          telephone: '',
          email: '',
          ice: '',
          rc: '',
          if: '',
        },
        lignes: lignesData.map(ligne => ({
          ligne_numero: ligne.ligne_numero,
          designation: ligne.designation,
          mode_facturation: ligne.mode_facturation,
          quantite: ligne.quantite,
          prix_unitaire_ht: ligne.prix_unitaire_ht,
          remise_pct: ligne.remise_pct,
          montant_ht: ligne.montant_ht,
          tva_pct: ligne.tva_pct,
          montant_tva: ligne.montant_tva,
          montant_ttc: ligne.montant_ttc,
          notes: ligne.notes,
          matiere_id: ligne.matiere_id,
        })),
        montant_ht: newDevis.montant_ht,
        montant_tva: newDevis.montant_tva,
        montant_ttc: newDevis.montant_ttc,
        taux_tva: newDevis.taux_tva,
        remise_globale_pct: newDevis.remise_globale_pct,
        conditions: newDevis.conditions,
        notes: newDevis.notes,
      };
      
      setDevisData(devisDataForPdf);
      setCurrentStep('preview');
      
      // Générer automatiquement le PDF
      await generatePDF(devisDataForPdf);
      
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      toast.error('Erreur lors de la création du devis');
    }
  };

  const generatePDF = async (data: DevisData) => {
    try {
      setIsGenerating(true);
      
      // Convertir vers format n8n
      const n8nRequest = N8nQuoteService.convertDevisToN8nFormat(data);
      
      // Appeler le workflow n8n
      const result = await N8nQuoteService.generateQuotePDF(n8nRequest);
      
      if (result.success && result.quote?.pdf_url) {
        setPdfUrl(result.quote.pdf_url);
        toast.success('PDF généré avec succès !');
      } else {
        throw new Error(result.error || 'Erreur génération PDF');
      }
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `devis-${devisData?.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('PDF téléchargé !');
    }
  };

  const handleSendSuccess = () => {
    setShowSendModal(false);
    toast.success('Devis envoyé avec succès !');
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'form' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'form' ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
          <span>1. Informations</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'preview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          currentStep === 'send' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'preview' ? 'bg-blue-500' : 
            currentStep === 'send' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span>2. Aperçu PDF</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'send' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'send' ? 'bg-blue-500' : 'bg-gray-400'
          }`}></div>
          <span>3. Envoi</span>
        </div>
      </div>

      {/* Étape 1: Formulaire */}
      {currentStep === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Nouveau devis
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remplissez les informations de votre devis
              </p>
            </div>
          </div>

          <Card>
            <DevisForm
              preselectedTemplateId={templateId}
              onSubmit={handleDevisSubmit}
              onCancel={onBack}
              isLoading={false}
            />
          </Card>
        </div>
      )}

      {/* Étape 2: Aperçu PDF */}
      {currentStep === 'preview' && devisData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setCurrentStep('form')}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Aperçu de votre devis
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Vérifiez le rendu avant téléchargement ou envoi
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleDownloadPDF}
                disabled={!pdfUrl || isGenerating}
              >
                <Download size={16} className="mr-2" />
                Télécharger PDF
              </Button>
              <Button
                onClick={() => setShowSendModal(true)}
                disabled={!pdfUrl || isGenerating}
              >
                <Send size={16} className="mr-2" />
                Envoyer le devis
              </Button>
            </div>
          </div>

          <Card>
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Génération du PDF...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="h-96">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border border-gray-300 dark:border-gray-600 rounded"
                  title="Aperçu PDF"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">Erreur lors de la génération du PDF</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal envoi */}
      {showSendModal && devisData && (
        <SendQuoteModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          devisId={devisId}
          devisNumero={devisData.numero}
          clientEmail={devisData.client.email}
          clientPhone={devisData.client.telephone}
          onSuccess={handleSendSuccess}
        />
      )}
    </div>
  );
}