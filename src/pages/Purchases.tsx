import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AchatWithDetails } from '../types/production';
import { getAchats, receiveAchat } from '../lib/production';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Purchases() {
  const navigate = useNavigate();
  const [achats, setAchats] = useState<AchatWithDetails[]>([]);
  const [filteredAchats, setFilteredAchats] = useState<AchatWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState<string | null>(null);

  useEffect(() => {
    loadAchats();
  }, []);

  useEffect(() => {
    const filtered = achats.filter(achat =>
      achat.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achat.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achat.numero_facture_fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAchats(filtered);
  }, [achats, searchTerm]);

  const loadAchats = async () => {
    try {
      setIsLoading(true);
      const data = await getAchats();
      setAchats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des achats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceive = async (achatId: string) => {
    try {
      setIsReceiving(achatId);
      await receiveAchat(achatId);
      loadAchats(); // Recharger pour mettre à jour les statuts
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
    } finally {
      setIsReceiving(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      commande: { variant: 'info' as const, label: 'Commandé' },
      livree: { variant: 'success' as const, label: 'Livrée' },
      facturee: { variant: 'warning' as const, label: 'Facturée' },
      payee: { variant: 'success' as const, label: 'Payée' },
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
      key: 'numero',
      label: 'Numéro',
      render: (value: string, row: AchatWithDetails) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(row.date_achat).toLocaleDateString('fr-FR')}
          </div>
        </div>
      ),
    },
    {
      key: 'fournisseur_nom',
      label: 'Fournisseur',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'date_livraison',
      label: 'Livraison',
      render: (value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '-',
    },
    {
      key: 'numero_facture_fournisseur',
      label: 'N° Facture',
      render: (value: string) => value || '-',
    },
    {
      key: 'montant_ttc',
      label: 'Montant TTC',
      render: (value: number) => (
        <div className="text-right font-medium text-green-600 dark:text-green-400">
          {fmtMAD(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: AchatWithDetails) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/purchases/${row.id}`)}
            title="Voir détails"
          >
            <Eye size={16} />
          </Button>
          {row.statut === 'commande' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReceive(row.id)}
              disabled={isReceiving === row.id}
              title="Réceptionner"
              className="text-green-600 hover:text-green-700"
            >
              <Package size={16} />
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achats</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des achats fournisseurs</p>
        </div>
        <Button onClick={() => navigate('/purchases/new')}>
          <Plus size={20} className="mr-2" />
          Nouvel achat
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un achat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredAchats} />

        {filteredAchats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun achat trouvé pour cette recherche' : 'Aucun achat enregistré'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}