import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Scissors } from 'lucide-react';
import { ChuteValorisableWithDetails } from '../types/analytics';
import { getChutesValorisables, createChuteValorisable, updateChuteValorisable, getMatieres, getEmplacements } from '../lib/analytics';
import { num3, fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import FormRow from '../components/FormRow';
import NumberInput from '../components/NumberInput';

export default function Scraps() {
  const [chutes, setChutes] = useState<ChuteValorisableWithDetails[]>([]);
  const [filteredChutes, setFilteredChutes] = useState<ChuteValorisableWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [matieres, setMatieres] = useState<Array<{ id: string; code: string; designation: string }>>([]);
  const [emplacements, setEmplacements] = useState<Array<{ id: string; code: string; nom: string }>>([]);

  const [formData, setFormData] = useState({
    matiere_id: '',
    dimensions_l: 0,
    dimensions_w: 0,
    emplacement_id: '',
    statut: 'disponible' as const,
    prix_estime: 0,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = chutes.filter(chute =>
      chute.matiere_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chute.matiere_designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chute.emplacement_nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChutes(filtered);
  }, [chutes, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [chutesData, matieresData, emplacementsData] = await Promise.all([
        getChutesValorisables(),
        getMatieres(),
        getEmplacements(),
      ]);
      setChutes(chutesData);
      setMatieres(matieresData);
      setEmplacements(emplacementsData);
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
      const surface_m2 = (formData.dimensions_l * formData.dimensions_w) / 1000000; // mm² vers m²
      
      await createChuteValorisable({
        ...formData,
        surface_m2,
        emplacement_id: formData.emplacement_id || undefined,
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur lors de la création de la chute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      matiere_id: '',
      dimensions_l: 0,
      dimensions_w: 0,
      emplacement_id: '',
      statut: 'disponible',
      prix_estime: 0,
      notes: '',
    });
  };

  const handleStatusChange = async (chuteId: string, newStatus: string) => {
    try {
      await updateChuteValorisable(chuteId, { 
        statut: newStatus as any,
        date_utilisation: newStatus === 'utilise' ? new Date().toISOString().split('T')[0] : undefined
      });
      loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      disponible: { variant: 'success' as const, label: 'Disponible' },
      reserve: { variant: 'warning' as const, label: 'Réservé' },
      utilise: { variant: 'default' as const, label: 'Utilisé' },
      rebut: { variant: 'danger' as const, label: 'Rebut' },
    };
    
    const statusConfig = config[statut as keyof typeof config];
    return statusConfig ? (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    ) : (
      <Badge>{statut}</Badge>
    );
  };

  const columns = [
    {
      key: 'matiere_designation',
      label: 'Matière',
      render: (value: string, row: ChuteValorisableWithDetails) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.matiere_code}</div>
        </div>
      ),
    },
    {
      key: 'dimensions',
      label: 'Dimensions',
      render: (_: any, row: ChuteValorisableWithDetails) => (
        <div className="text-sm">
          <div>{row.dimensions_l} × {row.dimensions_w} mm</div>
          <div className="text-gray-500 dark:text-gray-400">
            {num3(row.surface_m2)} m²
          </div>
        </div>
      ),
    },
    {
      key: 'emplacement_nom',
      label: 'Emplacement',
      render: (value: string) => value || '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'prix_estime',
      label: 'Prix estimé',
      render: (value: number) => (
        <div className="text-right font-medium text-green-600 dark:text-green-400">
          {fmtMAD(value)}
        </div>
      ),
    },
    {
      key: 'date_creation',
      label: 'Date création',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: ChuteValorisableWithDetails) => (
        <div className="flex space-x-1">
          {row.statut === 'disponible' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(row.id, 'reserve')}
                title="Réserver"
                className="text-orange-600 hover:text-orange-700"
              >
                <Package size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(row.id, 'utilise')}
                title="Marquer comme utilisé"
                className="text-green-600 hover:text-green-700"
              >
                <Scissors size={16} />
              </Button>
            </>
          )}
          {row.statut === 'reserve' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange(row.id, 'utilise')}
              title="Marquer comme utilisé"
              className="text-green-600 hover:text-green-700"
            >
              <Scissors size={16} />
            </Button>
          )}
        </div>
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

  // Statistiques rapides
  const stats = {
    disponibles: chutes.filter(c => c.statut === 'disponible').length,
    reserves: chutes.filter(c => c.statut === 'reserve').length,
    surface_totale: chutes.filter(c => c.statut === 'disponible').reduce((sum, c) => sum + c.surface_m2, 0),
    valeur_totale: chutes.filter(c => c.statut === 'disponible').reduce((sum, c) => sum + c.prix_estime, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chutes valorisables</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion et valorisation des chutes récupérables</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouvelle chute
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Disponibles</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.disponibles}</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Réservées</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.reserves}</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Scissors className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Surface totale</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{num3(stats.surface_totale)} m²</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Valeur estimée</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{fmtMAD(stats.valeur_totale)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une chute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredChutes} />

        {filteredChutes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune chute trouvée pour cette recherche' : 'Aucune chute enregistrée'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvelle chute valorisable"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormRow label="Longueur (mm)" required>
              <NumberInput
                value={formData.dimensions_l}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensions_l: parseFloat(e.target.value) || 0 }))}
                decimals={0}
                min="0"
                required
              />
            </FormRow>

            <FormRow label="Largeur (mm)" required>
              <NumberInput
                value={formData.dimensions_w}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensions_w: parseFloat(e.target.value) || 0 }))}
                decimals={0}
                min="0"
                required
              />
            </FormRow>

            <FormRow label="Surface calculée">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                {num3((formData.dimensions_l * formData.dimensions_w) / 1000000)} m²
              </div>
            </FormRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow label="Emplacement">
              <select
                value={formData.emplacement_id}
                onChange={(e) => setFormData(prev => ({ ...prev, emplacement_id: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Aucun emplacement</option>
                {emplacements.map((emplacement) => (
                  <option key={emplacement.id} value={emplacement.id}>
                    {emplacement.code} - {emplacement.nom}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="Prix estimé">
              <NumberInput
                value={formData.prix_estime}
                onChange={(e) => setFormData(prev => ({ ...prev, prix_estime: parseFloat(e.target.value) || 0 }))}
                decimals={2}
                min="0"
              />
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Créer la chute'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}