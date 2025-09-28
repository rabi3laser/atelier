import type { CompanyFormData, FieldValidation, CompanyFormErrors } from '../types/company';

// Regex patterns pour le Maroc
export const moroccanPatterns = {
  phone: /^(?:\+212|0)[5-8]\d{8}$/,
  ice: /^\d{15}$/,
  rc: /^(?:\d{1,7}\/\d{4}|[A-Za-zÀ-ÖØ-öø-ÿ\s-]+ \d{1,8})$/,
  if: /^\d{6,9}$/,
  patente: /^\d{5,9}$/,
  tva: /^MA\d{9,12}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  website: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/
};

// Normalisation téléphone marocain
export const normalizeMoroccoPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  // Si commence par 0 (format local)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+212${cleaned.slice(1)}`;
  }
  
  // Si commence par 212 (sans +)
  if (cleaned.startsWith('212') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // Si déjà au bon format
  if (value.startsWith('+212') && cleaned.length === 12) {
    return value;
  }
  
  return value; // Retourner tel quel si format non reconnu
};

// Conversion en title case
export const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Validation d'un champ spécifique
export const validateField = (field: string, value: string | number): FieldValidation => {
  const stringValue = String(value || '').trim();
  
  switch (field) {
    case 'company_name':
      if (!stringValue) return { isValid: false, error: 'Nom obligatoire' };
      if (stringValue.length < 3) return { isValid: false, error: 'Minimum 3 caractères' };
      return { isValid: true };
    
    case 'address':
      if (!stringValue) return { isValid: false, error: 'Adresse obligatoire' };
      if (stringValue.length < 10) return { isValid: false, error: 'Minimum 10 caractères' };
      return { isValid: true };
    
    case 'phones':
      const phones = Array.isArray(value) ? value : [value].filter(Boolean);
      if (phones.length === 0) return { isValid: false, error: 'Au moins un téléphone obligatoire' };
      
      for (const phone of phones) {
        const normalized = normalizeMoroccoPhone(phone);
        if (!moroccanPatterns.phone.test(normalized)) {
          return { isValid: false, error: `Format invalide: ${phone}` };
        }
      }
      return { isValid: true };
    
    case 'emails':
      const emails = Array.isArray(value) ? value : [value].filter(Boolean);
      if (emails.length === 0) return { isValid: true }; // Facultatif
      
      for (const email of emails) {
        if (!moroccanPatterns.email.test(email)) {
          return { isValid: false, error: `Format invalide: ${email}` };
        }
      }
      return { isValid: true };
    
    case 'website':
      if (!stringValue) return { isValid: true }; // Facultatif
      if (!moroccanPatterns.website.test(stringValue)) {
        return { isValid: false, error: 'URL invalide (ex: https://site.ma)' };
      }
      return { isValid: true };
    
    case 'ice':
      if (!stringValue) return { isValid: false, error: 'ICE obligatoire' };
      if (!moroccanPatterns.ice.test(stringValue)) {
        return { isValid: false, error: 'ICE doit contenir exactement 15 chiffres' };
      }
      return { isValid: true };
    
    case 'rc':
      if (!stringValue) return { isValid: false, error: 'RC obligatoire' };
      if (!moroccanPatterns.rc.test(stringValue)) {
        return { isValid: false, error: 'Format: 123456/2024 ou Ville 123456' };
      }
      return { isValid: true };
    
    case 'if':
      if (!stringValue) return { isValid: false, error: 'IF obligatoire' };
      if (!moroccanPatterns.if.test(stringValue)) {
        return { isValid: false, error: 'IF doit contenir 6 à 9 chiffres' };
      }
      return { isValid: true };
    
    case 'patente':
      if (!stringValue) return { isValid: true }; // Facultatif
      if (!moroccanPatterns.patente.test(stringValue)) {
        return { isValid: false, error: 'Patente: 5 à 9 chiffres' };
      }
      return { isValid: true };
    
    case 'tva_number':
      if (!stringValue) return { isValid: true }; // Facultatif
      if (!moroccanPatterns.tva.test(stringValue)) {
        return { isValid: false, error: 'Format: MA + 9 à 12 chiffres' };
      }
      return { isValid: true };
    
    case 'legal_form':
      if (!stringValue) return { isValid: false, error: 'Forme juridique obligatoire' };
      return { isValid: true };
    
    case 'share_capital_mad':
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return { isValid: false, error: 'Capital doit être ≥ 0' };
      }
      return { isValid: true };
    
    default:
      return { isValid: true };
  }
};

// Validation complète du formulaire
export const validateCompanyForm = (data: CompanyFormData): { isValid: boolean; errors: CompanyFormErrors } => {
  const errors: CompanyFormErrors = {};
  
  // Validation tous les champs
  Object.entries(data).forEach(([key, value]) => {
    const validation = validateField(key, value);
    if (!validation.isValid) {
      errors[key as keyof CompanyFormErrors] = validation.error;
    }
  });
  
  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};

// Champs obligatoires
export const requiredFields = [
  'company_name',
  'address', 
  'phones',
  'ice',
  'rc',
  'legal_form'
];

// Vérifier si tous les champs obligatoires sont remplis
export const hasRequiredFields = (data: CompanyFormData): boolean => {
  return requiredFields.every(field => {
    const value = data[field as keyof CompanyFormData];
    return value && String(value).trim().length > 0;
  });
};