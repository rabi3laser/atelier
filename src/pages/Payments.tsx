import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaiementWithFacture } from '../types/commercial';
import { getPaiements } from '../lib/commercial';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Payments() {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState<PaiementWithFacture[]>([]);
  const [filteredPaiements, setFilteredPaiements] = useState<PaiementWithFacture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPaiements();
  }, []);

  useEffect(() => {
    const filtered = paiements.filter(p =>
      p.facture_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPaiements(filtered);
  }, [paiements, searchTerm]);

  const loadPaiements = async () => {
    try {
      setIsLoading(true);
      const data = await getPaiements();
      setPaiements(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModeBadge = (mode: string) => {
    const config = {
      especes: { variant: 'success' as const, label: 'Espèces' },
      cheque: { variant: 'info' as const, label: 'Chèque' },
      virement: { variant: 'info' as const, label: 'Virement' },
      carte: { variant: 'info' as const, label: 'Carte' },
      prelevement: { variant: 'info' as const, label: 'Prélèvement' },
    };
    
    const modeConfig = config[mode as keyof typeof config];
    return modeConfig ? (
      <Badge variant={modeConfig.variant}>{modeConfig.label}</Badge>
    ) : (
      <Badge>{mode}</Badge>
    );
  };

  const columns = [
    {
      key: 'date_paiement',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'facture_numero',
      label: 'Facture',
    },
    {
      key: 'client_nom',
      label: 'Client',
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (value: number) => (
        <div className="text-right font-medium text-green-600 dark:text-green-400">
          {fmtMAD(value)}
        </div>
      ),
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      render: (value: string) => getModeBadge(value),
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (value: string) => value || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: PaiementWithFacture) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/invoices/${row.facture_id}`)}
          title="Voir facture"
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paiements</h1>
          <p className="text-gray-600 dark:text-gray-400">Historique des paiements reçus</p>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un paiement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredPaiements} />

        {filteredPaiements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun paiement trouvé pour cette recherche' : 'Aucun paiement enregistré'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}