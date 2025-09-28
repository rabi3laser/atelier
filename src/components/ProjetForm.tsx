import React, { useState, useEffect } from 'react';
import { Projet } from '../types/analytics';
import { getClients } from '../lib/analytics';
import FormRow from './FormRow';
import Button from './Button';
import NumberInput from './NumberInput';

interface ProjetFormProps {
  projet?: Projet;
  onSubmit: (projet: Omit<Projet, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjetForm({ projet, onSubmit, onCancel, isLoading = false }: ProjetFormProps) {
  const [formData, setFormData] = useState({
    code: projet?.code || '',
    nom: projet?.nom || '',
    client_id: projet?.client_id || '',
    date_debut: projet?.date_debut || new Date().toISOString().split('T')[0],
    date_fin_prevue: projet?.date_fin_prevue || '',
    statut: projet?.statut || 'planifie' as const,
    budget_prevu: projet?.budget_prevu || 0,
    cout_reel: projet?.cout_reel || 0,
    marge_prevue_pct: projet?.marge_prevue_pct || 0,
    description: projet?.description || '',
    notes: projet?.notes || '',
  });

  const [clients, setClients] = useState<Array<{ id: string; nom: string }>>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Code" required>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </FormRow>

        <FormRow label="Nom" required>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </FormRow>
      </div>

      <FormRow label="Client" required>
        <select
          value={formData.client_id}
          onChange={(e) => handleChange('client_id', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="">Sélectionner un client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nom}
            </option>
          ))}
        </select>
      </FormRow>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormRow label="Date début">
          <input
            type="date"
            value={formData.date_debut}
            onChange={(e) => handleChange('date_debut', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Date fin prévue">
          <input
            type="date"
            value={formData.date_fin_prevue}
            onChange={(e) => handleChange('date_fin_prevue', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Statut">
          <select
            value={formData.statut}
            onChange={(e) => handleChange('statut', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormRow label="Budget prévu">
          <NumberInput
            value={formData.budget_prevu}
            onChange={(e) => handleChange('budget_prevu', parseFloat(e.target.value) || 0)}
            decimals={2}
            min="0"
          />
        </FormRow>

        <FormRow label="Coût réel">
          <NumberInput
            value={formData.cout_reel}
            onChange={(e) => handleChange('cout_reel', parseFloat(e.target.value) || 0)}
            decimals={2}
            min="0"
          />
        </FormRow>

        <FormRow label="Marge prévue (%)">
          <NumberInput
            value={formData.marge_prevue_pct}
            onChange={(e) => handleChange('marge_prevue_pct', parseFloat(e.target.value) || 0)}
            decimals={2}
            min="0"
            max="100"
          />
        </FormRow>
      </div>

      <FormRow label="Description">
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
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
          {isLoading ? 'Enregistrement...' : projet ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}