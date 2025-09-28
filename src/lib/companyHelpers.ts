// Helpers pour la configuration société

export const rx = {
  ice: /^\d{15}$/,
  rc: /^\d+\/\d{1,4}$/,
  if: /^\d{7,8}$/,
  tva: /^MA\d{8,9}$/,
  phoneMA: /^(?:\+212[5-7]\d{8}|0[5-7]\d{8})$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  website: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i,
};

// Génération et persistance du request_id
export const getOrCreateRequestId = (): string => {
  const k = 'company:request_id';
  const existing = localStorage.getItem(k);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(k, id);
  return id;
};

// Clés de cache React Query
export const intakeKey = (requestId: string) =>
  ['company-intake', requestId] as const;

export const confirmKey = (requestId: string) =>
  ['company-confirm', requestId] as const;

// Normalisation téléphone marocain vers E.164
export const normalizePhoneMA = (raw: string): string => {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 10) return `+212${d.slice(1)}`;
  if (d.startsWith('212') && d.length === 12) return `+${d}`;
  if (raw.startsWith('+212') && raw.length === 13) return raw;
  return raw; // sinon, laisse tel quel et mets warning
};

// Validation fichier
export const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
  const maxBytes = 10 * 1024 * 1024; // 10MB
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Seuls les fichiers PDF sont acceptés' };
  }
  
  if (file.size > maxBytes) {
    return { valid: false, error: 'Fichier trop volumineux (max 10MB)' };
  }
  
  return { valid: true };
};

// Conversion fichier vers base64
export const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Formatage taille fichier
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Badge de confiance
export const getConfidenceBadge = (confidence?: number) => {
  if (confidence === undefined) {
    return { color: 'bg-slate-500/15 text-slate-400', label: 'Non évalué' };
  }
  
  if (confidence >= 0.8) {
    return { color: 'bg-green-500/15 text-green-500', label: 'Haute confiance' };
  }
  
  if (confidence >= 0.5) {
    return { color: 'bg-amber-500/15 text-amber-500', label: 'Confiance moyenne' };
  }
  
  return { color: 'bg-rose-500/15 text-rose-500', label: 'Faible confiance' };
};

// Validation des champs
export const validateCompanyField = (field: keyof CompanyForm, value: string): ValidationState => {
  switch (field) {
    case 'ice':
      if (!value) return { status: 'valid' };
      return rx.ice.test(value) 
        ? { status: 'valid' } 
        : { status: 'error', message: 'ICE doit contenir exactement 15 chiffres' };
    
    case 'rc':
      if (!value) return { status: 'valid' };
      return rx.rc.test(value)
        ? { status: 'valid' }
        : { status: 'error', message: 'RC format attendu: nombre/année (ex: 27441/14)' };
    
    case 'if':
      if (!value) return { status: 'valid' };
      return rx.if.test(value)
        ? { status: 'valid' }
        : { status: 'error', message: 'IF doit contenir 7 ou 8 chiffres' };
    
    case 'telephone':
      if (!value) return { status: 'error', message: 'Téléphone obligatoire' };
      const normalized = normalizePhoneMA(value);
      return rx.phoneMA.test(normalized)
        ? { status: 'valid', normalized }
        : { status: 'warning', message: 'Format téléphone non reconnu (attendu: +212XXXXXXXX ou 0XXXXXXXX)' };
    
    case 'email':
      if (!value) return { status: 'error', message: 'Email obligatoire' };
      return rx.email.test(value)
        ? { status: 'valid' }
        : { status: 'error', message: 'Format email invalide' };
    
    case 'numero_tva':
      if (!value) return { status: 'valid' };
      return rx.tva.test(value)
        ? { status: 'valid' }
        : { status: 'warning', message: 'Format TVA attendu: MAXXXXXXXXX' };
    
    case 'website':
      if (!value) return { status: 'valid' };
      return rx.website.test(value)
        ? { status: 'valid' }
        : { status: 'warning', message: 'Format URL non reconnu' };
    
    case 'nom_entreprise':
    case 'adresse':
      return !value 
        ? { status: 'error', message: 'Champ obligatoire' }
        : { status: 'valid' };
    
    default:
      return { status: 'valid' };
  }
};

export type ValidationState = {
  status: 'valid' | 'warning' | 'error';
  message?: string;
  normalized?: any;
};

export type CompanyForm = {
  nom_entreprise: string;
  adresse: string;
  telephone: string;
  email: string;
  ice?: string;
  rc?: string;
  if?: string;
  website?: string;
  forme_juridique?: 'SARL'|'SA'|'SAS'|'SASU'|'EURL'|'SNC'|'Auto-entrepreneur'|string;
  numero_tva?: string;
  rcs?: string;
  capital_social?: number;
  logo_url?: string;
};