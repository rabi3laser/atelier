import React, { useState } from 'react';
import { FileText, Upload, Sparkles, ArrowRight, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Card from './Card';

interface DevisOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'template' | 'custom') => void;
}

export default function DevisOptionsModal({ isOpen, onClose, onSelectOption }: DevisOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'template' | 'custom' | null>(null);

  const handleContinue = () => {
    if (selectedOption) {
      onSelectOption(selectedOption);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouveau devis"
      size="xl"
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Choisissez comment vous souhaitez créer votre devis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: Template existant */}
          <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedOption === 'template' 
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}>
            <div 
              className="p-6 text-center space-y-4"
              onClick={() => setSelectedOption('template')}
            >
              <div className="flex justify-center">
                <div className={`p-4 rounded-full ${
                  selectedOption === 'template' 
                    ? 'bg-blue-100 dark:bg-blue-800' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <FileText className={`w-8 h-8 ${
                    selectedOption === 'template' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Option 1: Template Prédéfini
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choisissez parmi nos templates de devis professionnels, 
                  entrez vos informations et téléchargez votre PDF.
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Rapide et simple</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Templates professionnels</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Prêt à l'emploi</span>
                </div>
              </div>

              {selectedOption === 'template' && (
                <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Sélectionné</span>
                </div>
              )}
            </div>
          </Card>

          {/* Option 2: Template personnalisé */}
          <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedOption === 'custom' 
              ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}>
            <div 
              className="p-6 text-center space-y-4"
              onClick={() => setSelectedOption('custom')}
            >
              <div className="flex justify-center">
                <div className={`p-4 rounded-full ${
                  selectedOption === 'custom' 
                    ? 'bg-purple-100 dark:bg-purple-800' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Sparkles className={`w-8 h-8 ${
                    selectedOption === 'custom' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Option 2: Template Personnalisé
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploadez un exemple de votre devis existant. Notre IA 
                  détectera votre logo et vos informations pour créer un template unique.
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Détection automatique du logo</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Extraction des informations</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Template 100% personnalisé</span>
                </div>
              </div>

              {selectedOption === 'custom' && (
                <div className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Sélectionné</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Description détaillée de l'option sélectionnée */}
        {selectedOption && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {selectedOption === 'template' ? 'Processus Template Prédéfini :' : 'Processus Template Personnalisé :'}
            </h4>
            
            {selectedOption === 'template' ? (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Sélection d'un template parmi notre collection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Saisie des informations client et articles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Génération automatique du PDF personnalisé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Téléchargement et envoi du devis</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Upload de votre devis exemple (PDF ou image)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Détection automatique du logo et des informations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Création d'un template personnalisé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Configuration des zones de placement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Template prêt pour vos futurs devis</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedOption}
            className="px-6"
          >
            <ArrowRight size={16} className="mr-2" />
            Continuer
          </Button>
        </div>
      </div>
    </Modal>
  );
}