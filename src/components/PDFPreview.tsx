import React, { useState, useRef, useEffect } from 'react';
import { Download, Eye, Settings, Move, RotateCcw } from 'lucide-react';
import { PDFGenerator, DevisData, TemplateConfig } from '../lib/pdfGenerator';
import Button from './Button';
import Modal from './Modal';
import Card from './Card';
import NumberInput from './NumberInput';

interface PDFPreviewProps {
  devisData: DevisData;
  onClose: () => void;
}

export default function PDFPreview({ devisData, onClose }: PDFPreviewProps) {
  const [pdfGenerator] = useState(() => new PDFGenerator());
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [showZoneConfig, setShowZoneConfig] = useState(false);
  const [zones, setZones] = useState(pdfGenerator.getTemplateConfig()?.zones || {
    entreprise: { x: 50, y: 750 },
    numero: { x: 400, y: 100 },
    date: { x: 400, y: 130 },
    client: { x: 50, y: 200 },
    lignes: { x: 50, y: 300, width: 500, height: 200 },
    totaux: { x: 400, y: 600 },
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Charger le template preview
    const savedTemplate = localStorage.getItem('devis_template');
    setTemplatePreview(savedTemplate);
    
    generatePDF();
  }, []);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      console.log('🎯 Génération PDF avec données:', devisData);
      
      // Vérifier si un template existe
      const templateExists = localStorage.getItem('devis_template');
      console.log('🎨 Template dans localStorage:', !!templateExists);
      if (templateExists) {
        console.log('📁 Type de template:', templateExists.substring(0, 50));
      }
      
      const blob = await pdfGenerator.generatePDF(devisData);
      console.log('✅ PDF généré avec succès');
      setPdfBlob(blob);
      
      // Créer URL pour l'aperçu
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur génération PDF: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${devisData.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleZoneChange = (zoneName: string, field: string, value: number) => {
    setZones(prev => ({
      ...prev,
      [zoneName]: {
        ...prev[zoneName as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const saveZoneConfig = () => {
    pdfGenerator.saveTemplateZones(zones);
    setShowZoneConfig(false);
    generatePDF(); // Régénérer avec les nouvelles zones
  };

  const resetZones = () => {
    const defaultZones = {
      entreprise: { x: 50, y: 750 },
      numero: { x: 400, y: 100 },
      date: { x: 400, y: 130 },
      client: { x: 50, y: 200 },
      lignes: { x: 50, y: 300, width: 500, height: 200 },
      totaux: { x: 400, y: 600 },
    };
    setZones(defaultZones);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aperçu PDF - Devis {devisData.numero}
          </h3>
          <div className="flex space-x-3">
            {templatePreview && (
              <Button
                variant="secondary"
                onClick={() => setShowZoneConfig(true)}
                disabled={isGenerating}
              >
                <Settings size={16} className="mr-2" />
                Configurer zones
              </Button>
            )}
            <Button
              onClick={handleDownload}
              disabled={!pdfBlob || isGenerating}
            >
              <Download size={16} className="mr-2" />
              Télécharger
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-6">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Génération du PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="h-full">
              <iframe
                src={pdfUrl}
                className="w-full h-full border border-gray-300 dark:border-gray-600 rounded"
                title="Aperçu PDF"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Erreur lors de la génération du PDF</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal configuration des zones */}
      <Modal
        isOpen={showZoneConfig}
        onClose={() => setShowZoneConfig(false)}
        title="Configuration des zones de placement"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              Ajustez la position des éléments sur votre modèle de devis.
            </p>
            <p>
              Les coordonnées sont en pixels depuis le coin supérieur gauche.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zone Entreprise */}
            <Card title="Informations entreprise">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.entreprise.x}
                    onChange={(e) => handleZoneChange('entreprise', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.entreprise.y}
                    onChange={(e) => handleZoneChange('entreprise', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>

            {/* Zone Numéro */}
            <Card title="Numéro de devis">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.numero.x}
                    onChange={(e) => handleZoneChange('numero', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.numero.y}
                    onChange={(e) => handleZoneChange('numero', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>

            {/* Zone Date */}
            <Card title="Date">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.date.x}
                    onChange={(e) => handleZoneChange('date', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.date.y}
                    onChange={(e) => handleZoneChange('date', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>

            {/* Zone Client */}
            <Card title="Informations client">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.client.x}
                    onChange={(e) => handleZoneChange('client', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.client.y}
                    onChange={(e) => handleZoneChange('client', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>

            {/* Zone Lignes */}
            <Card title="Lignes du devis">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.lignes.x}
                    onChange={(e) => handleZoneChange('lignes', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.lignes.y}
                    onChange={(e) => handleZoneChange('lignes', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>

            {/* Zone Totaux */}
            <Card title="Totaux">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position X
                  </label>
                  <NumberInput
                    value={zones.totaux.x}
                    onChange={(e) => handleZoneChange('totaux', 'x', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position Y
                  </label>
                  <NumberInput
                    value={zones.totaux.y}
                    onChange={(e) => handleZoneChange('totaux', 'y', parseInt(e.target.value) || 0)}
                    decimals={0}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={resetZones}
            >
              <RotateCcw size={16} className="mr-2" />
              Réinitialiser
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowZoneConfig(false)}
              >
                Annuler
              </Button>
              <Button onClick={saveZoneConfig}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}