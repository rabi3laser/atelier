import React, { useState } from 'react';
import { FileText, Sparkles, Download, ArrowRight } from 'lucide-react';
import DevisOptionsModal from './DevisOptionsModal';
import TemplateSelector from './TemplateSelector';
import CustomTemplateCreator from './CustomTemplateCreator';
import DevisCreationFlow from './DevisCreationFlow';
import Button from './Button';
import Card from './Card';

export default function QuickDevisGenerator() {
  const [currentFlow, setCurrentFlow] = useState<'options' | 'template' | 'custom' | 'create' | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const handleStart = () => {
    setShowOptionsModal(true);
  };

  const handleOptionSelect = (option: 'template' | 'custom') => {
    setCurrentFlow(option);
    setShowOptionsModal(false);
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCurrentFlow('create');
  };

  const handleCustomTemplateCreated = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCurrentFlow('create');
  };

  const handleComplete = () => {
    setCurrentFlow(null);
    setSelectedTemplateId('');
  };

  const handleBack = () => {
    if (currentFlow === 'create') {
      setCurrentFlow('template');
    } else if (currentFlow === 'template' || currentFlow === 'custom') {
      setCurrentFlow('options');
      setShowOptionsModal(true);
    } else {
      setCurrentFlow(null);
    }
  };

  if (!currentFlow) {
    return (
      <Card className="text-center py-12">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Générateur de Devis Intelligent
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Créez des devis professionnels en quelques clics avec nos templates 
              ou créez votre propre template personnalisé.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Templates prêts</p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">IA intégrée</p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Download className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">PDF instantané</p>
            </div>
          </div>

          <Button onClick={handleStart} size="lg" className="px-8">
            <ArrowRight size={20} className="mr-2" />
            Commencer
          </Button>
        </div>

        <DevisOptionsModal
          isOpen={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          onSelectOption={handleOptionSelect}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {currentFlow === 'template' && (
        <TemplateSelector
          onTemplateSelected={handleTemplateSelected}
          onBack={handleBack}
        />
      )}

      {currentFlow === 'custom' && (
        <CustomTemplateCreator
          onTemplateCreated={handleCustomTemplateCreated}
          onBack={handleBack}
        />
      )}

      {currentFlow === 'create' && selectedTemplateId && (
        <DevisCreationFlow
          templateId={selectedTemplateId}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
    </div>
  );
}