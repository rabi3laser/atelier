# Prompt pour Claude IA - Workflow N8N Company Data Extractor

Bonjour Claude, j'ai besoin que tu me créés un workflow n8n complet et fonctionnel pour extraire automatiquement les informations d'entreprise depuis des documents PDF et sauvegarder les assets (logo + template) pour une utilisation ultérieure dans la génération de devis.

## 🎯 **Objectif principal :**
Créer un workflow n8n qui reçoit 3 fichiers (PDF devis, logo, template image), extrait automatiquement toutes les informations de l'entreprise depuis le PDF, et sauvegarde tout pour permettre la génération automatique de futurs devis avec ces données.

## 📡 **URL du webhook :**
```
POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor
```

## 📥 **Données d'entrée (JSON reçu via webhook) :**

```json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PA...",
  "logo_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "tempo_image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "current_data": {
    "company_name": "DECOUPE EXPRESS",
    "address": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
    "phone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
    "email": "contact@decoupe-express.ma",
    "website": "www.decoupe-express.ma",
    "ice": "002741154000000",
    "rc": "27441/14",
    "if": "40208300",
    "siret": "",
    "numero_tva": "",
    "rcs": "",
    "forme_juridique": "SARL",
    "capital_social": 100000,
    "logo_url": ""
  }
}
```

## 🏗️ **Base de données Supabase RÉELLE à utiliser :**

### 📊 **URL Supabase :**
```
https://xvwzpoazmxkqosrdewyy.supabase.co
```

### 📋 **Table `organizations` (existante) :**
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  siret TEXT,
  website TEXT,
  logo_url TEXT,
  branding_assets_id UUID REFERENCES branding_assets(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  forme_juridique TEXT,
  capital_social NUMERIC,
  rcs TEXT,
  numero_tva TEXT,
  mentions_legales TEXT
);
```

### 📋 **Table `branding_assets` (existante) :**
```sql
CREATE TABLE branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  palette JSONB DEFAULT '{}',
  fonts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎯 **Traitement requis par le workflow :**

### **1. Réception et validation**
- Recevoir les 3 fichiers base64 (PDF, logo, tempo)
- Valider les formats et tailles
- Extraire les métadonnées

### **2. Extraction OCR du PDF**
- Utiliser OCR.space ou service similaire
- Extraire le texte du PDF de devis
- Parser intelligemment les informations entreprise

### **3. Patterns d'extraction spécifiques MAROC :**
```javascript
// Patterns pour le Maroc (pas France)
const patterns = {
  ice: /(?:ICE|I\.C\.E)[\\s:]*([0-9]{15})/i,
  rc: /(?:RC|R\.C)[\\s:]*([0-9]+\/[0-9]+)/i,
  if: /(?:IF|I\.F)[\\s:]*([0-9]+)/i,
  telephone: /(?:tel|tél|phone)[\\s:]*([0-9\\s\\.\\-\\+]{10,20})/i,
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i,
  adresse: /(?:adresse|address)[\\s:]*([^\\n]+)/i,
  capital: /capital[\\s:]*([0-9\\s,\\.]+)\\s*(?:MAD|DH|dirham)?/i,
  forme: /(SARL|SAS|SA|SASU|EURL|SNC)/i
};
```

### **4. Upload des assets vers Supabase Storage**
- Logo → bucket `logos`
- Template → bucket `templates`
- Générer URLs publiques

### **5. Sauvegarde en base de données**
- Upsert dans table `organizations` avec `id = org_id`
- Créer/mettre à jour `branding_assets`
- Lier les deux tables

## 📤 **Réponse attendue (format EXACT) :**

```json
{
  "success": true,
  "message": "Informations extraites et sauvegardées avec succès",
  "extracted_info": {
    "company_name": "DECOUPE EXPRESS",
    "address": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
    "phone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
    "email": "contact@decoupe-express.ma",
    "website": "www.decoupe-express.ma",
    "ice": "002741154000000",
    "rc": "27441/14",
    "if": "40208300",
    "siret": "",
    "numero_tva": "",
    "rcs": "",
    "forme_juridique": "SARL",
    "capital_social": 100000,
    "logo_url": "https://xvwzpoazmxkqosrdewyy.supabase.co/storage/v1/object/public/logos/logo-123.png"
  },
  "assets_saved": {
    "logo_url": "https://xvwzpoazmxkqosrdewyy.supabase.co/storage/v1/object/public/logos/logo-123.png",
    "template_url": "https://xvwzpoazmxkqosrdewyy.supabase.co/storage/v1/object/public/templates/template-123.png"
  },
  "database_updated": {
    "organization_id": "test123",
    "branding_assets_id": "uuid-generated",
    "fields_extracted": 8,
    "fields_manual": 2
  },
  "processing_info": {
    "ocr_confidence": "high",
    "extraction_method": "ocr_space",
    "processing_time": "3.2s"
  }
}
```

