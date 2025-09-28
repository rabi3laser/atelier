# Prompt pour Claude IA - Workflow N8N Company Data Extractor avec 3 fichiers spécifiques

Bonjour Claude, j'ai besoin que tu me créés un workflow n8n complet et fonctionnel pour traiter 3 fichiers uploadés par l'utilisateur et extraire automatiquement les informations d'entreprise pour une utilisation future dans la génération de devis.

## 🎯 **Objectif principal :**
Créer un workflow n8n qui reçoit **3 fichiers distincts** avec des rôles spécifiques, extrait les informations de l'entreprise depuis le PDF exemple, et sauvegarde tout pour permettre la génération automatique de futurs devis avec ces données.

## 📁 **LES 3 FICHIERS UPLOADÉS ET LEURS RÔLES :**

### **1. 📄 PDF DEVIS EXEMPLE**
- **Rôle :** Source d'extraction des informations entreprise
- **Contenu :** Un devis existant de l'entreprise avec toutes ses informations
- **Traitement :** OCR + extraction intelligente des données
- **Informations à extraire :**
  - Nom de l'entreprise
  - Adresse complète
  - Téléphone
  - Email
  - Site web
  - ICE (Identifiant Commun Entreprise - Maroc)
  - RC (Registre de Commerce - Maroc)
  - IF (Identifiant Fiscal - Maroc)
  - Forme juridique (SARL, SAS, etc.)
  - Capital social

### **2. 🖼️ LOGO DE LA SOCIÉTÉ**
- **Rôle :** Logo officiel à utiliser dans tous les futurs documents
- **Format :** PNG, JPG, SVG
- **Traitement :** Optimisation et sauvegarde
- **Utilisation future :** Insertion automatique dans les en-têtes de devis

### **3. 🎨 IMAGE TEMPLATE/TEMPO DE LA SOCIÉTÉ**
- **Rôle :** Modèle visuel/arrière-plan pour les futurs devis
- **Contenu :** Design, couleurs, mise en page de l'entreprise
- **Traitement :** Conversion en template HTML/CSS
- **Utilisation future :** Base graphique pour tous les nouveaux devis

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

## 🎯 **Traitement requis pour chaque fichier :**

### **📄 TRAITEMENT DU PDF DEVIS EXEMPLE :**
1. **OCR du PDF** : Extraire tout le texte du document
2. **Parsing intelligent** : Identifier et extraire les informations entreprise
3. **Patterns spécifiques Maroc :**
   ```javascript
   const patterns = {
     ice: /(?:ICE|I\.C\.E)[\\s:]*([0-9]{15})/i,
     rc: /(?:RC|R\.C)[\\s:]*([0-9]+\/[0-9]+)/i,
     if: /(?:IF|I\.F)[\\s:]*([0-9]+)/i,
     telephone: /(?:tel|tél|phone)[\\s:]*([0-9\\s\\.\\-\\+]{10,20})/i,
     email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i,
     adresse: /(?:adresse|address)[\\s:]*([^\\n]+)/i,
     capital: /capital[\\s:]*([0-9\\s,\\.]+)\\s*(?:MAD|DH|dirham)?/i,
     forme: /(SARL|SAS|SA|SASU|EURL|SNC)/i,
     website: /((?:https?:\\/\\/)?(?:www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/i
   };
   ```

### **🖼️ TRAITEMENT DU LOGO :**
1. **Validation** : Format, taille, qualité
2. **Optimisation** : Redimensionnement si nécessaire
3. **Sauvegarde** : Upload vers Supabase Storage bucket `logos`
4. **URL publique** : Génération pour utilisation future

### **🎨 TRAITEMENT DU TEMPLATE/TEMPO :**
1. **Analyse** : Couleurs dominantes, style, mise en page
2. **Conversion** : Transformation en template HTML/CSS
3. **Sauvegarde** : Upload vers Supabase Storage bucket `templates`
4. **Configuration** : Zones de placement pour futurs devis

## 🗄️ **Base de données Supabase RÉELLE :**

### **URL Supabase :**
```
https://xvwzpoazmxkqosrdewyy.supabase.co
```

