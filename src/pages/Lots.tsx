import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { LotMatiereWithDetails } from '../types/analytics';
import { getLotsMatiere, createLotMatiere, getMatieres, getFournisseurs } from '../lib/analytics';
import { num3 } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import FormRow from '../components/FormRow';
import NumberInput from '../components/NumberInput';
import ScanInput from '../components/ScanInput';

export default function Lots() {
  const [lots, setLots] = useState<LotMatiereWithDetails[]>([]);
  const [filteredLots, setFilteredLots] = useState<LotMatiereWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [matieres, setMatieres] = useState<Array<{ id: string; code: string; designation: string }>>([]);
  const [fournisseurs, setFournisseurs] = useState<Array<{ id: string; nom: string }>>([]);

  const [formData, setFormData] = useState({
    numero_lot: '',
    matiere_id: '',
    fournisseur_id: '',
    date_reception: new Date().toISOString().split('T')[0],
    quantite_initiale: 0,
    prix_unitaire_lot: 0,
    date_peremption: '',
    statut: 'disponible' as const,
    certificat_qualite: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = lots.filter(lot =>
      lot.numero_lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.matiere_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.matiere_designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLots(filtered);
  }, [lots, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [matieresData, fournisseursData] = await Promise.all([
        getMatieres(),
        getFournisseurs(),
      ]);
      // Temporairement, utiliser un tableau vide pour les lots
      setLots([]);
      setMatieres(matieresData);
      setFournisseurs(fournisseursData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Afficher un message d'erreur temporaire
      alert('La fonctionnalité des lots de matières n\'est pas encore disponible. Veuillez créer la table lots_matieres dans Supabase.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la création du lot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_lot: '',
      matiere_id: '',
      fournisseur_id: '',
      date_reception: new Date().toISOString().split('T')[0],
      quantite_initiale: 0,
      prix_unitaire_lot: 0,
      date_peremption: '',
      statut: 'disponible',
      certificat_qualite: '',
      notes: '',
    });
  };

  const handleScan = (code: string) => {
    setFormData(prev => ({ ...prev, numero_lot: code }));
  };

  const getStatusBadge = (statut: string, datePeremption?: string) => {
    // Vérifier si le lot est périmé
    if (datePeremption && new Date(datePeremption) < new Date()) {
      return <Badge variant="danger">Périmé</Badge>;
    }

    const config = {
      disponible: { variant: 'success' as const, label: 'Disponible' },
      quarantaine: { variant: 'warning' as const, label: 'Quarantaine' },
      epuise: { variant: 'default' as const, label: 'Épuisé' },
      perime: { variant: 'danger' as const, label: 'Périmé' },
    };
    
    const statusConfig = config[statut as keyof typeof config];
    return statusConfig ? (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    ) : (
      <Badge>{statut}</Badge>
    );
  };

  const getPeremptionWarning = (datePeremption?: string) => {
    if (!datePeremption) return null;
    
    const today = new Date();
    const peremption = new Date(datePeremption);
    const diffDays = Math.ceil((peremption.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return <AlertTriangle className="w-4 h-4 text-red-500" title="Lot périmé" />;
    } else if (diffDays <= 30) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" title={`Expire dans ${diffDays} jours`} />;
    }
    
    return null;
  };

  const columns = [
    {
      key: 'numero_lot',
      label: 'N° Lot',
      render: (value: string, row: LotMatiereWithDetails) => (
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(row.date_reception).toLocaleDateString('fr-FR')}
            </div>
          </div>
          {getPeremptionWarning(row.date_peremption)}
        </div>
      ),
    },
    {
      key: 'matiere_designation',
      label: 'Matière',
      render: (value: string, row: LotMatiereWithDetails) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.matiere_code}</div>
        </div>
      ),
    },
    {
      key: 'fournisseur_nom',
      label: 'Fournisseur',
      render: (value: string) => value || '-',
    },
    {
      key: 'quantite_restante',
      label: 'Stock',
      render: (value: number, row: LotMatiereWithDetails) => (
        <div className="text-right">
          <div className="font-medium text-gray-900 dark:text-white">
            {num3(value)} m²
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            / {num3(row.quantite_initiale)} m²
          </div>
        </div>
      ),
    },
    {
      key: 'prix_unitaire_lot',
      label: 'Prix unitaire',
      render: (value: number) => (
        <div className="text-right font-medium">
          {value.toFixed(4)} MAD/m²
        </div>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string, row: LotMatiereWithDetails) => 
        getStatusBadge(value, row.date_peremption),
    },
    {
      key: 'date_peremption',
      label: 'Péremption',
      render: (value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lots de matières</h1>
          <p className="text-gray-600 dark:text-gray-400">Traçabilité par lot des matières premières</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouveau lot
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <ScanInput
            placeholder="Scanner code lot ou rechercher..."
            onScan={(code) => setSearchTerm(code)}
          />
        </div>

        <Table columns={columns} data={filteredLots} />

        {filteredLots.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun lot trouvé pour cette recherche' : 'Aucun lot enregistré'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau lot de matière"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRow label="Numéro de lot" required>
            <ScanInput
              placeholder="Scanner ou saisir le numéro de lot..."
              onScan={handleScan}
            />
          </FormRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow label="Matière" required>
              <select
                value={formData.matiere_id}
                onChange={(e) => setFormData(prev => ({ ...prev, matiere_id: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Sélectionner une matière</option>
                {matieres.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.code} - {matiere.designation}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="Fournisseur">
              <select
                value={formData.fournisseur_id}
                onChange={(e) => setFormData(prev => ({ ...prev, fournisseur_id: e.target.value }))}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormRow label="Date réception">
              <input
                type="date"
                value={formData.date_reception}
                onChange={(e) => setFormData(prev => ({ ...prev, date_reception: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormRow>

            <FormRow label="Quantité initiale (m²)" required>
              <NumberInput
                value={formData.quantite_initiale}
                onChange={(e) => setFormData(prev => ({ ...prev, quantite_initiale: parseFloat(e.target.value) || 0 }))}
                decimals={4}
                min="0"
                required
              />
            </FormRow>

            <FormRow label="Prix unitaire (MAD/m²)">
              <NumberInput
                value={formData.prix_unitaire_lot}
                onChange={(e) => setFormData(prev => ({ ...prev, prix_unitaire_lot: parseFloat(e.target.value) || 0 }))}
                decimals={4}
                min="0"
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow label="Date péremption">
              <input
                type="date"
                value={formData.date_peremption}
                onChange={(e) => setFormData(prev => ({ ...prev, date_peremption: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormRow>

            <FormRow label="Statut">
              <select
                value={formData.statut}
                onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="disponible">Disponible</option>
                <option value="quarantaine">Quarantaine</option>
                <option value="epuise">Épuisé</option>
                <option value="perime">Périmé</option>
              </select>
            </FormRow>
          </div>

          <FormRow label="Certificat qualité">
            <input
              type="text"
              value={formData.certificat_qualite}
              onChange={(e) => setFormData(prev => ({ ...prev, certificat_qualite: e.target.value }))}
              placeholder="Référence du certificat..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </FormRow>

          <FormRow label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </FormRow>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Créer le lot'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}