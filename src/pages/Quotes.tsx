import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, CheckCircle, TestTube, Building2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DevisWithClient } from '../types/commercial';
import { getDevis, convertDevisToCommande, getDevisById, getDevisLignes, getClients } from '../lib/commercial';
import { fmtMAD } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import PDFPreview from '../components/PDFPreview';
import QuotePDFGenerator from '../components/QuotePDFGenerator';
import SendQuoteModal from '../components/SendQuoteModal';
import { N8nQuoteService } from '../lib/n8nQuoteService';
import { PDFGenerator, DevisData } from '../lib/pdfGenerator';
import GenerateDocumentButton from '../components/GenerateDocumentButton';
import ConfigTest from '../components/ConfigTest';
import CompanyInfoExtractor from '../components/CompanyInfoExtractor';
import DevisOptionsModal from '../components/DevisOptionsModal';
import TemplateSelector from '../components/TemplateSelector';
import CustomTemplateCreator from '../components/CustomTemplateCreator';

export default function Quotes() {
  const navigate = useNavigate();
  const [devis, setDevis] = useState<DevisWithClient[]>([]);
  const [filteredDevis, setFilteredDevis] = useState<DevisWithClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedDevisData, setSelectedDevisData] = useState<DevisData | null>(null);
  const [selectedDevisForSend, setSelectedDevisForSend] = useState<DevisWithClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<'template' | 'custom' | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    loadDevis();
  }, []);

  useEffect(() => {
    const filtered = devis.filter(d =>
      d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client_nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDevis(filtered);
  }, [devis, searchTerm]);

  const loadDevis = async () => {
    try {
      setIsLoading(true);
      const data = await getDevis();
      setDevis(data);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToCommande = async (devisId: string) => {
    try {
      setIsConverting(devisId);
      const commandeId = await convertDevisToCommande(devisId);
      console.log('Commande créée:', commandeId);
      loadDevis(); // Recharger pour mettre à jour les statuts
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
    } finally {
      setIsConverting(null);
    }
  };

  const handleSendSuccess = () => {
    setShowSendModal(false);
    setSelectedDevisForSend(null);
    loadDevis();
  };

  const handleOptionSelect = (option: 'template' | 'custom') => {
    setCurrentFlow(option);
    setShowOptionsModal(false);
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Naviguer vers le formulaire de création de devis avec le template sélectionné
    navigate(`/quotes/new?template=${templateId}`);
  };

  const handleCustomTemplateCreated = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Naviguer vers le formulaire de création de devis avec le nouveau template
    navigate(`/quotes/new?template=${templateId}`);
  };

  const handleBackToOptions = () => {
    setCurrentFlow(null);
    setShowOptionsModal(true);
  };
  const getStatusBadge = (statut: string) => {
    const config = {
      brouillon: { variant: 'default' as const, label: 'Brouillon' },
      envoye: { variant: 'info' as const, label: 'Envoyé' },
      accepte: { variant: 'success' as const, label: 'Accepté' },
      refuse: { variant: 'danger' as const, label: 'Refusé' },
      expire: { variant: 'warning' as const, label: 'Expiré' },
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
      render: (value: string, row: DevisWithClient) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(row.date_devis).toLocaleDateString('fr-FR')}
          </div>
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
      key: 'date_validite',
      label: 'Validité',
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
      render: (_: any, row: DevisWithClient) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quotes/${row.id}`)}
            title="Voir détails"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quotes/${row.id}/edit`)}
            title="Modifier"
          >
            <FileText size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Générer PDF"
            className="text-purple-600 hover:text-purple-700"
          >
            <GenerateDocumentButton
              documentId={row.id}
              documentType="DEVIS"
              variant="ghost"
              size="sm"
              showLabel={false}
            />
          </Button>
          {row.statut === 'accepte' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleConvertToCommande(row.id)}
              disabled={isConverting === row.id}
              title="Convertir en commande"
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle size={16} />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Devis</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des devis clients</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
            <TestTube size={20} className="mr-2" />
            Test config
          </Button>
          <Button variant="secondary" onClick={() => setShowCompanyModal(true)}>
            <Building2 size={20} className="mr-2" />
            Info société
          </Button>
          <Button onClick={() => setShowOptionsModal(true)}>
            <Sparkles size={20} className="mr-2" />
            Créer un devis
          </Button>
        </div>
      </div>

      {/* Aperçu PDF */}
      {showQuoteGenerator && selectedDevisData && (
        <PDFPreview
          devisData={selectedDevisData}
          onClose={() => {
            setShowQuoteGenerator(false);
            setSelectedDevisData(null);
          }}
        />
      )}

      {/* Modal envoi devis */}
      {showSendModal && selectedDevisForSend && (
        <SendQuoteModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          devisId={selectedDevisForSend.id}
          devisNumero={selectedDevisForSend.numero}
          clientEmail={selectedDevisForSend.client_email}
          clientPhone={selectedDevisForSend.client_nom} // Pas de téléphone dans le type actuel
          onSuccess={handleSendSuccess}
        />
      )}

      {/* Bouton générateur standalone */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          onClick={() => setShowQuoteGenerator(true)}
          size="lg"
          className="rounded-full shadow-lg"
        >
          <Plus size={24} />
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredDevis} />

        {filteredDevis.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun devis trouvé pour cette recherche' : 'Aucun devis enregistré'}
            </p>
          </div>
        )}
      </Card>

      {/* Modal test configuration */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Test de configuration"
        size="lg"
      >
        <ConfigTest />
      </Modal>

      {/* Modal configuration société */}
      <Modal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        title="Configuration des informations société"
        size="xl"
      >
        <CompanyInfoExtractor />
      </Modal>

      {/* Modal choix d'options */}
      <DevisOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onSelectOption={handleOptionSelect}
      />

      {/* Flux Template Selector */}
      {currentFlow === 'template' && (
        <Modal
          isOpen={true}
          onClose={handleBackToOptions}
          title=""
          size="xl"
        >
          <TemplateSelector
            onTemplateSelected={handleTemplateSelected}
            onBack={handleBackToOptions}
          />
        </Modal>
      )}

      {/* Flux Custom Template Creator */}
      {currentFlow === 'custom' && (
        <Modal
          isOpen={true}
          onClose={handleBackToOptions}
          title=""
          size="xl"
        >
          <CustomTemplateCreator
            onTemplateCreated={handleCustomTemplateCreated}
            onBack={handleBackToOptions}
          />
        </Modal>
      )}
    </div>
  );
}