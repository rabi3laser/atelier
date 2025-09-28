import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, Star, Upload, FileType, Image } from 'lucide-react';
import { templateService, QuoteTemplate } from '../lib/templateService';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import Table from './Table';
import Modal from './Modal';
import TemplateUploader from './TemplateUploader';

export default function TemplateManager() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await templateService.setDefaultTemplate(templateId);
      loadTemplates(); // Recharger pour mettre à jour les statuts
    } catch (error) {
      console.error('Erreur lors de la définition du template par défaut:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      setIsDeleting(templateId);
      await templateService.deleteTemplate(templateId);
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadTemplates();
  };

  const previewTemplate = (template: QuoteTemplate) => {
    // Ouvrir aperçu du template HTML dans une nouvelle fenêtre
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu Template - ${template.name}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .template-preview { border: 1px solid #ccc; }
            </style>
          </head>
          <body>
            <h1>Aperçu: ${template.name}</h1>
            <div class="template-preview">
              ${template.html_template}
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      render: (value: string, row: QuoteTemplate) => (
        <div className="flex items-center space-x-3">
          {row.background_url ? (
            <Image size={16} className="text-blue-600" />
          ) : (
            <FileType size={16} className="text-gray-600" />
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Version {row.version}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'is_default',
      label: 'Statut',
      render: (value: boolean) => (
        <div className="flex items-center space-x-2">
          {value ? (
            <Badge variant="success">
              <Star size={12} className="mr-1" />
              Par défaut
            </Badge>
          ) : (
            <Badge variant="default">Standard</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: QuoteTemplate) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => previewTemplate(row)}
            title="Aperçu"
          >
            <Eye size={16} />
          </Button>
          {!row.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSetDefault(row.id)}
              title="Définir par défaut"
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Star size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            disabled={isDeleting === row.id}
            title="Supprimer"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement des templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates de devis</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des modèles personnalisés via workflows n8n
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus size={20} className="mr-2" />
          Nouveau template
        </Button>
      </div>

      {/* Informations sur l'intégration n8n */}
      <Card>
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Intégration n8n Template Ingestion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Les templates sont traités automatiquement par le workflow n8n pour générer 
              des modèles HTML optimisés pour la génération PDF.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>• Formats: PDF, PNG, JPG</span>
              <span>• Taille max: 10MB</span>
              <span>• Traitement automatique</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des templates */}
      <Card>
        <Table columns={columns} data={templates} />

        {templates.length === 0 && (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Aucun template personnalisé
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Uploadez votre premier modèle de devis pour commencer
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus size={16} className="mr-2" />
              Créer un template
            </Button>
          </div>
        )}
      </Card>

      {/* Modal upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Nouveau template de devis"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Workflow n8n Template Ingestion
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Votre fichier sera automatiquement traité par n8n pour créer un template HTML 
              optimisé avec zones de placement configurables.
            </p>
          </div>
          
          <TemplateUploader 
            onSuccess={handleUploadSuccess}
            onError={(error) => console.error('Erreur upload:', error)}
          />
        </div>
      </Modal>
    </div>
  );
}