### **Table `organizations` (existante) :**
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

## 📤 **Réponse attendue EXACTE :**

```json
{
  "success": true,
  "message": "Informations extraites et assets sauvegardés avec succès",
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
    "template_url": "https://xvwzpoazmxkqosrdewyy.supabase.co/storage/v1/object/public/templates/template-123.png",
    "branding_assets_id": "uuid-generated"
  },
  "database_updated": {
    "organization_id": "test123",
    "fields_extracted": 8,
    "fields_manual": 2
  }
}
```

## 🎯 **CAS D'USAGE COMPLET :**

### **PHASE 1 - Configuration initiale (ce workflow) :**
1. **Utilisateur uploade :**
   - PDF devis exemple → **Source des informations entreprise**
   - Logo société → **Logo officiel pour documents**
   - Image template → **Design/style pour futurs devis**

2. **Workflow traite :**
   - **PDF** → OCR + extraction données entreprise
   - **Logo** → Optimisation + sauvegarde Supabase
   - **Template** → Conversion + sauvegarde Supabase

3. **Sauvegarde en base :**
   - Table `organizations` → Informations entreprise
   - Table `branding_assets` → Assets visuels
   - Storage Supabase → Fichiers logo + template

### **PHASE 2 - Utilisation future (autre partie application) :**
1. **Génération nouveau devis :**
   - Application récupère automatiquement depuis `organizations`
   - Logo depuis `logo_url`
   - Template depuis `branding_assets`

2. **Résultat :**
   - Devis généré avec **informations entreprise correctes**
   - **Logo officiel** en en-tête
   - **Design cohérent** avec le template

## 🔧 **Structure du workflow N8N requis :**

### **Node 1: Webhook Reception**
- URL: `/webhook/company-extractor`
- Recevoir les 3 fichiers base64

### **Node 2: Validation Input**
- Vérifier présence des 3 fichiers
- Valider formats et tailles

### **Node 3: OCR PDF Devis**
- Service: OCR.space
- Extraire texte du PDF exemple
- Language: French

### **Node 4: Extraction Intelligente**
- Parser le texte OCR
- Extraire informations entreprise avec patterns Maroc
- Nettoyer et structurer les données

### **Node 5: Upload Assets Supabase**
- Logo → bucket `logos`
- Template → bucket `templates`
- Générer URLs publiques

### **Node 6: Sauvegarde Base**
- Upsert table `organizations`
- Créer/update `branding_assets`
- Lier les assets

### **Node 7: Réponse Finale**
- Format exact attendu par l'application
- Structure `extracted_info` avec tous les champs

## 🧪 **Test avec données réelles :**

```bash
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test123",
    "pdf_base64": "data:application/pdf;base64,JVBERi0x...",
    "logo_base64": "data:image/png;base64,iVBORw0KGgo...",
    "tempo_image_base64": "data:image/png;base64,iVBORw0KGgo...",
    "current_data": {
      "company_name": "DECOUPE EXPRESS",
      "address": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA"
    }
  }'
```

## 🎯 **Résultat attendu :**

Après ce workflow, l'application pourra :
1. **Remplir automatiquement** tous les champs du formulaire
2. **Sauvegarder** les informations en base
3. **Utiliser** logo + template pour futurs devis
4. **Générer** des devis cohérents avec l'identité visuelle

**Le workflow doit traiter intelligemment les 3 fichiers pour créer un système complet de génération de devis personnalisés !**

## 🔒 **Variables d'environnement N8N :**

```bash
# Supabase (VRAIE base de données)
SUPABASE_URL=https://xvwzpoazmxkqosrdewyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3pwb2F6bXhrcW9zcmRld3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5ODY0MzgsImV4cCI6MjA0MTU2MjQzOH0.JCw0HDOeeEOYSEQ5uhR_WOCLOeFFPfUUJA-FrSN0t8E

# OCR
OCR_SPACE_API_KEY=K87899142388957
```

**Créez un workflow n8n qui traite intelligemment ces 3 fichiers pour une extraction et sauvegarde complète des données entreprise !**