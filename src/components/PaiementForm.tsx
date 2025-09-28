import React, { useState } from 'react';
import { Paiement } from '../types/commercial';
import FormRow from './FormRow';
import Button from './Button';
import NumberInput from './NumberInput';

interface PaiementFormProps {
  factureId: string;
  factureNumero: string;
  resteDu: number;
  onSubmit: (paiement: Omit<Paiement, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PaiementForm({ 
  factureId, 
  factureNumero, 
  resteDu, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PaiementFormProps) {
  const [formData, setFormData] = useState({
    date_paiement: new Date().toISOString().split('T')[0],
    montant: resteDu,
    mode_paiement: 'virement' as const,
    reference: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      facture_id: factureId,
      ...formData,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Facture:</strong> {factureNumero}
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Reste dû:</strong> {resteDu.toFixed(2)} MAD
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Date de paiement" required>
          <input
            type="date"
            value={formData.date_paiement}
            onChange={(e) => handleChange('date_paiement', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </FormRow>

        <FormRow label="Montant" required>
          <NumberInput
            value={formData.montant}
            onChange={(e) => handleChange('montant', parseFloat(e.target.value) || 0)}
            decimals={2}
            min="0"
            max={resteDu}
            required
          />
        </FormRow>
      </div>

      <FormRow label="Mode de paiement" required>
        <select
          value={formData.mode_paiement}
          onChange={(e) => handleChange('mode_paiement', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="especes">Espèces</option>
          <option value="carte">Carte bancaire</option>
          <option value="prelevement">Prélèvement</option>
        </select>
      </FormRow>

      <FormRow label="Référence">
        <input
          type="text"
          value={formData.reference}
          onChange={(e) => handleChange('reference', e.target.value)}
          placeholder="Numéro de chèque, référence virement..."
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <FormRow label="Notes">
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer le paiement'}
        </Button>
      </div>
    </form>
  );
}