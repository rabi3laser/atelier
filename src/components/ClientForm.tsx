import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Client } from '../types/client';
import FormRow from './FormRow';
import Button from './Button';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  // Fonction pour générer un code automatique
  const generateCode = (nom: string) => {
    if (!nom) return '';
    const words = nom.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase() + 
           Math.floor(Math.random() * 100).toString().padStart(2, '0');
  };

  const [formData, setFormData] = useState({
    code: client?.code || '',
    nom: client?.nom || '',
    adresse: client?.adresse || '',
    code_postal: client?.code_postal || '',
    ville: client?.ville || '',
    telephone: client?.telephone || '',
    email: client?.email || '',
    siret: client?.siret || '',
    ice: client?.ice || '',
    rc: client?.rc || '',
    if: client?.if || '',
    conditions_paiement: client?.conditions_paiement || 30,
    notes: client?.notes || '',
    actif: client?.actif ?? true,
  });

  const [isCodeGenerated, setIsCodeGenerated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Générer un code automatiquement si vide
    let finalCode = formData.code;
    if (!finalCode && formData.nom) {
      finalCode = generateCode(formData.nom);
    }
    
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-générer le code quand le nom change et que le code est vide
    if (field === 'nom' && !formData.code) {
      const newCode = generateCode(value);
      setFormData(prev => ({ ...prev, code: newCode }));
      setIsCodeGenerated(true);
    }
    
    // Marquer le code comme modifié manuellement
    if (field === 'code') {
      setIsCodeGenerated(false);
    }
  };

  const handleGenerateNewCode = () => {
    if (formData.nom) {
      const newCode = generateCode(formData.nom);
      setFormData(prev => ({ ...prev, code: newCode }));
      setIsCodeGenerated(true);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Code">
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Auto-généré si vide"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {formData.nom && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateNewCode}
                title="Générer un nouveau code"
                className="px-3"
              >
                <RefreshCw size={16} />
              </Button>
            )}
          </div>
          {isCodeGenerated && (
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              Code généré automatiquement. Vous pouvez le modifier si nécessaire.
            </p>
          )}
        </FormRow>

        <FormRow label="Nom">
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <FormRow label="Adresse">
        <textarea
          value={formData.adresse}
          onChange={(e) => handleChange('adresse', e.target.value)}
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Code postal">
          <input
            type="text"
            value={formData.code_postal}
            onChange={(e) => handleChange('code_postal', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Ville">
          <input
            type="text"
            value={formData.ville}
            onChange={(e) => handleChange('ville', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Téléphone">
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => handleChange('telephone', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Email">
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormRow label="SIRET">
          <input
            type="text"
            value={formData.siret}
            onChange={(e) => handleChange('siret', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="ICE">
          <input
            type="text"
            value={formData.ice}
            onChange={(e) => handleChange('ice', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="RC">
          <input
            type="text"
            value={formData.rc}
            onChange={(e) => handleChange('rc', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="IF">
          <input
            type="text"
            value={formData.if}
            onChange={(e) => handleChange('if', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Conditions de paiement (jours)">
          <input
            type="number"
            value={formData.conditions_paiement}
            onChange={(e) => handleChange('conditions_paiement', parseInt(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <FormRow label="Notes">
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </FormRow>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="actif"
          checked={formData.actif}
          onChange={(e) => handleChange('actif', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="actif" className="ml-2 block text-sm text-gray-900 dark:text-white">
          Client actif
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : client ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}