## 🔧 **Structure du workflow N8N requis :**

### **Node 1: Webhook Trigger**
- URL: `/webhook/company-extractor`
- Method: POST
- Content-Type: application/json

### **Node 2: Input Validation**
```javascript
// Validation corrigée pour la structure réelle
const webhookData = $input.all()[0].json;
const input = webhookData.body || webhookData;

// Vérifier structure
if (!input.current_data || !input.pdf_base64) {
  throw new Error('Structure de données invalide');
}

const currentData = input.current_data;
const pdfBase64 = input.pdf_base64;
const logoBase64 = input.logo_base64;
const tempoBase64 = input.tempo_image_base64; // Attention: tempo_image_base64

return {
  org_id: input.org_id,
  current_data: currentData,
  pdf_base64: pdfBase64,
  logo_base64: logoBase64,
  tempo_base64: tempoBase64
};
```

### **Node 3: OCR Extraction**
- Service: OCR.space ou équivalent
- Input: `pdf_base64`
- Language: French
- Engine: 2 (meilleur pour documents)

### **Node 4: Smart Parsing**
```javascript
// Parser intelligent pour extraire infos entreprise
const extractedText = $json.ParsedResults[0].ParsedText;

function extractCompanyInfo(text) {
  const info = {};
  
  // Patterns spécifiques Maroc
  const iceMatch = text.match(/(?:ICE|I\.C\.E)[\\s:]*([0-9]{15})/i);
  if (iceMatch) info.ice = iceMatch[1];
  
  const rcMatch = text.match(/(?:RC|R\.C)[\\s:]*([0-9]+\/[0-9]+)/i);
  if (rcMatch) info.rc = rcMatch[1];
  
  const ifMatch = text.match(/(?:IF|I\.F)[\\s:]*([0-9]+)/i);
  if (ifMatch) info.if = ifMatch[1];
  
  // Patterns universels
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i);
  if (emailMatch) info.email = emailMatch[1];
  
  const phoneMatch = text.match(/(?:tel|tél|phone)[\\s:]*([0-9\\s\\.\\-\\+]{10,20})/i);
  if (phoneMatch) info.phone = phoneMatch[1].trim();
  
  const websiteMatch = text.match(/((?:www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i);
  if (websiteMatch) info.website = websiteMatch[1];
  
  return info;
}

const extractedInfo = extractCompanyInfo(extractedText);
return { ...input, extracted_info: extractedInfo };
```

### **Node 5: Upload Assets to Supabase Storage**
```javascript
// Upload logo et template vers Supabase Storage
const supabaseUrl = 'https://xvwzpoazmxkqosrdewyy.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3pwb2F6bXhrcW9zcmRld3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5ODY0MzgsImV4cCI6MjA0MTU2MjQzOH0.JCw0HDOeeEOYSEQ5uhR_WOCLOeFFPfUUJA-FrSN0t8E';

// Upload logo
const logoFileName = `logo-${Date.now()}.png`;
const logoUpload = await uploadToSupabase('logos', logoFileName, logoBase64);

// Upload template
const templateFileName = `template-${Date.now()}.png`;
const templateUpload = await uploadToSupabase('templates', templateFileName, tempoBase64);

return {
  ...input,
  logo_url: logoUpload.publicUrl,
  template_url: templateUpload.publicUrl
};
```

### **Node 6: Save to Database**
```javascript
// Sauvegarder dans organizations + branding_assets
const supabaseUrl = 'https://xvwzpoazmxkqosrdewyy.supabase.co';

// 1. Créer/mettre à jour branding_assets
const brandingData = {
  logo_url: logoUrl,
  palette: { primary: '#1e40af', secondary: '#64748b' },
  fonts: { primary: 'Arial', secondary: 'Helvetica' }
};

// 2. Upsert organization
const orgData = {
  id: orgId,
  name: extractedInfo.company_name || currentData.company_name,
  address: extractedInfo.address || currentData.address,
  phone: extractedInfo.phone || currentData.phone,
  email: extractedInfo.email || currentData.email,
  website: extractedInfo.website || currentData.website,
  forme_juridique: extractedInfo.forme_juridique || currentData.forme_juridique,
  capital_social: extractedInfo.capital_social || currentData.capital_social,
  logo_url: logoUrl,
  settings: {
    ice: extractedInfo.ice || currentData.ice,
    rc: extractedInfo.rc || currentData.rc,
    if: extractedInfo.if || currentData.if,
    template_url: templateUrl
  }
};
```

