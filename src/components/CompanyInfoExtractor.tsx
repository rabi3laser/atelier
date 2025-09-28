import React, { useState } from 'react';
import { 
  Building2, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Info,
  Phone,
  Mail,
  Globe,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyForm } from '../hooks/useCompanyForm';
import type { ExtractionResponse, Values } from '../types/extraction';
import type { CompanyFormData, ConfidenceScores } from '../types/company';
import { extractFromPdf, saveExtraction } from '../services/extraction';
import Button from './Button';
import FormRow from './FormRow';
import Card from './Card';

export default function CompanyInfoExtractor() {
  const {
    formData,
    errors,
    confidenceScores,
    canSubmit,
    isSubmitting,
    updateField,
    addPhone,
    removePhone,
    updatePhone,
    addEmail,
    removeEmail,
    updateEmail,
    loadExtractedData,
    onSubmit,
  } = useCompanyForm({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);

  // Validation fichier PDF
  const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
    const maxBytes = 10 * 1024 * 1024; // 10MB
    
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Seuls les fichiers PDF sont acceptés' };
    }
    
    if (file.size > maxBytes) {
      return { valid: false, error: 'Fichier trop volumineux (max 10MB)' };
    }
    
    return { valid: true };
  };

  // Conversion en base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Formatage taille fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Gestion upload PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePdfFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    toast.success(`PDF sélectionné: ${file.name}`);
  };

  // Analyse OCR du PDF
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Générer request_id unique
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convertir le PDF en base64
      const pdfBase64 = await toBase64(selectedFile);
      
      console.log('🚀 Envoi vers company-intake...');
      
      const result = await extractFromPdf({
        request_id: requestId,
        org_id: 'test123',
        pdf_example_base64: pdfBase64,
      });

      console.log('✅ Réponse workflow:', result);
      setExtractionResult(result);
      
      // TOUJOURS afficher le formulaire après analyse
      setHasAnalyzed(true);
      
      // Adapter à la structure EXACTE retournée par votre workflow
      let extractedData: Partial<CompanyFormData> = {};
      let confidenceScores: ConfidenceScores = {};
      
      // Traiter la structure EXACTE de votre workflow
      if (result && typeof result === 'object' && 'field_validations' in result) {
        console.log('📊 Traitement structure workflow réelle...');
        
        // Structure EXACTE de votre workflow
        const validations = result.field_validations || {};
        const confidences = result.confidence_scores || {};
        
        console.log('🔍 Validations reçues:', validations);
        console.log('🎯 Scores de confiance reçus:', confidences);
        
        // Mapping EXACT selon la structure réelle du workflow
        
        // Nom entreprise
        if (validations.nom_entreprise?.status === 'found') {
          extractedData.company_name = validations.nom_entreprise.normalized;
          confidenceScores.nom_entreprise = confidences.nom_entreprise;
        }
        
        // Adresse
        if (validations.adresse?.status === 'found') {
          extractedData.address = validations.adresse.normalized;
          confidenceScores.adresse = confidences.adresse;
        }
        
        // Téléphones - STRUCTURE EXACTE DU WORKFLOW
        if (validations.telephones?.status === 'found' && validations.telephones.normalized) {
          // Le workflow retourne un tableau avec normalized[0], normalized[1], etc.
          const phones = [];
          if (validations.telephones.normalized[0]) phones.push(validations.telephones.normalized[0]);
          if (validations.telephones.normalized[1]) phones.push(validations.telephones.normalized[1]);
          
          extractedData.phones = phones.length > 0 ? phones : [''];
          confidenceScores.telephones = confidences.telephones;
          console.log('✅ Téléphones extraits:', phones);
        } else {
          extractedData.phones = [''];
        }
        
        // Emails - même structure que téléphones
        if (validations.emails?.status === 'found' && validations.emails.normalized) {
          const emails = [];
          if (validations.emails.normalized[0]) emails.push(validations.emails.normalized[0]);
          if (validations.emails.normalized[1]) emails.push(validations.emails.normalized[1]);
          
          extractedData.emails = emails.length > 0 ? emails : [''];
          confidenceScores.emails = confidences.emails;
          console.log('✅ Emails extraits:', emails);
        } else {
          extractedData.emails = [''];
        }
        
        // Website
        if (validations.website?.status === 'found' && validations.website.normalized) {
          extractedData.website = validations.website.normalized;
          confidenceScores.website = confidences.website;
        }
        
        // ICE - STRUCTURE EXACTE
        if (validations.ice?.status === 'found') {
          extractedData.ice = validations.ice.normalized;
          confidenceScores.ice = confidences.ice;
          console.log('✅ ICE extrait:', validations.ice.normalized);
        }
        
        // RC - STRUCTURE EXACTE  
        if (validations.rc?.status === 'found') {
          extractedData.rc = validations.rc.normalized;
          confidenceScores.rc = confidences.rc;
          console.log('✅ RC extrait:', validations.rc.normalized);
        }
        
        // IF - NOUVEAU CHAMP AJOUTÉ
        if (validations.if?.status === 'found') {
          // Le formulaire n'a pas de champ IF, on l'ajoute dans les notes ou on l'ignore
          console.log('✅ IF extrait (non mappé dans le formulaire):', validations.if.normalized);
        }
        
        // Numéro TVA - NOUVEAU CHAMP
        if (validations.numero_tva?.status === 'found') {
          // Le formulaire n'a pas ce champ, on l'ignore pour l'instant
          console.log('✅ Numéro TVA extrait (non mappé):', validations.numero_tva.normalized);
        }
        
        // Forme juridique
        if (validations.forme_juridique?.status === 'found') {
          extractedData.legal_form = validations.forme_juridique.normalized as any;
          confidenceScores.forme_juridique = confidences.forme_juridique;
        }
        
        // Capital social
        if (validations.capital_social?.status === 'found') {
          extractedData.share_capital_mad = validations.capital_social.normalized;
          confidenceScores.capital_social = confidences.capital_social;
          console.log('✅ Capital social extrait:', validations.capital_social.normalized);
        }
        
        console.log('📊 DONNÉES FINALES EXTRAITES:', extractedData);
        console.log('🎯 SCORES FINAUX:', confidenceScores);
        
        if (Object.keys(extractedData).length > 0) {
          loadExtractedData(extractedData, confidenceScores);
          
          const extractedCount = result.summary?.extracted_count || Object.keys(extractedData).length;
          const totalFields = result.summary?.total_fields || 11;
          
          toast.success(`Informations extraites avec succès! (${extractedCount} champs trouvés sur ${totalFields})`);
        } else {
          toast.warning('Aucune information extraite automatiquement. Remplissez manuellement les informations ci-dessous.');
        }
      } else {
        // Fallback si structure différente
        console.warn('⚠️ Structure workflow non reconnue:', result);
        toast.warning('Structure de réponse inattendue du workflow. Remplissez manuellement les informations.');
      }
      
    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      
      // TOUJOURS afficher le formulaire même en cas d'erreur
      setHasAnalyzed(true);
      
      // Message d'erreur mais permet la saisie manuelle
      const isDevelopmentError = (error as Error).message.includes('Failed to fetch') && 
                                (window.location.hostname === 'localhost' || 
                                 window.location.hostname.includes('webcontainer-api.io'));
      
      if (isDevelopmentError) {
        toast.warning('Impossible de contacter le workflow en développement. Remplissez manuellement les informations ci-dessous.');
      } else {
        toast.warning(`Erreur d'analyse: ${(error as Error).message}. Vous pouvez remplir manuellement le formulaire.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirmation et sauvegarde finale
  const handleConfirm = async (data: CompanyFormData) => {
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Sauvegarder dans la table organizations
      const { error: orgError } = await supabase
        .from('organizations')
        .upsert({
          id: 'test123',
          name: data.company_name,
          address: data.address,
          phone: data.phones[0] || '',
          email: data.emails[0] || '',
          website: data.website,
          forme_juridique: data.legal_form,
          capital_social: data.share_capital_mad,
          settings: {
            ice: data.ice,
            rc: data.rc,
            phones: data.phones,
            emails: data.emails,
          },
          updated_at: new Date().toISOString(),
        });

      if (orgError) {
        console.error('❌ Erreur sauvegarde organization:', orgError);
        throw new Error('Erreur lors de la sauvegarde');
      }

      console.log('✅ Informations société sauvegardées');
      toast.success('Configuration société terminée avec succès !');
      
      // Reset du formulaire
      setHasAnalyzed(false);
      setSelectedFile(null);
      setExtractionResult(null);
      
    } catch (error) {
      console.error('❌ Erreur confirmation:', error);
      throw error;
    }
  };

  // Badge de confiance
  const getConfidenceBadge = (field: string) => {
    const confidence = confidenceScores[field as keyof ConfidenceScores];
    if (confidence === undefined) return null;
    
    let variant = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    let label = 'Non évalué';
    
    if (confidence >= 0.8) {
      variant = 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      label = `Haute (${Math.round(confidence * 100)}%)`;
    } else if (confidence >= 0.5) {
      variant = 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      label = `Moyenne (${Math.round(confidence * 100)}%)`;
    } else {
      variant = 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      label = `Faible (${Math.round(confidence * 100)}%)`;
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variant}`}>
        {label}
      </span>
    );
  };

  // Icône de validation
  const getValidationIcon = (field: string) => {
    const error = errors[field as keyof typeof errors];
    if (error) {
      return <XCircle className="w-4 h-4 text-red-500" title={error} />;
    }
    
    const value = formData[field as keyof CompanyFormData];
    if (value && (Array.isArray(value) ? value.length > 0 : String(value).trim())) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuration des informations société
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Uploadez un PDF de devis existant pour extraire automatiquement les informations de votre entreprise.
        </p>
      </div>

      {/* Étape 1: Upload PDF */}
      {!hasAnalyzed && (
        <Card title="1. Upload du PDF devis exemple">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Workflow company-intake</p>
                  <p>Sélectionnez un PDF de devis existant contenant les informations de votre entreprise. Le workflow extraira automatiquement :</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Nom de l'entreprise</li>
                    <li>• Adresse complète</li>
                    <li>• Téléphones et emails</li>
                    <li>• ICE, RC, forme juridique</li>
                    <li>• Capital social</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Zone d'upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={isAnalyzing}
              />
              
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un PDF'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedFile 
                    ? `${formatFileSize(selectedFile.size)} • ${selectedFile.type}`
                    : 'PDF uniquement, maximum 10MB'
                  }
                </p>
              </label>
            </div>

            {/* Bouton analyser */}
            <div className="text-center">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                size="lg"
                className="px-8"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyse OCR en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Analyser le PDF
                  </>
                )}
              </Button>
            </div>

            {isAnalyzing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Extraction des informations en cours...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Workflow company-intake en cours d'exécution (30-90 secondes)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Résultat de l'extraction */}
      {extractionResult && (
        <Card title="Résultat de l'extraction">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {extractionResult.processing_stage === 'READY_FOR_REVIEW' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Stage: {extractionResult.processing_stage}
                </p>
                {"error" in extractionResult && extractionResult.error ? (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {extractionResult.error}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Extraction partielle - Complétez manuellement les champs manquants
                  </p>
                )}
              </div>
            </div>

            {extractionResult.extraction_summary && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Extraction:</strong> {extractionResult.extraction_summary.extracted_count} champs trouvés sur {extractionResult.extraction_summary.total_fields}
                  {extractionResult.extraction_summary.extraction_rate && (
                    <span className="ml-2">({Math.round(extractionResult.extraction_summary.extraction_rate * 100)}%)</span>
                  )}
                </p>
                {extractionResult.extraction_summary.keys_found && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Trouvés: {extractionResult.extraction_summary.keys_found.join(', ')}
                  </p>
                )}
              </div>
            )}

            {extractionResult.errors && extractionResult.errors.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">Avertissements :</p>
                <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  {extractionResult.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              2. Vérification et confirmation
            </h2>
            <Button
              variant="secondary"
              onClick={() => {
                setHasAnalyzed(false);
                setExtractionResult(null);
              }}
              size="sm"
            >
              Analyser un autre PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations essentielles */}
            <Card title="Informations essentielles">
              <div className="space-y-4">
                <FormRow label="Nom de l'entreprise" required>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => updateField('company_name', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                          errors.company_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Nom de votre entreprise"
                      />
                      {getValidationIcon('company_name')}
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.company_name && (
                        <span className="text-xs text-red-600 dark:text-red-400">{errors.company_name}</span>
                      )}
                      {getConfidenceBadge('nom_entreprise')}
                    </div>
                  </div>
                </FormRow>

                <FormRow label="Adresse complète" required>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-2" />
                      <textarea
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        rows={3}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                          errors.address ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Adresse complète de votre entreprise"
                      />
                      <div className="mt-2">
                        {getValidationIcon('address')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.address && (
                        <span className="text-xs text-red-600 dark:text-red-400">{errors.address}</span>
                      )}
                      {getConfidenceBadge('adresse')}
                    </div>
                  </div>
                </FormRow>

                <FormRow label="Téléphone(s)" required>
                  <div className="space-y-3">
                    {formData.phones.map((phone, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => updatePhone(index, e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                            errors.phones ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="+212612345678"
                        />
                        {formData.phones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhone(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        )}
                        {index === 0 && getValidationIcon('phones')}
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addPhone}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Ajouter un téléphone
                      </Button>
                      {getConfidenceBadge('telephones')}
                    </div>
                    {errors.phones && (
                      <span className="text-xs text-red-600 dark:text-red-400">{errors.phones}</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Format marocain: +212XXXXXXXXX ou 0XXXXXXXXX
                    </span>
                  </div>
                </FormRow>

                <FormRow label="Email(s)">
                  <div className="space-y-3">
                    {formData.emails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                            errors.emails ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="contact@votre-entreprise.ma"
                        />
                        {formData.emails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        )}
                        {index === 0 && getValidationIcon('emails')}
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addEmail}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        + Ajouter un email
                      </Button>
                      {getConfidenceBadge('emails')}
                    </div>
                    {errors.emails && (
                      <span className="text-xs text-red-600 dark:text-red-400">{errors.emails}</span>
                    )}
                  </div>
                </FormRow>

                <FormRow label="Site web">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => updateField('website', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                          errors.website ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="https://www.votre-entreprise.ma"
                      />
                      {getValidationIcon('website')}
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.website ? (
                        <span className="text-xs text-red-600 dark:text-red-400">{errors.website}</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Facultatif</span>
                      )}
                      {getConfidenceBadge('website')}
                    </div>
                  </div>
                </FormRow>
              </div>
            </Card>

            {/* Informations légales */}
            <Card title="Informations légales (Maroc)">
              <div className="space-y-4">
                <FormRow label="ICE" required>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.ice}
                        onChange={(e) => updateField('ice', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                          errors.ice ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="123456789012345"
                        maxLength={15}
                      />
                      {getValidationIcon('ice')}
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.ice ? (
                        <span className="text-xs text-red-600 dark:text-red-400">{errors.ice}</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Identifiant Commun Entreprise (15 chiffres)
                        </span>
                      )}
                      {getConfidenceBadge('ice')}
                    </div>
                  </div>
                </FormRow>

                <FormRow label="RC" required>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.rc}
                        onChange={(e) => updateField('rc', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                          errors.rc ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Casablanca 98765 ou 27441/14"
                      />
                      {getValidationIcon('rc')}
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.rc ? (
                        <span className="text-xs text-red-600 dark:text-red-400">{errors.rc}</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Registre de Commerce
                        </span>
                      )}
                      {getConfidenceBadge('rc')}
                    </div>
                  </div>
                </FormRow>

                <FormRow label="Forme juridique" required>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.legal_form}
                        onChange={(e) => updateField('legal_form', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="SARL">SARL</option>
                        <option value="SA">SA</option>
                        <option value="SAS">SAS</option>
                        <option value="SASU">SASU</option>
                        <option value="EURL">EURL</option>
                        <option value="SNC">SNC</option>
                        <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                      </select>
                      {getValidationIcon('legal_form')}
                    </div>
                    <div className="flex items-center justify-end">
                      {getConfidenceBadge('forme_juridique')}
                    </div>
                  </div>
                </FormRow>

                <FormRow label="Capital social (MAD)">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={formData.share_capital_mad || ''}
                        onChange={(e) => updateField('share_capital_mad', parseInt(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        placeholder="500000"
                        min="0"
                        step="1000"
                      />
                      {getValidationIcon('share_capital_mad')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Facultatif (en dirhams) {formData.share_capital_mad ? `• ${new Intl.NumberFormat('fr-MA').format(formData.share_capital_mad)} MAD` : ''}
                      </span>
                      {getConfidenceBadge('capital_social')}
                    </div>
                  </div>
                </FormRow>
              </div>
            </Card>
          </div>

          {/* Résumé et validation */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Prêt pour la sauvegarde
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {canSubmit ? 
                    'Toutes les informations obligatoires sont remplies' : 
                    'Veuillez remplir tous les champs obligatoires'
                  }
                </p>
              </div>
              
              <Button
                onClick={() => onSubmit(handleConfirm)}
                disabled={!canSubmit}
                size="lg"
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmer et Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </Card>
        </Card>
      )}
    </div>
  );
}