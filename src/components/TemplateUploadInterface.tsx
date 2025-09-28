import React, { useState, useCallback } from 'react';
import { Upload, FileType, Image, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TemplateFile {
  fileName: string;
  mimeType: string;
  fileSize: string;
}

interface UploadResponse {
  success: boolean;
  template_id?: string;
  name?: string;
  background_url?: string;
  file_info?: TemplateFile;
  created_at?: string;
  message?: string;
  workflow_data?: {
    org_id: string;
    template_type: string;
    processing_successful: boolean;
  };
  error?: string;
}

interface TemplateUploadInterfaceProps {
  orgId?: string;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function TemplateUploadInterface({ 
  orgId = 'test123',
  onSuccess,
  onError,
  className = ''
}: TemplateUploadInterfaceProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  // Validation côté client
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Types supportés: PDF, PNG, JPG uniquement';
    }

    if (file.size > maxSize) {
      return 'Taille maximum: 10MB';
    }

    return null;
  }, []);

  const validateTemplateName = useCallback((name: string): string | null => {
    if (name.trim().length < 3) {
      return 'Nom minimum: 3 caractères';
    }
    return null;
  }, []);

  // Formatage taille fichier
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Gestion drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  // Sélection de fichier
  const handleFileSelection = useCallback((file: File) => {
    setValidationError('');
    setUploadResult(null);

    const fileError = validateFile(file);
    if (fileError) {
      setValidationError(fileError);
      return;
    }

    setSelectedFile(file);
    
    // Auto-remplir le nom si vide
    if (!templateName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTemplateName(nameWithoutExt);
    }
  }, [validateFile, templateName]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  // Upload vers n8n
  const uploadTemplate = async () => {
    if (!selectedFile) return;

    const nameError = validateTemplateName(templateName);
    if (nameError) {
      setValidationError(nameError);
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    setValidationError('');

    try {
      console.log('🚀 Début upload template vers n8n...');
      
      // Préparer les données selon le format n8n
      const requestData = {
        body: {
          org_id: orgId,
          name: templateName.trim(),
          file: {
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileSize: formatFileSize(selectedFile.size)
          }
        }
      };

      console.log('📊 Données envoyées:', requestData);

      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/template/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Statut réponse:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur de communication');
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result: UploadResponse = await response.json();
      console.log('✅ Réponse n8n:', result);

      setUploadResult(result);

      if (result.success) {
        console.log('🎉 Template créé avec succès:', result.template_id);
        onSuccess?.(result);
        
        // Sauvegarder dans localStorage pour utilisation immédiate
        if (result.background_url) {
          localStorage.setItem('devis_template_url', result.background_url);
          localStorage.setItem('devis_template_name', result.name || templateName);
          localStorage.setItem('devis_template_id', result.template_id || '');
        }
      } else {
        const errorMsg = result.error || 'Erreur lors du traitement du template';
        console.error('❌ Erreur workflow:', errorMsg);
        onError?.(errorMsg);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de connexion';
      console.error('❌ Erreur upload:', error);
      setUploadResult({
        success: false,
        error: errorMsg,
        message: 'Échec de l\'upload'
      });
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Retry upload
  const retryUpload = () => {
    setUploadResult(null);
    setValidationError('');
    uploadTemplate();
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setTemplateName('');
    setUploadResult(null);
    setValidationError('');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return FileType;
    if (mimeType.includes('image')) return Image;
    return FileType;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Zone d'upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : validationError
            ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              {React.createElement(getFileIcon(selectedFile.type), {
                size: 48,
                className: selectedFile.type.includes('pdf') ? 'text-red-500' : 'text-blue-500'
              })}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFile.type} • {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Changer de fichier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className={`h-12 w-12 mx-auto ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Déposez votre fichier ici' : 'Glissez votre template ici'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ou cliquez pour sélectionner un fichier
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <FileType size={16} />
                <span>PDF</span>
              </div>
              <div className="flex items-center space-x-1">
                <Image size={16} />
                <span>PNG, JPG</span>
              </div>
              <span>Max 10MB</span>
            </div>
            
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
              id="template-file-input"
            />
            <label htmlFor="template-file-input">
              <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
                Sélectionner un fichier
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Validation errors */}
      {validationError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{validationError}</span>
        </div>
      )}

      {/* Nom du template */}
      {selectedFile && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nom du template
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nom de votre template (min. 3 caractères)"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ce nom sera utilisé pour identifier votre template dans l'application
          </p>
        </div>
      )}

      {/* Boutons d'action */}
      {selectedFile && (
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={uploadTemplate}
            disabled={isUploading || !templateName.trim() || templateName.trim().length < 3}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                Traitement...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Créer le template
              </>
            )}
          </button>
        </div>
      )}

      {/* État de l'upload */}
      {isUploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-b-2 border-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Traitement par workflow n8n...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Conversion et optimisation du template en cours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résultat de l'upload */}
      {uploadResult && (
        <div className={`border rounded-lg p-4 ${
          uploadResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start space-x-3">
            {uploadResult.success ? (
              <CheckCircle size={20} className="text-green-500 mt-0.5" />
            ) : (
              <XCircle size={20} className="text-red-500 mt-0.5" />
            )}
            
            <div className="flex-1">
              <p className={`font-medium ${
                uploadResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {uploadResult.message || (uploadResult.success ? 'Template créé avec succès' : 'Erreur lors de la création')}
              </p>
              
              {uploadResult.success && uploadResult.template_id && (
                <div className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                  <div><strong>ID Template:</strong> {uploadResult.template_id}</div>
                  <div><strong>Nom:</strong> {uploadResult.name}</div>
                  {uploadResult.background_url && (
                    <div><strong>URL:</strong> 
                      <a 
                        href={uploadResult.background_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 underline hover:no-underline"
                      >
                        Voir le fichier
                      </a>
                    </div>
                  )}
                  {uploadResult.created_at && (
                    <div><strong>Créé le:</strong> {new Date(uploadResult.created_at).toLocaleString('fr-FR')}</div>
                  )}
                  {uploadResult.workflow_data && (
                    <div className="mt-2 p-2 bg-green-100 dark:bg-green-800/30 rounded text-xs">
                      <strong>Workflow:</strong> {uploadResult.workflow_data.template_type} 
                      {uploadResult.workflow_data.processing_successful && ' ✓'}
                    </div>
                  )}
                </div>
              )}
              
              {!uploadResult.success && uploadResult.error && (
                <div className="mt-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Erreur:</strong> {uploadResult.error}
                  </p>
                  <button
                    type="button"
                    onClick={retryUpload}
                    className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informations sur le workflow */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Workflow n8n Template Ingestion
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• Traitement automatique PDF/images vers template HTML</p>
          <p>• Génération zones de placement configurables</p>
          <p>• Stockage sécurisé dans Supabase Storage</p>
          <p>• Optimisation pour génération PDF rapide</p>
        </div>
        
        <div className="mt-3 flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-500 dark:text-gray-400">
            Endpoint: https://n8n.srv782553.hstgr.cloud/webhook/template/upload
          </span>
        </div>
      </div>
    </div>
  );
}