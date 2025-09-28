import React, { useState, useEffect } from 'react';
import { Search, Eye, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommandeWithClient } from '../types/commercial';
import { getCommandes, createFactureFromCommande } from '../lib/commercial';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import GenerateDocumentButton from '../components/GenerateDocumentButton';

export default function Orders() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState<CommandeWithClient[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<CommandeWithClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFacture, setIsCreatingFacture] = useState<string | null>(null);

  useEffect(() => {
    loadCommandes();
  }, []);

  useEffect(() => {
    const filtered = commandes.filter(c =>
      c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.devis_numero?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCommandes(filtered);
  }, [commandes, searchTerm]);

  const loadCommandes = async () => {
    try {
      setIsLoading(true);
      const data = await getCommandes();
      setCommandes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFacture = async (commandeId: string) => {
    try {
      setIsCreatingFacture(commandeId);
      const factureId = await createFactureFromCommande(commandeId);
      console.log('Facture créée:', factureId);
      navigate('/invoices');
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
    } finally {
      setIsCreatingFacture(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      en_cours: { variant: 'info' as const, label: 'En cours' },
      en_production: { variant: 'warning' as const, label: 'En production' },
      prete: { variant: 'success' as const, label: 'Prête' },
      livree: { variant: 'success' as const, label: 'Livrée' },
      annulee: { variant: 'danger' as const, label: 'Annulée' },
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
      render: (value: string, row: CommandeWithClient) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(row.date_commande).toLocaleDateString('fr-FR')}
          </div>
        </div>
      ),
    },
    {
      key: 'client_nom',
      label: 'Client',
    },
    {
      key: 'devis_numero',
      label: 'Devis origine',
      render: (value: string) => value || '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'date_livraison_prevue',
      label: 'Livraison prévue',
      render: (value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '-',
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
      render: (_: any, row: CommandeWithClient) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/orders/${row.id}`)}
            title="Voir détails"
          >
            <Eye size={16} />
          </Button>
          {(row.statut === 'prete' || row.statut === 'livree') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateFacture(row.id)}
              disabled={isCreatingFacture === row.id}
              title="Créer facture"
              className="text-blue-600 hover:text-blue-700"
            >
              <FileText size={16} />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commandes</h1>
          <p className="text-gray-600 dark:text-gray-400">Suivi des commandes clients</p>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredCommandes} />

        {filteredCommandes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune commande trouvée pour cette recherche' : 'Aucune commande enregistrée'}
            </p>
          </div>
        )}
        <GenerateDocumentButton
          documentId={row.id}
          documentType="COMMANDE"
          variant="ghost"
          size="sm"
          showLabel={false}
        />
      </Card>
    </div>
  );
}