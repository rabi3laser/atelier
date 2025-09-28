import React, { useState, useEffect } from 'react';
import { Search, Eye, Plus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FactureWithClient } from '../types/commercial';
import { getFactures, createPaiement } from '../lib/commercial';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import PaiementForm from '../components/PaiementForm';
import GenerateDocumentButton from '../components/GenerateDocumentButton';

export default function Invoices() {
  const navigate = useNavigate();
  const [factures, setFactures] = useState<FactureWithClient[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureWithClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<FactureWithClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFactures();
  }, []);

  useEffect(() => {
    const filtered = factures.filter(f =>
      f.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.commande_numero?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFactures(filtered);
  }, [factures, searchTerm]);

  const loadFactures = async () => {
    try {
      setIsLoading(true);
      const data = await getFactures();
      setFactures(data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePaiement = async (paiementData: any) => {
    try {
      setIsSubmitting(true);
      await createPaiement(paiementData);
      setShowPaiementModal(false);
      setSelectedFacture(null);
      loadFactures(); // Recharger pour mettre à jour les montants
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaiementModal = (facture: FactureWithClient) => {
    setSelectedFacture(facture);
    setShowPaiementModal(true);
  };

  const getStatusBadge = (statut: string) => {
    const config = {
      brouillon: { variant: 'default' as const, label: 'Brouillon' },
      envoyee: { variant: 'info' as const, label: 'Envoyée' },
      payee: { variant: 'success' as const, label: 'Payée' },
      en_retard: { variant: 'danger' as const, label: 'En retard' },
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
      render: (value: string, row: FactureWithClient) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value || 'En attente'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(row.date_facture).toLocaleDateString('fr-FR')}
          </div>
        </div>
      ),
    },
    {
      key: 'client_nom',
      label: 'Client',
    },
    {
      key: 'commande_numero',
      label: 'Commande',
      render: (value: string) => value || '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'date_echeance',
      label: 'Échéance',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
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
      key: 'reste_du',
      label: 'Reste dû',
      render: (value: number) => (
        <div className={`text-right font-medium ${value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {fmtMAD(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: FactureWithClient) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices/${row.id}`)}
            title="Voir détails"
          >
            <Eye size={16} />
          </Button>
          {row.reste_du > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPaiementModal(row)}
              title="Ajouter paiement"
              className="text-green-600 hover:text-green-700"
            >
              <Plus size={16} />
            </Button>
          )}
        <GenerateDocumentButton
          documentId={row.id}
          documentType="FACTURE"
          variant="ghost"
          size="sm"
          showLabel={false}
        />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Factures</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des factures et paiements</p>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredFactures} />

        {filteredFactures.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucune facture trouvée pour cette recherche' : 'Aucune facture enregistrée'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        title="Nouveau paiement"
        size="lg"
      >
        {selectedFacture && (
          <PaiementForm
            factureId={selectedFacture.id}
            factureNumero={selectedFacture.numero || 'En attente'}
            resteDu={selectedFacture.reste_du}
            onSubmit={handleCreatePaiement}
            onCancel={() => setShowPaiementModal(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}