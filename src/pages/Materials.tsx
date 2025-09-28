import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MatiereWithStock } from '../types/material';
import { getMatieres, createMatiere, createMouvementStock } from '../lib/materials';
import { getCachedMatieres, setCachedData } from '../lib/analytics';
import { fmtMAD, num3 } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import MatiereForm from '../components/MatiereForm';
import MouvementStockForm from '../components/MouvementStockForm';
import ScanInput from '../components/ScanInput';

export default function Materials() {
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState<MatiereWithStock[]>([]);
  const [filteredMatieres, setFilteredMatieres] = useState<MatiereWithStock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMatiereModal, setShowMatiereModal] = useState(false);
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<string>('');
  const [mouvementType, setMouvementType] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMatieres();
  }, []);

  useEffect(() => {
    const filtered = matieres.filter(matiere =>
      matiere.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matiere.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matiere.couleur?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMatieres(filtered);
  }, [matieres, searchTerm]);

  const loadMatieres = async () => {
    try {
      setIsLoading(true);
      const data = await getCachedMatieres();
      setMatieres(data);
      setCachedData('matieres', data);
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMatiere = async (matiereData: any) => {
    try {
      setIsSubmitting(true);
      await createMatiere(matiereData);
      setShowMatiereModal(false);
      loadMatieres();
    } catch (error) {
      console.error('Erreur lors de la création de la matière:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMouvement = async (mouvementData: any) => {
    try {
      setIsSubmitting(true);
      await createMouvementStock(mouvementData);
      setShowMouvementModal(false);
      setSelectedMatiere('');
      loadMatieres();
    } catch (error) {
      console.error('Erreur lors de la création du mouvement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMouvementModal = (matiereId: string, type: 'entree' | 'sortie' | 'ajustement') => {
    setSelectedMatiere(matiereId);
    setMouvementType(type);
    setShowMouvementModal(true);
  };

  const handleScan = (code: string) => {
    setSearchTerm(code);
  };

  const getStockBadge = (stock: any) => {
    if (!stock) return <Badge variant="danger">Aucun stock</Badge>;
    
    const disponible = stock.quantite_disponible || 0;
    if (disponible <= 0) return <Badge variant="danger">Rupture</Badge>;
    if (disponible < 10) return <Badge variant="warning">Faible</Badge>;
    return <Badge variant="success">Disponible</Badge>;
  };

  const columns = [
    {
      key: 'designation',
      label: 'Matière',
      render: (value: string, row: MatiereWithStock) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.code} • {row.epaisseur}mm • {row.couleur}
          </div>
        </div>
      ),
    },
    {
      key: 'fournisseur_nom',
      label: 'Fournisseur',
      render: (value: string) => value || '-',
    },
    {
      key: 'stock',
      label: 'Stock disponible',
      render: (stock: any, row: MatiereWithStock) => (
        <div className="text-right">
          <div className="font-medium text-gray-900 dark:text-white">
            {stock ? num3(stock.quantite_disponible || 0) : '0,000'} {row.unite}
          </div>
          <div className="text-sm">{getStockBadge(stock)}</div>
        </div>
      ),
    },
    {
      key: 'valeur_stock',
      label: 'Valeur stock',
      render: (_: any, row: MatiereWithStock) => (
        <div className="text-right font-medium text-green-600 dark:text-green-400">
          {fmtMAD(row.stock?.valeur_stock || 0)}
        </div>
      ),
    },
    {
      key: 'prix_vente_unitaire',
      label: 'Prix vente',
      render: (value: number) => (
        <div className="text-right">
          {fmtMAD(value || 0)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: MatiereWithStock) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/materials/${row.id}`)}
            title="Voir détails"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openMouvementModal(row.id, 'entree')}
            title="Entrée stock"
            className="text-green-600 hover:text-green-700"
          >
            <TrendingUp size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openMouvementModal(row.id, 'sortie')}
            title="Sortie stock"
            className="text-red-600 hover:text-red-700"
          >
            <TrendingDown size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openMouvementModal(row.id, 'ajustement')}
            title="Ajustement stock"
            className="text-blue-600 hover:text-blue-700"
          >
            <RotateCcw size={16} />
          </Button>
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

  const selectedMatiereData = matieres.find(m => m.id === selectedMatiere);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matières & Stock</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des matières premières et du stock</p>
        </div>
        <Button onClick={() => setShowMatiereModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouvelle matière
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <ScanInput
            placeholder="Scanner code matière ou rechercher..."
            onScan={handleScan}
          />
        </div>

        <Table columns={columns} data={filteredMatieres} />

        {filteredMatieres.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune matière trouvée pour cette recherche' : 'Aucune matière enregistrée'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showMatiereModal}
        onClose={() => setShowMatiereModal(false)}
        title="Nouvelle matière"
        size="xl"
      >
        <MatiereForm
          onSubmit={handleCreateMatiere}
          onCancel={() => setShowMatiereModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={showMouvementModal}
        onClose={() => setShowMouvementModal(false)}
        title={`${mouvementType === 'entree' ? 'Entrée' : mouvementType === 'sortie' ? 'Sortie' : 'Ajustement'} de stock - ${selectedMatiereData?.designation}`}
        size="lg"
      >
        <MouvementStockForm
          matiereId={selectedMatiere}
          defaultType={mouvementType}
          onSubmit={handleCreateMouvement}
          onCancel={() => setShowMouvementModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}