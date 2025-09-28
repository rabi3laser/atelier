import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Package } from 'lucide-react';
import { Emplacement } from '../types/analytics';
import { getEmplacements, createEmplacement, updateEmplacement } from '../lib/analytics';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import FormRow from '../components/FormRow';
import NumberInput from '../components/NumberInput';

export default function Locations() {
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [filteredEmplacements, setFilteredEmplacements] = useState<Emplacement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmplacement, setEditingEmplacement] = useState<Emplacement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type_emplacement: 'stock' as const,
    capacite_max: 0,
    unite_capacite: 'm²',
    notes: '',
    actif: true,
  });

  useEffect(() => {
    loadEmplacements();
  }, []);

  useEffect(() => {
    const filtered = emplacements.filter(emp =>
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmplacements(filtered);
  }, [emplacements, searchTerm]);

  const loadEmplacements = async () => {
    try {
      setIsLoading(true);
      const data = await getEmplacements();
      setEmplacements(data);
    } catch (error) {
      console.error('Erreur lors du chargement des emplacements:', error);
      // Afficher un message d'erreur à l'utilisateur si nécessaire
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingEmplacement) {
        await updateEmplacement(editingEmplacement.id, formData);
      } else {
        await createEmplacement(formData);
      }
      setShowModal(false);
      setEditingEmplacement(null);
      resetForm();
      loadEmplacements();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      nom: '',
      type_emplacement: 'stock',
      capacite_max: 0,
      unite_capacite: 'm²',
      notes: '',
      actif: true,
    });
  };

  const openModal = (emplacement?: Emplacement) => {
    if (emplacement) {
      setEditingEmplacement(emplacement);
      setFormData({
        code: emplacement.code,
        nom: emplacement.nom,
        type_emplacement: emplacement.type_emplacement,
        capacite_max: emplacement.capacite_max,
        unite_capacite: emplacement.unite_capacite,
        notes: emplacement.notes || '',
        actif: emplacement.actif,
      });
    } else {
      setEditingEmplacement(null);
      resetForm();
    }
    setShowModal(true);
  };

  const getTypeBadge = (type: string) => {
    const config = {
      stock: { variant: 'info' as const, label: 'Stock', icon: Package },
      production: { variant: 'warning' as const, label: 'Production', icon: Package },
      expedition: { variant: 'success' as const, label: 'Expédition', icon: Package },
      quarantaine: { variant: 'danger' as const, label: 'Quarantaine', icon: Package },
    };
    
    const typeConfig = config[type as keyof typeof config];
    return typeConfig ? (
      <div className="flex items-center space-x-1">
        <typeConfig.icon size={14} />
        <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
      </div>
    ) : (
      <Badge>{type}</Badge>
    );
  };

  const columns = [
    {
      key: 'nom',
      label: 'Emplacement',
      render: (value: string, row: Emplacement) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'type_emplacement',
      label: 'Type',
      render: (value: string) => getTypeBadge(value),
    },
    {
      key: 'capacite_max',
      label: 'Capacité',
      render: (value: number, row: Emplacement) => (
        <div className="text-right">
          <span className="font-medium">{value}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{row.unite_capacite}</span>
        </div>
      ),
    },
    {
      key: 'actif',
      label: 'Statut',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Emplacement) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openModal(row)}
          title="Modifier"
        >
          <MapPin size={16} />
        </Button>
      ),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Emplacements</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des zones de stockage et de production</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={20} className="mr-2" />
          Nouvel emplacement
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un emplacement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredEmplacements} />

        {filteredEmplacements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun emplacement trouvé pour cette recherche' : 'Aucun emplacement enregistré'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmplacement ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow label="Code" required>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </FormRow>

            <FormRow label="Nom" required>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormRow label="Type">
              <select
                value={formData.type_emplacement}
                onChange={(e) => setFormData(prev => ({ ...prev, type_emplacement: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="stock">Stock</option>
                <option value="production">Production</option>
                <option value="expedition">Expédition</option>
                <option value="quarantaine">Quarantaine</option>
              </select>
            </FormRow>

            <FormRow label="Capacité max">
              <NumberInput
                value={formData.capacite_max}
                onChange={(e) => setFormData(prev => ({ ...prev, capacite_max: parseFloat(e.target.value) || 0 }))}
                decimals={2}
                min="0"
              />
            </FormRow>

            <FormRow label="Unité">
              <select
                value={formData.unite_capacite}
                onChange={(e) => setFormData(prev => ({ ...prev, unite_capacite: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="m²">m²</option>
                <option value="m³">m³</option>
                <option value="pièces">pièces</option>
                <option value="kg">kg</option>
              </select>
            </FormRow>
          </div>

          <FormRow label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </FormRow>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="actif"
              checked={formData.actif}
              onChange={(e) => setFormData(prev => ({ ...prev, actif: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="actif" className="ml-2 block text-sm text-gray-900 dark:text-white">
              Emplacement actif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : editingEmplacement ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}