import React, { useState } from 'react';
import { BonTravailWithDetails } from '../types/production';
import Modal from './Modal';
import FormRow from './FormRow';
import NumberInput from './NumberInput';
import Button from './Button';
import { num3 } from '../lib/format';

interface CompleteBonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bon: BonTravailWithDetails;
  onComplete: (quantiteProduite: number, quantiteChutes: number) => Promise<void>;
  isLoading?: boolean;
}

export default function CompleteBonModal({ 
  isOpen, 
  onClose, 
  bon, 
  onComplete, 
  isLoading = false 
}: CompleteBonModalProps) {
  const [formData, setFormData] = useState({
    quantite_produite: bon.quantite_prevue || 0,
    quantite_chutes: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete(formData.quantite_produite, formData.quantite_chutes);
  };

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Terminer le bon de travail ${bon.numero}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations du bon */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Client:</span>
              <div className="text-blue-700 dark:text-blue-300">{bon.client_nom}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Commande:</span>
              <div className="text-blue-700 dark:text-blue-300">{bon.commande_numero}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Matière:</span>
              <div className="text-blue-700 dark:text-blue-300">
                {bon.matiere_code} - {bon.matiere_designation}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">Quantité prévue:</span>
              <div className="text-blue-700 dark:text-blue-300">
                {num3(bon.quantite_prevue || 0)} m²
              </div>
            </div>
          </div>
        </div>

        {/* Saisie des quantités */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow label="Quantité produite (m²)" required>
            <NumberInput
              value={formData.quantite_produite}
              onChange={(e) => handleChange('quantite_produite', parseFloat(e.target.value) || 0)}
              decimals={4}
              min="0"
              required
            />
          </FormRow>

          <FormRow label="Quantité de chutes récupérées (m²)">
            <NumberInput
              value={formData.quantite_chutes}
              onChange={(e) => handleChange('quantite_chutes', parseFloat(e.target.value) || 0)}
              decimals={4}
              min="0"
            />
          </FormRow>
        </div>

        {/* Résumé des mouvements */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Mouvements de stock qui seront créés :
          </h4>
          <div className="space-y-1 text-sm">
            {formData.quantite_produite > 0 && (
              <div className="flex justify-between">
                <span className="text-red-600 dark:text-red-400">
                  Sortie (consommation):
                </span>
                <span className="font-medium">
                  -{num3(formData.quantite_produite)} m²
                </span>
              </div>
            )}
            {formData.quantite_chutes > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">
                  Entrée (chutes):
                </span>
                <span className="font-medium">
                  +{num3(formData.quantite_chutes)} m²
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-2">
              <div className="flex justify-between font-medium">
                <span>Impact net sur le stock:</span>
                <span className={formData.quantite_chutes - formData.quantite_produite >= 0 ? 
                  'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {formData.quantite_chutes - formData.quantite_produite >= 0 ? '+' : ''}
                  {num3(formData.quantite_chutes - formData.quantite_produite)} m²
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Finalisation...' : 'Terminer le bon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}