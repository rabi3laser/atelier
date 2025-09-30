import React, { useState, useEffect } from 'react';
import { FileText, Star, Eye, Download, ArrowLeft } from 'lucide-react';
import { templateService, QuoteTemplate } from '../lib/templateService';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import Modal from './Modal';

interface TemplateSelectorProps {
  onTemplateSelected: (templateId: string) => void;
  onBack: () => void;
}

export default function TemplateSelector({ onTemplateSelected, onBack }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
      
      // Sélectionner le template par défaut automatiquement
      const defaultTemplate = data.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (template: QuoteTemplate) => {
    setPreviewTemplate(template);
  };

  const handleContinue = () => {
    if (selectedTemplateId) {
      onTemplateSelected(selectedTemplateId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement des templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choisissez votre template de devis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sélectionnez un modèle professionnel pour votre devis
          </p>
        </div>
      </div>

      {/* Templates disponibles */}
      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Aucun template disponible
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Créez votre premier template personnalisé
            </p>
            <Button onClick={() => onTemplateSelected('custom')}>
              Créer un template personnalisé
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTemplateId === template.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div 
                className="p-4 space-y-4"
                onClick={() => setSelectedTemplateId(template.id)}
              >
                {/* Aperçu du template */}
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {template.background_url ? (
                    <img 
                      src={template.background_url} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Template HTML
                      </span>
                    </div>
                  )}
                  
                  {/* Badge par défaut */}
                  {template.is_default && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="warning">
                        <Star size={12} className="mr-1" />
                        Par défaut
                      </Badge>
                    </div>
                  )}
                  
                  {/* Badge sélectionné */}
                  {selectedTemplateId === template.id && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Sélectionné
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations du template */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Version {template.version}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template);
                    }}
                    className="flex-1"
                  >
                    <Eye size={14} className="mr-1" />
                    Aperçu
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Actions principales */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedTemplateId ? (
            <span>Template sélectionné : {templates.find(t => t.id === selectedTemplateId)?.name}</span>
          ) : (
            <span>Sélectionnez un template pour continuer</span>
          )}
        </div>
        
        <Button 
          onClick={handleContinue}
          disabled={!selectedTemplateId}
          className="px-6"
        >
          <ArrowRight size={16} className="mr-2" />
          Créer le devis
        </Button>
      </div>

      {/* Modal aperçu template */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Aperçu - ${previewTemplate.name}`}
          size="xl"
        >
          <div className="space-y-4">
            {previewTemplate.background_url ? (
              <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded">
                <img 
                  src={previewTemplate.background_url} 
                  alt={previewTemplate.name}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Template HTML - Aperçu non disponible
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
                Fermer
              </Button>
              <Button onClick={() => {
                setSelectedTemplateId(previewTemplate.id);
                setPreviewTemplate(null);
              }}>
                Utiliser ce template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}