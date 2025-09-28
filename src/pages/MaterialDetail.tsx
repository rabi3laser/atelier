import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, RotateCcw, Package, DollarSign } from 'lucide-react';
import { MatiereWithStock, MouvementStock } from '../types/material';
import { getMatiere, getMouvementsStock, updateMatiere, createMouvementStock } from '../lib/materials';
import { fmtMAD, num3 } from '../lib/format';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import MatiereForm from '../components/MatiereForm';
import MouvementStockForm from '../components/MouvementStockForm';

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [matiere, setMatiere] = useState<MatiereWithStock | null>(null);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [mouvementType, setMouvementType] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadMatiereData();
    }
  }, [id]);

  const loadMatiereData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [matiereData, mouvementsData] = await Promise.all([
        getMatiere(id),
        getMouvementsStock(id, 20),
      ]);
      
      setMatiere(matiereData);
      setMouvements(mouvementsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données matière:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMatiere = async (matiereData: any) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const updatedMatiere = await updateMatiere(id, matiereData);
      setMatiere(prev => prev ? { ...prev, ...updatedMatiere } : null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Erreur lors de la modification de la matière:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMouvement = async (mouvementData: any) => {
    try {
      setIsSubmitting(true);
      await createMouvementStock(mouvementData);
      setShowMouvementModal(false);
      loadMatiereData(); // Recharger pour mettre à jour le stock
    } catch (error) {
      console.error('Erreur lors de la création du mouvement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMouvementModal = (type: 'entree' | 'sortie' | 'ajustement') => {
    setMouvementType(type);
    setShowMouvementModal(true);
  };

  const getTypeBadge = (type: string) => {
    const config = {
      entree: { variant: 'success' as const, label: 'Entrée' },
      sortie: { variant: 'danger' as const, label: 'Sortie' },
      ajustement: { variant: 'warning' as const, label: 'Ajustement' },
      chute: { variant: 'info' as const, label: 'Chute' },
    };
    
    const typeConfig = config[type as keyof typeof config];
    return typeConfig ? (
      <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
    ) : (
      <Badge>{type}</Badge>
    );
  };

  const mouvementsColumns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'type_mouvement',
      label: 'Type',
      render: (value: string) => getTypeBadge(value),
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (value: number, row: MouvementStock) => (
        <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value > 0 ? '+' : ''}{num3(value)} {matiere?.unite}
        </span>
      ),
    },
    {
      key: 'prix_unitaire',
      label: 'Prix unitaire',
      render: (value: number) => fmtMAD(value || 0),
    },
    {
      key: 'valeur_mouvement',
      label: 'Valeur',
      render: (value: number) => (
        <span className="font-medium">
          {fmtMAD(value || 0)}
        </span>
      ),
    },
    {
      key: 'reference_document',
      label: 'Référence',
      render: (value: string) => value || '-',
    },
    {
      key: 'commentaire',
      label: 'Commentaire',
      render: (value: string) => value || '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!matiere) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Matière non trouvée</p>
        <Button onClick={() => navigate('/materials')} className="mt-4">
          Retour aux matières
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/materials')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{matiere.designation}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Code: {matiere.code} • {matiere.epaisseur}mm • {matiere.couleur}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => openMouvementModal('entree')}>
            <TrendingUp size={20} className="mr-2" />
            Entrée
          </Button>
          <Button variant="secondary" onClick={() => openMouvementModal('sortie')}>
            <TrendingDown size={20} className="mr-2" />
            Sortie
          </Button>
          <Button variant="secondary" onClick={() => openMouvementModal('ajustement')}>
            <RotateCcw size={20} className="mr-2" />
            Ajustement
          </Button>
          <Button onClick={() => setShowEditModal(true)}>
            <Edit size={20} className="mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Stock disponible"
          value={`${num3(matiere.stock?.quantite_disponible || 0)} ${matiere.unite}`}
          icon={Package}
        />
        <StatCard
          title="Stock réservé"
          value={`${num3(matiere.stock?.quantite_reservee || 0)} ${matiere.unite}`}
          icon={Package}
        />
        <StatCard
          title="Valeur stock"
          value={fmtMAD(matiere.stock?.valeur_stock || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Prix moyen pondéré"
          value={fmtMAD(matiere.stock?.prix_moyen_pondere || 0)}
          icon={DollarSign}
        />
      </div>

      <Card title="Informations matière">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Caractéristiques</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Unité: {matiere.unite}</div>
              <div>Épaisseur: {matiere.epaisseur} mm</div>
              <div>Largeur: {matiere.largeur} mm</div>
              <div>Longueur: {matiere.longueur} mm</div>
              {matiere.couleur && <div>Couleur: {matiere.couleur}</div>}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Prix</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>Prix d'achat: {fmtMAD(matiere.prix_achat_unitaire || 0)}</div>
              <div>Prix de vente: {fmtMAD(matiere.prix_vente_unitaire || 0)}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fournisseur</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>{matiere.fournisseur_nom || 'Aucun fournisseur'}</div>
            </div>
          </div>
        </div>
        
        {matiere.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{matiere.notes}</p>
          </div>
        )}
      </Card>

      <Card title="Historique des mouvements (20 derniers)">
        <Table columns={mouvementsColumns} data={mouvements} />
        
        {mouvements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Aucun mouvement de stock</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la matière"
        size="xl"
      >
        <MatiereForm
          matiere={matiere}
          onSubmit={handleUpdateMatiere}
          onCancel={() => setShowEditModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={showMouvementModal}
        onClose={() => setShowMouvementModal(false)}
        title={`${mouvementType === 'entree' ? 'Entrée' : mouvementType === 'sortie' ? 'Sortie' : 'Ajustement'} de stock`}
        size="lg"
      >
        <MouvementStockForm
          matiereId={matiere.id}
          defaultType={mouvementType}
          onSubmit={handleCreateMouvement}
          onCancel={() => setShowMouvementModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}