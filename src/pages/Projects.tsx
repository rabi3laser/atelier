import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjetWithClient } from '../types/analytics';
import { getProjets, createProjet } from '../lib/analytics';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ProjetForm from '../components/ProjetForm';

export default function Projects() {
  const navigate = useNavigate();
  const [projets, setProjets] = useState<ProjetWithClient[]>([]);
  const [filteredProjets, setFilteredProjets] = useState<ProjetWithClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjets();
  }, []);

  useEffect(() => {
    const filtered = projets.filter(projet =>
      projet.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projet.client_nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjets(filtered);
  }, [projets, searchTerm]);

  const loadProjets = async () => {
    try {
      setIsLoading(true);
      const data = await getProjets();
      setProjets(data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProjet = async (projetData: any) => {
    try {
      setIsSubmitting(true);
      await createProjet(projetData);
      setShowModal(false);
      loadProjets();
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      planifie: { variant: 'default' as const, label: 'Planifié' },
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

  const calculateMarge = (budget: number, cout: number) => {
    if (budget === 0) return 0;
    return ((budget - cout) / budget) * 100;
  };

  const columns = [
    {
      key: 'nom',
      label: 'Projet',
      render: (value: string, row: ProjetWithClient) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'client_nom',
      label: 'Client',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'date_debut',
      label: 'Dates',
      render: (value: string, row: ProjetWithClient) => (
        <div className="text-sm">
          <div>Début: {new Date(value).toLocaleDateString('fr-FR')}</div>
          {row.date_fin_prevue && (
            <div className="text-gray-500 dark:text-gray-400">
              Fin: {new Date(row.date_fin_prevue).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'budget_prevu',
      label: 'Budget',
      render: (value: number, row: ProjetWithClient) => (
        <div className="text-right">
          <div className="font-medium text-green-600 dark:text-green-400">
            {fmtMAD(value)}
          </div>
          {row.cout_reel > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Coût: {fmtMAD(row.cout_reel)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'marge',
      label: 'Marge',
      render: (_: any, row: ProjetWithClient) => {
        const marge = calculateMarge(row.budget_prevu, row.cout_reel);
        return (
          <div className={`text-right font-medium ${marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {marge.toFixed(1)}%
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: ProjetWithClient) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${row.id}`)}
          title="Voir détails"
        >
          <Eye size={16} />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projets</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des projets clients</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {projets.filter(p => ['planifie', 'en_cours'].includes(p.statut)).length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Budget total</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {fmtMAD(projets.reduce((sum, p) => sum + p.budget_prevu, 0))}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Coût réel</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {fmtMAD(projets.reduce((sum, p) => sum + p.cout_reel, 0))}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Marge moyenne</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {projets.length > 0 ? 
                  (projets.reduce((sum, p) => sum + calculateMarge(p.budget_prevu, p.cout_reel), 0) / projets.length).toFixed(1) 
                  : '0.0'}%
              </div>
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
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredProjets} />

        {filteredProjets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun projet trouvé pour cette recherche' : 'Aucun projet enregistré'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau projet"
        size="xl"
      >
        <ProjetForm
          onSubmit={handleCreateProjet}
          onCancel={() => setShowModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}