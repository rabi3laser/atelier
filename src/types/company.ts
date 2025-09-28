// Types pour les scores de confiance (compatibilité)
export interface ConfidenceScores {
  nom_entreprise?: number;
  adresse?: number;
  telephones?: number;
  emails?: number;
  website?: number;
  ice?: number;
  rc?: number;
  forme_juridique?: number;
  capital_social?: number;
}

// Types pour le formulaire
export interface CompanyFormData {
  company_name: string;
  address: string;
  phones: string[];
  emails: string[];
  website?: string;
  ice: string;
  rc: string;
  legal_form: 'SARL' | 'SA' | 'SAS' | 'SASU' | 'EURL' | 'SNC' | 'Auto-entrepreneur';
  share_capital_mad?: number;
}

export interface CompanyFormErrors {
  company_name?: string;
  address?: string;
  phones?: string;
  emails?: string;
  website?: string;
  ice?: string;
  rc?: string;
  legal_form?: string;
  share_capital_mad?: string;
}

// Types pour validation fichier
export interface FileValidation {
  valid: boolean;
  error?: string;
  size?: string;
}