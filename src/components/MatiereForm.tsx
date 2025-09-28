import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Matiere } from '../types/material';
import { getFournisseurs } from '../lib/materials';
import FormRow from './FormRow';
import Button from './Button';
import NumberInput from './NumberInput';

interface MatiereFormProps {
  matiere?: Matiere;
  onSubmit: (matiere: Omit<Matiere, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function MatiereForm({ matiere, onSubmit, onCancel, isLoading = false }: MatiereFormProps) {
  // Fonction pour générer un code automatique
  const generateCode = (designation: string) => {
    if (!designation) return '';
    const words = designation.trim().split(' ');
    const prefix = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${suffix}`;
  };

  const [formData, setFormData] = useState({
    code: matiere?.code || '',
    designation: matiere?.designation || '',
    unite: matiere?.unite || 'm²',
    prix_achat_unitaire: matiere?.prix_achat_unitaire || 0,
    prix_vente_unitaire: matiere?.prix_vente_unitaire || 0,
    epaisseur: matiere?.epaisseur || 0,
    largeur: matiere?.largeur || 0,
    longueur: matiere?.longueur || 0,
    couleur: matiere?.couleur || '',
    fournisseur_id: matiere?.fournisseur_id || '',
    notes: matiere?.notes || '',
    actif: matiere?.actif ?? true,
  });

  const [fournisseurs, setFournisseurs] = useState<Array<{ id: string; nom: string }>>([]);
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      const data = await getFournisseurs();
      setFournisseurs(data);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Générer un code automatiquement si vide
    let finalData = { ...formData };
    if (!finalData.code && finalData.designation) {
      finalData.code = generateCode(finalData.designation);
    }
    
    await onSubmit({
      ...finalData,
      fournisseur_id: formData.fournisseur_id || null,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-générer le code quand la désignation change et que le code est vide
    if (field === 'designation' && !formData.code) {
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
    if (formData.designation) {
      const newCode = generateCode(formData.designation);
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
            {formData.designation && (
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

        <FormRow label="Désignation">
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => handleChange('designation', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormRow label="Unité">
          <select
            value={formData.unite}
            onChange={(e) => handleChange('unite', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="m²">m²</option>
            <option value="ml">ml</option>
            <option value="pièce">pièce</option>
            <option value="kg">kg</option>
          </select>
        </FormRow>

        <FormRow label="Prix d'achat unitaire">
          <NumberInput
            value={formData.prix_achat_unitaire}
            onChange={(e) => handleChange('prix_achat_unitaire', parseFloat(e.target.value) || 0)}
            decimals={4}
          />
        </FormRow>

        <FormRow label="Prix de vente unitaire">
          <NumberInput
            value={formData.prix_vente_unitaire}
            onChange={(e) => handleChange('prix_vente_unitaire', parseFloat(e.target.value) || 0)}
            decimals={4}
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormRow label="Épaisseur (mm)">
          <NumberInput
            value={formData.epaisseur}
            onChange={(e) => handleChange('epaisseur', parseFloat(e.target.value) || 0)}
            decimals={2}
          />
        </FormRow>

        <FormRow label="Largeur (mm)">
          <NumberInput
            value={formData.largeur}
            onChange={(e) => handleChange('largeur', parseFloat(e.target.value) || 0)}
            decimals={2}
          />
        </FormRow>

        <FormRow label="Longueur (mm)">
          <NumberInput
            value={formData.longueur}
            onChange={(e) => handleChange('longueur', parseFloat(e.target.value) || 0)}
            decimals={2}
          />
        </FormRow>

        <FormRow label="Couleur">
          <input
            type="text"
            value={formData.couleur}
            onChange={(e) => handleChange('couleur', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>
      </div>

      <FormRow label="Fournisseur">
        <select
          value={formData.fournisseur_id}
          onChange={(e) => handleChange('fournisseur_id', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Aucun fournisseur</option>
          {fournisseurs.map((fournisseur) => (
            <option key={fournisseur.id} value={fournisseur.id}>
              {fournisseur.nom}
            </option>
          ))}
        </select>
      </FormRow>

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
          Matière active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : matiere ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}