import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BonTravailWithDetails } from '../types/production';
import { getBonsTravail, startBonTravail, completeBonTravail } from '../lib/production';
import Button from '../components/Button';
import BonTravailCard from '../components/BonTravailCard';
import CompleteBonModal from '../components/CompleteBonModal';

export default function WorkOrders() {
  const [bons, setBons] = useState<BonTravailWithDetails[]>([]);
  const [selectedBon, setSelectedBon] = useState<BonTravailWithDetails | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBonsTravail();
  }, []);

  const loadBonsTravail = async () => {
    try {
      setIsLoading(true);
      const data = await getBonsTravail();
      setBons(data);
    } catch (error) {
      console.error('Erreur lors du chargement des bons de travail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startBonTravail(id);
      loadBonsTravail();
    } catch (error) {
      console.error('Erreur lors du démarrage du bon:', error);
    }
  };

  const handleCompleteClick = (bon: BonTravailWithDetails) => {
    setSelectedBon(bon);
    setShowCompleteModal(true);
  };

  const handleComplete = async (quantiteProduite: number, quantiteChutes: number) => {
    if (!selectedBon) return;
    
    try {
      setIsSubmitting(true);
      await completeBonTravail(selectedBon.id, quantiteProduite, quantiteChutes);
      setShowCompleteModal(false);
      setSelectedBon(null);
      loadBonsTravail();
    } catch (error) {
      console.error('Erreur lors de la finalisation du bon:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouper les bons par statut
  const bonsPlanifies = bons.filter(bon => bon.statut === 'planifie');
  const bonsEnCours = bons.filter(bon => bon.statut === 'en_cours');
  const bonsTermines = bons.filter(bon => bon.statut === 'termine');

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bons de travail</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion de la production</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Nouveau bon
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Planifiés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Planifiés
            </h2>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
              {bonsPlanifies.length}
            </span>
          </div>
          <div className="space-y-3">
            {bonsPlanifies.map((bon) => (
              <BonTravailCard
                key={bon.id}
                bon={bon}
                onStart={handleStart}
              />
            ))}
            {bonsPlanifies.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun bon planifié
              </div>
            )}
          </div>
        </div>

        {/* Colonne En cours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              En cours
            </h2>
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-sm">
              {bonsEnCours.length}
            </span>
          </div>
          <div className="space-y-3">
            {bonsEnCours.map((bon) => (
              <BonTravailCard
                key={bon.id}
                bon={bon}
                onComplete={handleCompleteClick}
              />
            ))}
            {bonsEnCours.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun bon en cours
              </div>
            )}
          </div>
        </div>

        {/* Colonne Terminés */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Terminés
            </h2>
            <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-sm">
              {bonsTermines.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bonsTermines.slice(0, 10).map((bon) => (
              <BonTravailCard
                key={bon.id}
                bon={bon}
              />
            ))}
            {bonsTermines.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun bon terminé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de finalisation */}
      {selectedBon && (
        <CompleteBonModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          bon={selectedBon}
          onComplete={handleComplete}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}