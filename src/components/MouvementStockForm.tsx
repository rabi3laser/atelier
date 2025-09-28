import React, { useState } from 'react';
import { MouvementStock } from '../types/material';
import FormRow from './FormRow';
import Button from './Button';
import NumberInput from './NumberInput';

interface MouvementStockFormProps {
  matiereId: string;
  onSubmit: (mouvement: Omit<MouvementStock, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  defaultType?: 'entree' | 'sortie' | 'ajustement';
}

export default function MouvementStockForm({ 
  matiereId, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  defaultType = 'entree'
}: MouvementStockFormProps) {
  const [formData, setFormData] = useState({
    type_mouvement: defaultType,
    quantite: 0,
    prix_unitaire: 0,
    reference_document: '',
    commentaire: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      matiere_id: matiereId,
      ...formData,
      quantite: formData.type_mouvement === 'sortie' ? -Math.abs(formData.quantite) : Math.abs(formData.quantite),
      valeur_mouvement: formData.quantite * formData.prix_unitaire,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormRow label="Type de mouvement" required>
        <select
          value={formData.type_mouvement}
          onChange={(e) => handleChange('type_mouvement', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="ajustement">Ajustement</option>
          <option value="chute">Chute récupérée</option>
        </select>
      </FormRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Quantité" required>
          <NumberInput
            value={Math.abs(formData.quantite)}
            onChange={(e) => handleChange('quantite', parseFloat(e.target.value) || 0)}
            decimals={4}
            min="0"
            step="0.0001"
            required
          />
        </FormRow>

        <FormRow label="Prix unitaire">
          <NumberInput
            value={formData.prix_unitaire}
            onChange={(e) => handleChange('prix_unitaire', parseFloat(e.target.value) || 0)}
            decimals={4}
            min="0"
            step="0.0001"
          />
        </FormRow>
      </div>

      <FormRow label="Référence document">
        <input
          type="text"
          value={formData.reference_document}
          onChange={(e) => handleChange('reference_document', e.target.value)}
          placeholder="Ex: BON-2024-001, FACT-2024-123..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <FormRow label="Commentaire">
        <textarea
          value={formData.commentaire}
          onChange={(e) => handleChange('commentaire', e.target.value)}
          rows={3}
          placeholder="Commentaire optionnel..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Valeur du mouvement:</strong> {(Math.abs(formData.quantite) * formData.prix_unitaire).toFixed(2)} MAD
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer le mouvement'}
        </Button>
      </div>
    </form>
  );
}