### **Node 7: Format Response**
```javascript
// Formater la réponse finale EXACTEMENT comme attendu par l'application
return {
  success: true,
  message: "Informations extraites et sauvegardées avec succès",
  extracted_info: {
    company_name: finalOrgData.name,
    address: finalOrgData.address,
    phone: finalOrgData.phone,
    email: finalOrgData.email,
    website: finalOrgData.website,
    ice: finalOrgData.settings.ice,
    rc: finalOrgData.settings.rc,
    if: finalOrgData.settings.if,
    siret: extractedInfo.siret || "",
    numero_tva: extractedInfo.numero_tva || "",
    rcs: extractedInfo.rcs || "",
    forme_juridique: finalOrgData.forme_juridique,
    capital_social: finalOrgData.capital_social,
    logo_url: finalOrgData.logo_url
  },
  assets_saved: {
    logo_url: logoUrl,
    template_url: templateUrl,
    branding_assets_id: brandingAssetsId
  },
  database_updated: {
    organization_id: orgId,
    fields_extracted: extractedFieldsCount,
    fields_manual: manualFieldsCount
  }
};
```

## 🎯 **Cas d'usage complet :**

### **Phase 1 - Configuration initiale (ce workflow) :**
1. Utilisateur uploade PDF devis + logo + template image
2. Workflow extrait automatiquement toutes les infos entreprise du PDF
3. Sauvegarde logo + template dans Supabase Storage
4. Sauvegarde infos entreprise dans table `organizations`
5. Retourne toutes les données extraites pour remplissage automatique

### **Phase 2 - Utilisation future (autre partie de l'app) :**
1. Utilisateur crée un nouveau devis
2. Application récupère automatiquement :
   - Infos entreprise depuis table `organizations`
   - Logo depuis `logo_url`
   - Template depuis `settings.template_url`
3. Génération automatique du devis avec toutes ces données

## 🔒 **Spécifications techniques CRITIQUES :**

### **OCR et extraction :**
- Service OCR : OCR.space (API key fournie dans le workflow existant)
- Langue : Français
- Engine : 2 (meilleur pour documents structurés)
- Confidence minimum : 70%

### **Patterns d'extraction Maroc :**
```javascript
const moroccanPatterns = {
  ice: /(?:ICE|I\.C\.E)[\\s:]*([0-9]{15})/i,
  rc: /(?:RC|R\.C)[\\s:]*([0-9]+\/[0-9]+)/i,
  if: /(?:IF|I\.F)[\\s:]*([0-9]+)/i,
  telephone: /(?:tel|tél|phone)[\\s:]*([0-9\\s\\.\\-\\+]{10,20})/i,
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i,
  adresse: /(?:adresse|address)[\\s:]*([^\\n\\r]+)/i,
  capital: /capital[\\s:]*([0-9\\s,\\.]+)\\s*(?:MAD|DH|dirham)?/i,
  forme: /(SARL|SAS|SA|SASU|EURL|SNC)/i,
  website: /((?:https?:\\/\\/)?(?:www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i
};
```

### **Upload Supabase Storage :**
- Bucket logos : `logos`
- Bucket templates : `templates`
- Nommage : `{type}-{timestamp}.{ext}`
- Politique : Public read

### **Gestion d'erreurs :**
```javascript
// Gestion robuste des erreurs
try {
  // Traitement principal
} catch (error) {
  return {
    success: false,
    error: error.message,
    stage: 'extraction_failed',
    partial_data: extractedSoFar,
    troubleshooting: {
      possible_causes: [
        'PDF illisible ou protégé',
        'Format de fichier non supporté',
        'Erreur de connexion Supabase',
        'Patterns d\\'extraction non trouvés'
      ],
      next_steps: [
        'Vérifier la qualité du PDF',
        'Essayer avec un autre format',
        'Remplir manuellement les champs manquants'
      ]
    }
  };
}
```

## 🧪 **Données de test RÉELLES :**

```json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MK...",
  "logo_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "tempo_image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "current_data": {
    "company_name": "DECOUPE EXPRESS",
    "address": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
    "phone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
    "email": "contact@decoupe-express.ma",
    "website": "www.decoupe-express.ma",
    "ice": "002741154000000",
    "rc": "27441/14",
    "if": "40208300",
    "forme_juridique": "SARL",
    "capital_social": 100000
  }
}
```

## 🎯 **Objectif final :**

Après ce workflow, l'application pourra :

1. **Récupérer automatiquement** toutes les infos entreprise depuis la base
2. **Utiliser le logo** sauvegardé dans tous les documents
3. **Utiliser le template** pour générer des devis avec le bon design
4. **Générer des devis** avec toutes ces données pré-remplies

**Le workflow doit être 100% compatible avec la structure de données de l'application React/Supabase existante !**

## 🔗 **Variables d'environnement N8N :**

```bash
# Supabase (VRAIE base de données)
SUPABASE_URL=https://xvwzpoazmxkqosrdewyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3pwb2F6bXhrcW9zcmRld3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5ODY0MzgsImV4cCI6MjA0MTU2MjQzOH0.JCw0HDOeeEOYSEQ5uhR_WOCLOeFFPfUUJA-FrSN0t8E

# OCR
OCR_SPACE_API_KEY=K87899142388957
```

**Créez un workflow n8n qui respecte EXACTEMENT cette structure pour une intégration parfaite avec l'application !**