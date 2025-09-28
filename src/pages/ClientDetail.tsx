import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, FileText, CreditCard, Calendar } from 'lucide-react';
import { Client, ClientHistorique, ClientStats } from '../types/client';
import { getClient, getClientHistorique, getClientStats, updateClient } from '../lib/clients';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Tabs from '../components/Tabs';
import Table from '../components/Table';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import StatCard from '../components/StatCard';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [historique, setHistorique] = useState<ClientHistorique[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [activeTab, setActiveTab] = useState('historique');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [clientData, historiqueData, statsData] = await Promise.all([
        getClient(id),
        getClientHistorique(id),
        getClientStats(id),
      ]);
      
      setClient(clientData);
      setHistorique(historiqueData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const updatedClient = await updateClient(id, clientData);
      setClient(updatedClient);
      setShowEditModal(false);
    } catch (error) {
      console.error('Erreur lors de la modification du client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (type: string, statut: string) => {
    const statusConfig = {
      devis: {
        brouillon: { variant: 'default' as const, label: 'Brouillon' },
        envoye: { variant: 'info' as const, label: 'Envoyé' },
        accepte: { variant: 'success' as const, label: 'Accepté' },
        refuse: { variant: 'danger' as const, label: 'Refusé' },
        expire: { variant: 'warning' as const, label: 'Expiré' },
      },
      commande: {
        en_cours: { variant: 'info' as const, label: 'En cours' },
        en_production: { variant: 'warning' as const, label: 'En production' },
        prete: { variant: 'success' as const, label: 'Prête' },
        livree: { variant: 'success' as const, label: 'Livrée' },
        annulee: { variant: 'danger' as const, label: 'Annulée' },
      },
      facture: {
        brouillon: { variant: 'default' as const, label: 'Brouillon' },
        envoyee: { variant: 'info' as const, label: 'Envoyée' },
        payee: { variant: 'success' as const, label: 'Payée' },
        en_retard: { variant: 'danger' as const, label: 'En retard' },
        annulee: { variant: 'danger' as const, label: 'Annulée' },
      },
      paiement: {
        especes: { variant: 'success' as const, label: 'Espèces' },
        cheque: { variant: 'info' as const, label: 'Chèque' },
        virement: { variant: 'info' as const, label: 'Virement' },
        carte: { variant: 'info' as const, label: 'Carte' },
        prelevement: { variant: 'info' as const, label: 'Prélèvement' },
      },
    };

    const config = statusConfig[type as keyof typeof statusConfig]?.[statut as keyof any];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : (
      <Badge>{statut}</Badge>
    );
  };

  const historiqueColumns = [
    {
      key: 'type_doc',
      label: 'Type',
      render: (value: string) => (
        <Badge variant="info">{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>
      ),
    },
    {
      key: 'doc_numero',
      label: 'Numéro',
    },
    {
      key: 'date_doc',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (value: number) => fmtMAD(value),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string, row: ClientHistorique) => getStatusBadge(row.type_doc, value),
    },
  ];

  const tabs = [
    {
      id: 'historique',
      label: 'Historique',
      content: (
        <div>
          <Table columns={historiqueColumns} data={historique} />
          {historique.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Aucun historique disponible</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'statistiques',
      label: 'Statistiques',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="CA Total"
            value={fmtMAD(stats?.ca_total || 0)}
            icon={TrendingUp}
          />
          <StatCard
            title="Reste dû"
            value={fmtMAD(stats?.reste_du || 0)}
            icon={CreditCard}
          />
          <StatCard
            title="Nb Devis"
            value={stats?.nb_devis || 0}
            icon={FileText}
          />
          <StatCard
            title="Nb Commandes"
            value={stats?.nb_commandes || 0}
            icon={FileText}
          />
          <StatCard
            title="Nb Factures"
            value={stats?.nb_factures || 0}
            icon={FileText}
          />
          <StatCard
            title="Dernière commande"
            value={stats?.derniere_commande ? new Date(stats.derniere_commande).toLocaleDateString('fr-FR') : 'Aucune'}
            icon={Calendar}
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

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Client non trouvé</p>
        <Button onClick={() => navigate('/clients')} className="mt-4">
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/clients')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.nom}</h1>
            <p className="text-gray-600 dark:text-gray-400">Code: {client.code}</p>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          <Edit size={20} className="mr-2" />
          Modifier
        </Button>
      </div>

      <Card title="Informations client">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {client.telephone && <div>Tél: {client.telephone}</div>}
              {client.email && <div>Email: {client.email}</div>}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Adresse</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {client.adresse && <div>{client.adresse}</div>}
              {(client.code_postal || client.ville) && (
                <div>{client.code_postal} {client.ville}</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations fiscales</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {client.siret && <div>SIRET: {client.siret}</div>}
              {client.ice && <div>ICE: {client.ice}</div>}
              {client.rc && <div>RC: {client.rc}</div>}
              {client.if && <div>IF: {client.if}</div>}
            </div>
          </div>
        </div>
        
        {client.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{client.notes}</p>
          </div>
        )}
      </Card>

      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </Card>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le client"
        size="lg"
      >
        <ClientForm
          client={client}
          onSubmit={handleUpdateClient}
          onCancel={() => setShowEditModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}