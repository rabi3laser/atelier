import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Settings } from 'lucide-react';
import { PlanningRessourceWithDetails } from '../types/analytics';
import { getPlanningRessources, createPlanningRessource, updatePlanningRessource } from '../lib/analytics';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Planning() {
  const [plannings, setPlannings] = useState<PlanningRessourceWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRessource, setSelectedRessource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlannings();
  }, [selectedDate]);

  const loadPlannings = async () => {
    try {
      setIsLoading(true);
      const dateDebut = selectedDate;
      const dateFin = new Date(new Date(selectedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const data = await getPlanningRessources(dateDebut, dateFin);
      setPlannings(data);
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
      // Afficher un message d'erreur à l'utilisateur si nécessaire
      setPlannings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      planifie: { variant: 'default' as const, label: 'Planifié' },
      confirme: { variant: 'info' as const, label: 'Confirmé' },
      en_cours: { variant: 'warning' as const, label: 'En cours' },
      termine: { variant: 'success' as const, label: 'Terminé' },
      annule: { variant: 'danger' as const, label: 'Annulé' },
    };
    
    const statusConfig = config[statut as keyof typeof config];
    return statusConfig ? (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    ) : (
      <Badge>{statut}</Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'machine': return <Settings className="w-4 h-4" />;
      case 'operateur': return <User className="w-4 h-4" />;
      case 'outil': return <Settings className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'machine': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'operateur': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'outil': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Grouper par ressource
  const ressources = [...new Set(plannings.map(p => `${p.ressource_type}:${p.ressource_nom}`))];
  const planningsByRessource = ressources.reduce((acc, ressource) => {
    const [type, nom] = ressource.split(':');
    acc[ressource] = plannings.filter(p => p.ressource_type === type && p.ressource_nom === nom);
    return acc;
  }, {} as Record<string, PlanningRessourceWithDetails[]>);

  // Générer les jours de la semaine
  const startDate = new Date(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Planification des ressources</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Button>
            <Plus size={20} className="mr-2" />
            Nouveau créneau
          </Button>
        </div>
      </div>

      {/* Vue Planning Board */}
      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* En-tête des jours */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="font-medium text-gray-900 dark:text-white p-2">Ressource</div>
              {days.map((day, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Lignes des ressources */}
            {ressources.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune ressource planifiée pour cette période
              </div>
            ) : (
              ressources.map((ressource) => {
                const [type, nom] = ressource.split(':');
                const planningsRessource = planningsByRessource[ressource];
                
                return (
                  <div key={ressource} className="grid grid-cols-8 gap-2 mb-2 min-h-[80px]">
                    {/* Colonne ressource */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded flex items-center space-x-2">
                      <div className={`p-1 rounded ${getTypeColor(type)}`}>
                        {getTypeIcon(type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{nom}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{type}</div>
                      </div>
                    </div>

                    {/* Colonnes des jours */}
                    {days.map((day, dayIndex) => {
                      const dayStr = day.toISOString().split('T')[0];
                      const planningsJour = planningsRessource.filter(p => {
                        const planningDate = new Date(p.date_debut).toISOString().split('T')[0];
                        return planningDate === dayStr;
                      });

                      return (
                        <div key={dayIndex} className="p-1 border border-gray-200 dark:border-gray-700 rounded min-h-[70px]">
                          {planningsJour.map((planning) => (
                            <div
                              key={planning.id}
                              className="mb-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                              title={`${planning.projet_nom || planning.bon_travail_numero || 'Sans projet'} - ${planning.notes}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-blue-800 dark:text-blue-300">
                                  {new Date(planning.date_debut).toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {getStatusBadge(planning.statut)}
                              </div>
                              <div className="text-blue-700 dark:text-blue-400 truncate">
                                {planning.projet_nom || planning.bon_travail_numero || 'Tâche'}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Légende */}
      <Card title="Légende">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-sm">Machine</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">Opérateur</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-sm">Outil</span>
          </div>
        </div>
      </Card>
    </div>
  );
}