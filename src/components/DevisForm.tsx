import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Devis, DevisLigne } from '../types/commercial';
import { getClients, getMatieres } from '../lib/commercial';
import { templateService, QuoteTemplate } from '../lib/templateService';
import FormRow from './FormRow';
import Button from './Button';
import NumberInput from './NumberInput';
import { fmtMAD } from '../lib/format';

interface DevisFormProps {
  devis?: Devis;
  lignes?: DevisLigne[];
  preselectedTemplateId?: string;
  onSubmit: (devis: Omit<Devis, 'id' | 'created_at' | 'updated_at'>, lignes: Omit<DevisLigne, 'id' | 'devis_id'>[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DevisForm({ devis, lignes = [], preselectedTemplateId, onSubmit, onCancel, isLoading = false }: DevisFormProps) {
  // Fonction pour générer un numéro de devis automatique
  const generateNumero = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}${month}-${random}`;
  };

  const [formData, setFormData] = useState({
    numero: devis?.numero || '',
    client_id: devis?.client_id || '',
    date_devis: devis?.date_devis || new Date().toISOString().split('T')[0],
    date_validite: devis?.date_validite || '',
    statut: devis?.statut || 'brouillon' as const,
    taux_tva: devis?.taux_tva || 20,
    remise_globale_pct: devis?.remise_globale_pct || 0,
    conditions: devis?.conditions || '',
    notes: devis?.notes || '',
  });

  const [formLignes, setFormLignes] = useState<Omit<DevisLigne, 'id' | 'devis_id'>[]>(
    lignes.length > 0 ? lignes.map(l => ({
      ligne_numero: l.ligne_numero,
      matiere_id: l.matiere_id,
      designation: l.designation,
     mode_facturation: l.mode_facturation,
      quantite: l.quantite,
     prix_unitaire_ht: l.prix_unitaire_ht,
     remise_pct: l.remise_pct,
     montant_ht: l.montant_ht,
     tva_pct: l.tva_pct,
     montant_tva: l.montant_tva,
     montant_ttc: l.montant_ttc,
      notes: l.notes,
    })) : [{
      ligne_numero: 1,
      designation: '',
     mode_facturation: 'm2' as const,
      quantite: 1,
     prix_unitaire_ht: 0,
     remise_pct: 0,
     montant_ht: 0,
     tva_pct: 20,
     montant_tva: 0,
     montant_ttc: 0,
      notes: '',
    }]
  );

  const [clients, setClients] = useState<Array<{ id: string; nom: string }>>([]);
  const [matieres, setMatieres] = useState<Array<{ id: string; designation: string; prix_vente_unitaire: number }>>([]);
  const [isNumeroGenerated, setIsNumeroGenerated] = useState(false);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(devis?.template_id || preselectedTemplateId || '');

  useEffect(() => {
    loadData();
    
    // Générer un numéro automatiquement si c'est un nouveau devis
    if (!devis && !formData.numero) {
      const newNumero = generateNumero();
      setFormData(prev => ({ ...prev, numero: newNumero }));
      setIsNumeroGenerated(true);
    }
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, matieresData, templatesData] = await Promise.all([
        getClients(),
        getMatieres(),
        templateService.getTemplates(),
      ]);
      setClients(clientsData);
      setMatieres(matieresData);
      setTemplates(templatesData);
      
      // Si pas de template sélectionné, prendre le template par défaut
      if (!selectedTemplateId && !preselectedTemplateId) {
        const defaultTemplate = templatesData.find(t => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } else if (preselectedTemplateId) {
        setSelectedTemplateId(preselectedTemplateId);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Générer un numéro automatiquement si vide
    let finalData = { ...formData };
    if (!finalData.numero) {
      finalData.numero = generateNumero();
    }
    
    // Convertir les chaînes vides en null pour les champs de date
    if (finalData.date_validite === '') {
      finalData.date_validite = null;
    }
    
    // Calculer les totaux
    const totalHT = formLignes.reduce((sum, ligne) => sum + ligne.montant_ht, 0);
    const totalTVA = formLignes.reduce((sum, ligne) => sum + ligne.montant_tva, 0);
    const totalTTC = formLignes.reduce((sum, ligne) => sum + ligne.montant_ttc, 0);

    // Appliquer la remise globale
    const remiseGlobale = formData.remise_globale_pct / 100;
    const montantHT = totalHT * (1 - remiseGlobale);
    const montantTVA = totalTVA * (1 - remiseGlobale);
    const montantTTC = totalTTC * (1 - remiseGlobale);

    // Nettoyer les lignes pour convertir les chaînes vides en null pour les UUID
    const cleanedLignes = formLignes.map(ligne => ({
      ...ligne,
      matiere_id: ligne.matiere_id || null,
    }));

    await onSubmit({
      ...finalData,
      template_id: selectedTemplateId || null,
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
    }, cleanedLignes);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Marquer le numéro comme modifié manuellement
    if (field === 'numero') {
      setIsNumeroGenerated(false);
    }
  };

  const handleGenerateNewNumero = () => {
    const newNumero = generateNumero();
    setFormData(prev => ({ ...prev, numero: newNumero }));
    setIsNumeroGenerated(true);
  };
  const handleLigneChange = (index: number, field: string, value: any) => {
    setFormLignes(prev => {
      const newLignes = [...prev];
      newLignes[index] = { ...newLignes[index], [field]: value };
      
      // Recalculer les montants si nécessaire
      if (['quantite', 'prix_unitaire_ht', 'remise_pct', 'tva_pct'].includes(field)) {
        const ligne = newLignes[index];
        const montantBrut = ligne.quantite * ligne.prix_unitaire_ht;
       const montantRemise = montantBrut * (ligne.remise_pct / 100);
       const montantHT = montantBrut - montantRemise;
       const montantTVA = montantHT * (ligne.tva_pct / 100);
       const montantTTC = montantHT + montantTVA;
        
        newLignes[index] = {
          ...ligne,
         montant_ht: montantHT,
         montant_tva: montantTVA,
         montant_ttc: montantTTC,
        };
      }
      
      return newLignes;
    });
  };

  const addLigne = () => {
    setFormLignes(prev => [...prev, {
      ligne_numero: prev.length + 1,
      designation: '',
     mode_facturation: 'm2' as const,
      quantite: 1,
     prix_unitaire_ht: 0,
     remise_pct: 0,
     montant_ht: 0,
     tva_pct: 20,
     montant_tva: 0,
     montant_ttc: 0,
      notes: '',
    }]);
  };

  const removeLigne = (index: number) => {
    if (formLignes.length > 1) {
      setFormLignes(prev => prev.filter((_, i) => i !== index).map((ligne, i) => ({
        ...ligne,
        ligne_numero: i + 1,
      })));
    }
  };

  const selectMatiere = (index: number, matiereId: string) => {
    const matiere = matieres.find(m => m.id === matiereId);
    if (matiere) {
      handleLigneChange(index, 'matiere_id', matiereId);
      handleLigneChange(index, 'designation', matiere.designation);
     handleLigneChange(index, 'prix_unitaire_ht', matiere.prix_vente_unitaire);
    }
  };

  // Calculs des totaux
 const totalHT = formLignes.reduce((sum, ligne) => sum + ligne.montant_ht, 0);
  const totalTVA = totalHT * formData.taux_tva / 100;
  const totalTTC = totalHT + totalTVA;
  
  const remiseGlobale = formData.remise_globale_pct / 100;
  const finalHT = totalHT * (1 - remiseGlobale);
  const finalTVA = totalTVA * (1 - remiseGlobale);
  const finalTTC = totalTTC * (1 - remiseGlobale);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* En-tête du devis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Numéro">
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              placeholder="Auto-généré si vide"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateNewNumero}
              title="Générer un nouveau numéro"
              className="px-3"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
          {isNumeroGenerated && (
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              Numéro généré automatiquement. Vous pouvez le modifier si nécessaire.
            </p>
          )}
        </FormRow>

        <FormRow label="Client">
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

        <FormRow label="Date devis">
          <input
            type="date"
            value={formData.date_devis}
            onChange={(e) => handleChange('date_devis', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Date validité">
          <input
            type="date"
            value={formData.date_validite}
            onChange={(e) => handleChange('date_validite', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </FormRow>

        <FormRow label="Statut">
          <select
            value={formData.statut}
            onChange={(e) => handleChange('statut', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="expire">Expiré</option>
          </select>
        </FormRow>

        <FormRow label="Remise globale (%)">
          <NumberInput
            value={formData.remise_globale_pct}
            onChange={(e) => handleChange('remise_globale_pct', parseFloat(e.target.value) || 0)}
            decimals={2}
            min="0"
            max="100"
          />
        </FormRow>

        <FormRow label="Template de devis">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Template par défaut</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.is_default ? '(Par défaut)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Le template détermine l'apparence de votre PDF de devis
          </p>
        </FormRow>
      </div>

      {/* Lignes du devis */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lignes du devis</h3>
          <Button type="button" onClick={addLigne} size="sm">
            <Plus size={16} className="mr-1" />
            Ajouter ligne
          </Button>
        </div>

        <div className="space-y-4">
          {formLignes.map((ligne, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Ligne {index + 1}</h4>
                {formLignes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLigne(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormRow label="Matière">
                  <select
                    value={ligne.matiere_id || ''}
                    onChange={(e) => selectMatiere(index, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Sélectionner une matière</option>
                    {matieres.map((matiere) => (
                      <option key={matiere.id} value={matiere.id}>
                        {matiere.designation}
                      </option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Désignation" required>
                  <input
                    type="text"
                    value={ligne.designation}
                    onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </FormRow>

                <FormRow label="Mode">
                  <select
                    value={ligne.mode_facturation}
                    onChange={(e) => handleLigneChange(index, 'mode_facturation', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="m2">m²</option>
                    <option value="feuille">Feuille</option>
                    <option value="service">Service</option>
                  </select>
                </FormRow>

                <FormRow label="Quantité">
                  <NumberInput
                    value={ligne.quantite}
                    onChange={(e) => handleLigneChange(index, 'quantite', parseFloat(e.target.value) || 0)}
                    decimals={4}
                    min="0"
                  />
                </FormRow>

                <FormRow label="Prix unitaire HT">
                  <NumberInput
                   value={ligne.prix_unitaire_ht}
                   onChange={(e) => handleLigneChange(index, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                    decimals={4}
                    min="0"
                  />
                </FormRow>

               <FormRow label="Remise (%)">
                 <NumberInput
                   value={ligne.remise_pct}
                   onChange={(e) => handleLigneChange(index, 'remise_pct', parseFloat(e.target.value) || 0)}
                   decimals={2}
                   min="0"
                   max="100"
                 />
               </FormRow>

                <FormRow label="Montant ligne">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-right font-medium">
                   {fmtMAD(ligne.montant_ht)}
                  </div>
                </FormRow>
              </div>

              <FormRow label="Notes">
                <textarea
                  value={ligne.notes || ''}
                  onChange={(e) => handleLigneChange(index, 'notes', e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </FormRow>
            </div>
          ))}
        </div>
      </div>

      {/* Totaux */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total HT</div>
            <div className="font-medium">{fmtMAD(totalHT)}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Remise globale</div>
            <div className="font-medium">-{fmtMAD(totalHT * remiseGlobale)}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">TVA</div>
            <div className="font-medium">{fmtMAD(finalTVA)}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total TTC</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{fmtMAD(finalTTC)}</div>
          </div>
        </div>
      </div>

      {/* Conditions et notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label="Conditions">
          <textarea
            value={formData.conditions}
            onChange={(e) => handleChange('conditions', e.target.value)}
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
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : devis ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}