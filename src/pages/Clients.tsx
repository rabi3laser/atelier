import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types/client';
import { getClients, createClient, getClientStats } from '../lib/clients';
import { getCachedClients, setCachedData } from '../lib/analytics';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientStats, setClientStats] = useState<Record<string, { ca_total: number; reste_du: number }>>({});

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await getCachedClients();
      setClients(data);
      setCachedData('clients', data);
      
      // Charger les stats pour chaque client
      const stats: Record<string, { ca_total: number; reste_du: number }> = {};
      for (const client of data) {
        const clientStat = await getClientStats(client.id);
        stats[client.id] = {
          ca_total: clientStat.ca_total,
          reste_du: clientStat.reste_du
        };
      }
      setClientStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsSubmitting(true);
      await createClient(clientData);
      setShowModal(false);
      loadClients();
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'nom',
      label: 'Nom',
      render: (value: string, row: Client) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'telephone',
      label: 'Téléphone',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'ca_total',
      label: 'CA Total',
      render: (_: any, row: Client) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {fmtMAD(clientStats[row.id]?.ca_total || 0)}
        </span>
      ),
    },
    {
      key: 'reste_du',
      label: 'Reste dû',
      render: (_: any, row: Client) => {
        const resteDu = clientStats[row.id]?.reste_du || 0;
        return (
          <span className={`font-medium ${resteDu > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {fmtMAD(resteDu)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Client) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/clients/${row.id}`)}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion de votre portefeuille clients</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouveau client
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredClients} />

        {filteredClients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau client"
        size="lg"
      >
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}