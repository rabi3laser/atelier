import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { CompanyFormData, CompanyFormErrors, ConfidenceScores } from '../types/company';
import { 
  validateCompanyForm, 
  hasRequiredFields, 
  normalizeMoroccoPhone,
  toTitleCase 
} from '../lib/companyValidation';

export const useCompanyForm = (initialData?: Partial<CompanyFormData>) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: '',
    company_name: initialData?.company_name || '',
    phones: [''],
    emails: [''],
    email: initialData?.email || '',
    ice: initialData?.ice || '',
    rc: initialData?.rc || '',
    patente: initialData?.patente || '',
    legal_form: initialData?.legal_form || 'SARL',
    share_capital_mad: initialData?.share_capital_mad || 0,
  });

  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScores>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation en temps réel
  useEffect(() => {
    const { errors: validationErrors } = validateCompanyForm(formData);
    setErrors(validationErrors);
  }, [formData]);

  // Mise à jour d'un champ
  const updateField = (field: string, value: string | number | string[]) => {
    setFormData(prev => {
      // Normalisation automatique
      let normalizedValue = value;
      
      if (typeof value === 'string' && !Array.isArray(value)) {
        // Trim et collapse spaces
        normalizedValue = value.trim().replace(/\s+/g, ' ');
        
        // Normalisation spécifique par champ
        if (field === 'phones') {
          normalizedValue = normalizeMoroccoPhone(normalizedValue);
        } else if (field === 'company_name') {
          normalizedValue = toTitleCase(normalizedValue);
        }
      }
      
      return {
        ...prev,
        [field]: normalizedValue,
      };
    });
  };

  // Ajouter un téléphone
  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, ''],
    }));
  };

  // Supprimer un téléphone
  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      setFormData(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }));
    }
  };

  // Mettre à jour un téléphone spécifique
  const updatePhone = (index: number, value: string) => {
    const normalized = normalizeMoroccoPhone(value.trim());
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.map((phone, i) => i === index ? normalized : phone),
    }));
  };

  // Ajouter un email
  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, ''],
    }));
  };

  // Supprimer un email
  const removeEmail = (index: number) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index),
      }));
    }
  };

  // Mettre à jour un email spécifique
  const updateEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value.trim() : email),
    }));
  };

  // Charger données extraites (après OCR)
  const loadExtractedData = (extractedData: Partial<CompanyFormData>, scores?: ConfidenceScores) => {
    // Convertir les données extraites pour supporter les tableaux
    const processedData = { ...extractedData };
    
    // Si phone est une string, la convertir en tableau
    if (typeof extractedData.phone === 'string') {
      processedData.phones = [extractedData.phone];
      delete (processedData as any).phone;
    }
    
    // Si email est une string, la convertir en tableau
    if (typeof extractedData.email === 'string') {
      processedData.emails = [extractedData.email];
      delete (processedData as any).email;
    }
    
    setFormData(prev => ({
      ...prev,
      ...processedData,
    }));
    
    if (scores) {
      setConfidenceScores(scores);
    }
    
    toast.success('Informations extraites automatiquement !');
  };

  // Soumission du formulaire
  const onSubmit = async (submitHandler: (data: CompanyFormData) => Promise<void>) => {
    const { isValid, errors: validationErrors } = validateCompanyForm(formData);
    
    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    if (!hasRequiredFields(formData)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await submitHandler(formData);
      toast.success('Informations sauvegardées avec succès !');
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset du formulaire
  const resetForm = () => {
    setFormData({
      company_name: '',
      company_name: initialData?.company_name || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      ice: initialData?.ice || '',
      rc: initialData?.rc || '',
      patente: initialData?.patente || '',
      legal_form: initialData?.legal_form || 'SARL',
      share_capital_mad: initialData?.share_capital_mad || 0,
    });
    setErrors({});
    setConfidenceScores({});
  };

  // État de validation
  const { isValid } = validateCompanyForm(formData);
  const canSubmit = isValid && hasRequiredFields(formData) && !isSubmitting;

  return {
    formData,
    errors,
    confidenceScores,
    isValid,
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
    resetForm,
    setConfidenceScores,
  };
};