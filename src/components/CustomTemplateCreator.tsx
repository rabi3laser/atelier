import React, { useState } from 'react';
import { Upload, FileType, Image, ArrowLeft, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Button from './Button';
import Card from './Card';
import CompanyInfoExtractor from './CompanyInfoExtractor';

interface CustomTemplateCreatorProps {
  onTemplateCreated: (templateId: string) => void;
  onBack: () => void;
}

export default function CustomTemplateCreator({ onTemplateCreated, onBack }: CustomTemplateCreatorProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'configure'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<{
    pdf?: File;
    logo?: File;
    template?: File;
  }>({});
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (type: 'pdf' | 'logo' | 'template', file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`${type === 'pdf' ? 'PDF exemple' : type === 'logo' ? 'Logo' : 'Template'} ajouté`);
  };

  const validateFile = (file: File, type: 'pdf' | 'logo' | 'template'): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      return 'Fichier trop volumineux (max 10MB)';
    }

    if (type === 'pdf' && file.type !== 'application/pdf') {
      return 'Le fichier doit être un PDF';
    }

    if (type !== 'pdf' && !file.type.startsWith('image/')) {
      return 'Le fichier doit être une image (PNG, JPG, etc.)';
    }

    return null;
  };

  const handleFileChange = (type: 'pdf' | 'logo' | 'template') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, type);
    if (error) {
      toast.error(error);
      return;
    }

    handleFileUpload(type, file);
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processFiles = async () => {
    if (!uploadedFiles.pdf) {
      toast.error('Le PDF exemple est obligatoire');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('extract');

    try {
      // Convertir les fichiers en base64
      const pdfBase64 = await toBase64(uploadedFiles.pdf);
      const logoBase64 = uploadedFiles.logo ? await toBase64(uploadedFiles.logo) : '';
      const templateBase64 = uploadedFiles.template ? await toBase64(uploadedFiles.template) : '';

      // Appeler le workflow Company Extractor
      const webhookPayload = {
        org_id: 'test123',
        pdf_base64: pdfBase64,
        logo_base64: logoBase64,
        tempo_image_base64: templateBase64,
        current_data: {
          company_name: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          ice: '',
          rc: '',
          if: '',
          forme_juridique: 'SARL',
          capital_social: 0,
        }
      };

      console.log('🚀 Envoi vers company-extractor...');
      
      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/company-extractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur de communication');
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Réponse company-extractor:', result);

      setExtractionResult(result);
      
      if (result.success) {
        toast.success('Informations extraites avec succès !');
        setCurrentStep('configure');
      } else {
        toast.error(result.error || 'Erreur lors de l\'extraction');
      }

    } catch (error) {
      console.error('❌ Erreur traitement:', error);
      toast.error('Erreur lors du traitement des fichiers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateCreated = (templateId: string) => {
    toast.success('Template personnalisé créé avec succès !');
    onTemplateCreated(templateId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileUploadCard = ({ 
    type, 
    title, 
    description, 
    accept, 
    required = false,
    icon: Icon 
  }: {
    type: 'pdf' | 'logo' | 'template';
    title: string;
    description: string;
    accept: string;
    required?: boolean;
    icon: React.ComponentType<any>;
  }) => {
    const file = uploadedFiles[type];
    
    return (
      <Card className={`${file ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Icon className={`w-6 h-6 ${file ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          </div>

          {file ? (
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">{file.name}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {file.type} • {formatFileSize(file.size)}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange(type)}
                className="hidden"
                id={`upload-${type}`}
              />
              <label htmlFor={`upload-${type}`} className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Cliquer pour sélectionner
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {accept} • Max 10MB
                </p>
              </label>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Étapes */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'upload' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'upload' ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
          <span>1. Upload fichiers</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'extract' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          currentStep === 'configure' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'extract' ? 'bg-blue-500' : 
            currentStep === 'configure' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span>2. Extraction</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          currentStep === 'configure' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 'configure' ? 'bg-blue-500' : 'bg-gray-400'
          }`}></div>
          <span>3. Configuration</span>
        </div>
      </div>

      {currentStep === 'upload' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Créer un template personnalisé
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Uploadez vos fichiers pour créer un template unique
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Intelligence Artificielle Intégrée
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Notre système analysera automatiquement votre PDF exemple pour détecter votre logo, 
                  extraire vos informations d'entreprise et créer un template personnalisé.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FileUploadCard
              type="pdf"
              title="PDF Exemple"
              description="Un devis existant de votre entreprise"
              accept=".pdf"
              required
              icon={FileType}
            />
            
            <FileUploadCard
              type="logo"
              title="Logo (Optionnel)"
              description="Logo haute qualité de votre entreprise"
              accept="image/*"
              icon={Image}
            />
            
            <FileUploadCard
              type="template"
              title="Template (Optionnel)"
              description="Image de votre modèle de devis"
              accept="image/*"
              icon={Image}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={processFiles}
              disabled={!uploadedFiles.pdf || isProcessing}
              className="px-6"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Analyser et Créer
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'extract' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Extraction en cours...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Notre IA analyse votre document et extrait les informations
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Analyse OCR en cours...
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Extraction du logo, des informations d'entreprise et création du template
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'configure' && extractionResult && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setCurrentStep('upload')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vérifiez les informations extraites
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Confirmez et ajustez les informations détectées
              </p>
            </div>
          </div>

          {extractionResult.success ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Extraction réussie !
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {extractionResult.database_updated?.fields_extracted || 0} champs extraits automatiquement
                  </p>
                </div>
              </div>

              {extractionResult.extracted_info && (
                <Card title="Informations extraites">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Entreprise</h4>
                      <div className="space-y-1 text-gray-600 dark:text-gray-400">
                        <div><strong>Nom:</strong> {extractionResult.extracted_info.company_name || 'Non détecté'}</div>
                        <div><strong>Adresse:</strong> {extractionResult.extracted_info.address || 'Non détectée'}</div>
                        <div><strong>Téléphone:</strong> {extractionResult.extracted_info.phone || 'Non détecté'}</div>
                        <div><strong>Email:</strong> {extractionResult.extracted_info.email || 'Non détecté'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations légales</h4>
                      <div className="space-y-1 text-gray-600 dark:text-gray-400">
                        <div><strong>ICE:</strong> {extractionResult.extracted_info.ice || 'Non détecté'}</div>
                        <div><strong>RC:</strong> {extractionResult.extracted_info.rc || 'Non détecté'}</div>
                        <div><strong>IF:</strong> {extractionResult.extracted_info.if || 'Non détecté'}</div>
                        <div><strong>Forme:</strong> {extractionResult.extracted_info.forme_juridique || 'Non détectée'}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {extractionResult.assets_saved && (
                <Card title="Assets sauvegardés">
                  <div className="space-y-3">
                    {extractionResult.assets_saved.logo_url && (
                      <div className="flex items-center space-x-3">
                        <Image className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Logo détecté et sauvegardé</p>
                          <a 
                            href={extractionResult.assets_saved.logo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Voir le logo
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {extractionResult.assets_saved.template_url && (
                      <div className="flex items-center space-x-3">
                        <FileType className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Template créé</p>
                          <a 
                            href={extractionResult.assets_saved.template_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 underline"
                          >
                            Voir le template
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleTemplateCreated(extractionResult.assets_saved?.template_id || 'new-template')}
                  className="px-6"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Utiliser ce template
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Extraction partielle ou échouée
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {extractionResult.error || 'Certaines informations n\'ont pas pu être extraites'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep('upload')}>
                  <ArrowLeft size={16} className="mr-2" />
                  Essayer d'autres fichiers
                </Button>
                <Button onClick={() => handleTemplateCreated('fallback-template')}>
                  Continuer quand même
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}