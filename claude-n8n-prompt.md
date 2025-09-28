# Prompt pour Claude IA - Génération de workflow n8n pour PDF de devis

Bonjour Claude, j'ai besoin que tu me génères un workflow n8n complet et fonctionnel pour générer des PDF de devis à partir de templates PDF dynamiques uploadés par les utilisateurs.

## 🎯 **Objectif :**
Créer un workflow n8n qui reçoit des données de devis via webhook ET le template PDF uploadé par l'utilisateur (URL ou base64), puis génère un PDF personnalisé en utilisant ce template dynamique avec positionnement configurable.

## 📊 **Données d'entrée RÉELLES (JSON reçu via webhook) :**

```json
{
  "devis_id": "DEV-202509-757",
  "numero": "DEV-202509-757",
  "date_devis": "2025-01-06",
  "date_validite": "2025-01-12",
  "client": {
    "nom": "Client Générique",
    "adresse": "123 Rue Example",
    "code_postal": "20000",
    "ville": "Casablanca",
    "telephone": "0522123456",
    "email": "client@example.com",
    "ice": "001234567000000",
    "rc": "12345",
    "if": "67890"
  },
  "entreprise": {
    "nom": "DECOUPE EXPRESS",
    "adresse": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
    "code_postal": "28810",
    "ville": "MOHAMMEDIA",
    "telephone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
    "email": "contact@decoupe-express.ma",
    "ice": "ICE: 002741154000000",
    "rc": "RC: 27441/14",
    "if": "IF: 40208300"
  },
  "lignes": [
    {
      "ligne_numero": 1,
      "designation": "Tôle acier 3mm",
      "mode_facturation": "m2",
      "quantite": 1.000,
      "prix_unitaire_ht": 35.00,
      "remise_pct": 0,
      "montant_ht": 35.00,
      "tva_pct": 20,
      "montant_tva": 7.00,
      "montant_ttc": 42.00,
      "notes": ""
    }
  ],
  "montant_ht": 35.00,
  "montant_tva": 7.00,
  "montant_ttc": 42.00,
  "taux_tva": 20,
  "remise_globale_pct": 0,
  "conditions": "",
  "notes": "",
  "template": {
    "url": "https://votre-serveur.com/uploads/user-template-123.pdf",
    "base64": "JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PA...",
    "name": "DEVIs Mr Faik.pdf",
    "type": "application/pdf"
  },
  "zones": {
    "numero": { "x": 240, "y": 770 },
    "date": { "x": 240, "y": 750 },
    "client": { "x": 50, "y": 680 },
    "lignes": { "x": 50, "y": 400, "width": 500, "height": 200 },
    "totaux": { "x": 650, "y": 200 }
  }
}
```

## 🏗️ **Structure de données RÉELLE de l'application :**

### 📋 **Table `devis` :**
```sql
- id (uuid)
- numero (text) 
- client_id (uuid)
- date_devis (date)
- date_validite (date)
- statut ('brouillon'|'envoye'|'accepte'|'refuse'|'expire')
- montant_ht (numeric)
- montant_tva (numeric) 
- montant_ttc (numeric)
- taux_tva (numeric)
- remise_globale_pct (numeric)
- conditions (text)
- notes (text)
```

### 📋 **Table `devis_lignes` :**
```sql
- id (uuid)
- devis_id (uuid)
- ligne_numero (integer)
- matiere_id (uuid)
- designation (text)
- mode_facturation ('m2'|'feuille'|'service')
- quantite (numeric)
- prix_unitaire_ht (numeric)
- remise_pct (numeric)
- montant_ht (numeric)
- tva_pct (numeric)
- montant_tva (numeric)
- montant_ttc (numeric)
- notes (text)
```

### 👥 **Table `clients` :**
```sql
- id (uuid)
- code (text)
- nom (text)
- adresse (text)
- code_postal (text)
- ville (text)
- telephone (text)
- email (text)
- siret (text)
- ice (text)
- rc (text)
- if (text)
```

## 📤 **Réponse attendue de n8n :**

```json
{
  "success": true,
  "pdf_url": "https://votre-serveur.com/generated/devis-DEV-202509-757.pdf",
  "message": "PDF généré avec succès",
  "template_used": "DEVIs Mr Faik.pdf",
  "generation_time": "2025-01-06T10:30:00Z"
}
```

**OU en cas d'erreur :**

```json
{
  "success": false,
  "error": "Template PDF invalide",
  "message": "Échec de la génération PDF",
  "details": "Le fichier fourni n'est pas un PDF valide"
}
```

## 🛠 **Exigences techniques SPÉCIFIQUES :**

### 🔄 **Workflow n8n requis :**
1. **Webhook Trigger** : Recevoir POST avec données JSON
2. **Validation Node** : Vérifier données obligatoires (numero, client.nom, lignes, template)
3. **Template Handler** :
   - Si `template.url` → télécharger le PDF
   - Si `template.base64` → décoder le contenu
   - Validation que c'est un PDF valide (%PDF- header)
   - Cache temporaire pour éviter re-téléchargements
4. **PDF Generator** : Fusionner données + template utilisateur
5. **File Storage** : Sauvegarder PDF généré avec nom unique
6. **Response** : Retourner URL publique du PDF

### 📍 **Positionnement dynamique OBLIGATOIRE :**
- Utiliser l'objet `zones` pour placer chaque élément
- **zones.numero** : Position du numéro de devis
- **zones.date** : Position de la date  
- **zones.client** : Position des informations client
- **zones.lignes** : Zone du tableau des lignes (avec width/height)
- **zones.totaux** : Position des totaux

### 🎨 **Rendu SPÉCIFIQUE :**
- **Police** : Helvetica, taille 10-12pt
- **Format dates** : DD/MM/YYYY (français)
- **Format montants** : 35,00 MAD (virgule décimale)
- **Couleur** : Noir pour le texte
- **Alignement** : Respecter les zones définies
- **Tableau lignes** : Une ligne par produit dans la zone définie

### 🔒 **Sécurité et robustesse :**
- Validation taille template (max 10MB)
- Validation format PDF (%PDF- header)
- Timeout de 30 secondes max
- Nettoyage fichiers temporaires
- Gestion d'erreurs complète
- Cache sécurisé des templates (1h max)

### 💾 **Stockage et cache :**
- **Templates** : Cache temporaire 1h pour éviter re-téléchargements
- **PDF générés** : Stockage permanent avec URL publique
- **Nommage** : `devis-{numero}-{timestamp}.pdf`

## 🧪 **Données de test RÉELLES :**

```json
{
  "devis_id": "TEST-001",
  "numero": "TEST-001", 
  "date_devis": "2025-01-06",
  "date_validite": "2025-01-20",
  "client": {
    "nom": "SARL TEST MAROC",
    "adresse": "Avenue Mohammed V",
    "code_postal": "20000",
    "ville": "Casablanca", 
    "telephone": "0522123456",
    "email": "test@example.ma",
    "ice": "001234567000000",
    "rc": "12345",
    "if": "67890"
  },
  "lignes": [
    {
      "ligne_numero": 1,
      "designation": "Découpe laser acier inox 2mm",
      "mode_facturation": "m2",
      "quantite": 2.500,
      "prix_unitaire_ht": 45.00,
      "remise_pct": 10,
      "montant_ht": 101.25,
      "tva_pct": 20,
      "montant_tva": 20.25,
      "montant_ttc": 121.50
    },
    {
      "ligne_numero": 2,
      "designation": "Pliage tôle aluminium 3mm", 
      "mode_facturation": "service",
      "quantite": 1.000,
      "prix_unitaire_ht": 150.00,
      "remise_pct": 0,
      "montant_ht": 150.00,
      "tva_pct": 20,
      "montant_tva": 30.00,
      "montant_ttc": 180.00
    }
  ],
  "montant_ht": 251.25,
  "montant_tva": 50.25,
  "montant_ttc": 301.50,
  "taux_tva": 20,
  "template": {
    "url": "https://exemple.com/templates/devis-mr-faik.pdf",
    "name": "DEVIs Mr Faik.pdf",
    "type": "application/pdf"
  },
  "zones": {
    "numero": { "x": 240, "y": 770 },
    "date": { "x": 240, "y": 750 },
    "client": { "x": 50, "y": 680 },
    "lignes": { "x": 50, "y": 400, "width": 500, "height": 200 },
    "totaux": { "x": 650, "y": 200 }
  }
}
```

## 🎯 **Points critiques :**

- **Template différent par utilisateur** : Chaque client peut avoir son propre modèle
- **Zones configurables** : Positions ajustables selon le template
- **Support URL + Base64** : Flexibilité d'envoi du template
- **Cache intelligent** : Éviter re-téléchargements du même template
- **Validation robuste** : S'assurer que le template est un PDF valide

**Générez-moi un workflow n8n complet qui gère ces templates dynamiques avec positionnement configurable !**

## 🌐 **URLs et endpoints REQUIS :**

### 📡 **Webhook d'entrée (n8n reçoit) :**
```
POST https://votre-n8n.com/webhook/generate-pdf
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY (optionnel)
```

### 📤 **Réponse n8n (vers application) :**
```json
{
  "success": true,
  "pdf_url": "https://votre-serveur.com/generated/devis-DEV-202509-757-20250106103000.pdf",
  "pdf_base64": "JVBERi0xLjcKJeLjz9MK...", // OU base64 si pas d'URL
  "template_used": "DEVIs Mr Faik.pdf",
  "generation_time": "2025-01-06T10:30:00Z",
  "file_size": 245760
}
```

### 📄 **Envoi du template utilisateur (3 méthodes) :**

#### **Méthode 1 - URL publique :**
```json
{
  "template": {
    "url": "https://votre-serveur.com/uploads/user-templates/template-123.pdf",
    "name": "DEVIs Mr Faik.pdf",
    "type": "application/pdf"
  }
}
```

#### **Méthode 2 - Base64 direct :**
```json
{
  "template": {
    "base64": "JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwov...",
    "name": "DEVIs Mr Faik.pdf", 
    "type": "application/pdf"
  }
}
```

#### **Méthode 3 - Upload multipart (alternative) :**
```
POST https://votre-n8n.com/webhook/generate-pdf-with-upload
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="data"
Content-Type: application/json

{devis_data_json}

--boundary
Content-Disposition: form-data; name="template"; filename="template.pdf"
Content-Type: application/pdf

{binary_pdf_data}
--boundary--
```

## 🔄 **Flux complet de données :**

### 📊 **1. Application → n8n (Requête) :**
```javascript
const response = await fetch('https://votre-n8n.com/webhook/generate-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    // Données du devis
    devis_id: "DEV-202509-757",
    numero: "DEV-202509-757",
    date_devis: "2025-01-06",
    client: { nom: "Client Test", ... },
    entreprise: { nom: "DECOUPE EXPRESS", ... },
    lignes: [...],
    montant_ttc: 301.50,
    
    // Template utilisateur
    template: {
      base64: "JVBERi0xLjcKJeLjz9MK...", // OU url
      name: "DEVIs Mr Faik.pdf",
      type: "application/pdf"
    },
    
    // Zones configurables
    zones: {
      numero: { x: 240, y: 770 },
      date: { x: 240, y: 750 },
      client: { x: 50, y: 680 },
      lignes: { x: 50, y: 400, width: 500, height: 200 },
      totaux: { x: 650, y: 200 }
    }
  })
});
```

### 📥 **2. n8n → Application (Réponse) :**
```javascript
const result = await response.json();
// result = { success: true, pdf_url: "https://...", ... }

if (result.success) {
  // Télécharger ou afficher le PDF
  window.open(result.pdf_url, '_blank');
} else {
  console.error('Erreur:', result.error);
}
```

## 🛠️ **Exigences techniques CRITIQUES :**

### 📄 **Gestion des templates :**
- **Cache intelligent** : Éviter re-téléchargement du même template
- **Validation PDF** : Vérifier header %PDF-
- **Taille limite** : Max 10MB par template
- **Nettoyage** : Supprimer templates temporaires après usage

### 🎯 **Positionnement précis :**
- **Coordonnées absolues** : X,Y en pixels depuis coin supérieur gauche
- **Zones dynamiques** : Tableau avec width/height variables
- **Police cohérente** : Helvetica 10-12pt
- **Format français** : Dates DD/MM/YYYY, montants avec virgule

### 🔒 **Sécurité :**
- **Validation entrée** : Données obligatoires présentes
- **Sanitisation** : Nettoyer les chaînes de caractères
- **Timeout** : 30 secondes max par génération
- **Logs** : Traçabilité des générations

## 🧪 **Test complet avec template réel :**

```json
{
  "devis_id": "TEST-REAL-001",
  "numero": "TEST-REAL-001",
  "date_devis": "2025-01-06",
  "client": {
    "nom": "SARL ATLAS CONSTRUCTION",
    "adresse": "Zone Industrielle Sidi Bernoussi",
    "code_postal": "20600",
    "ville": "Casablanca",
    "telephone": "0522987654",
    "email": "contact@atlas-construction.ma",
    "ice": "001987654000000",
    "rc": "98765",
    "if": "12345"
  },
  "entreprise": {
    "nom": "DECOUPE EXPRESS",
    "adresse": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
    "code_postal": "28810", 
    "ville": "MOHAMMEDIA",
    "telephone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
    "email": "contact@decoupe-express.ma",
    "ice": "ICE: 002741154000000",
    "rc": "RC: 27441/14",
    "if": "IF: 40208300"
  },
  "lignes": [
    {
      "ligne_numero": 1,
      "designation": "Découpe laser acier inox 304 - 2mm",
      "mode_facturation": "m2",
      "quantite": 3.250,
      "prix_unitaire_ht": 85.00,
      "remise_pct": 5,
      "montant_ht": 262.19,
      "tva_pct": 20,
      "montant_tva": 52.44,
      "montant_ttc": 314.63,
      "notes": "Finition brossée"
    },
    {
      "ligne_numero": 2,
      "designation": "Pliage et soudure - Assemblage final",
      "mode_facturation": "service", 
      "quantite": 1.000,
      "prix_unitaire_ht": 450.00,
      "remise_pct": 0,
      "montant_ht": 450.00,
      "tva_pct": 20,
      "montant_tva": 90.00,
      "montant_ttc": 540.00,
      "notes": "Soudure TIG"
    }
  ],
  "montant_ht": 712.19,
  "montant_tva": 142.44,
  "montant_ttc": 854.63,
  "taux_tva": 20,
  "remise_globale_pct": 0,
  "conditions": "Paiement à 30 jours fin de mois",
  "notes": "Livraison sous 15 jours ouvrés",
  
  // TEMPLATE UTILISATEUR (CRITIQUE)
  "template": {
    "url": "https://votre-serveur.com/user-uploads/template-user123.pdf",
    "base64": "JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwov...",
    "name": "DEVIs Mr Faik.pdf",
    "type": "application/pdf",
    "user_id": "user123",
    "upload_date": "2025-01-06T09:00:00Z"
  },
  
  // ZONES CONFIGURABLES PAR UTILISATEUR
  "zones": {
    "numero": { "x": 240, "y": 770 },
    "date": { "x": 240, "y": 750 },
    "client": { "x": 50, "y": 680 },
    "lignes": { "x": 50, "y": 400, "width": 500, "height": 200 },
    "totaux": { "x": 650, "y": 200 }
  }
}
```

## 🔄 **Workflow n8n doit gérer :**

1. **Réception template** : URL OU base64 dans chaque requête
2. **Cache template** : Éviter re-téléchargement si même URL
3. **Validation PDF** : Vérifier que c'est un PDF valide
4. **Positionnement dynamique** : Utiliser les zones fournies
5. **Génération PDF** : Fusionner template + données
6. **Stockage résultat** : PDF généré accessible via URL
7. **Réponse** : URL du PDF généré

**Le workflow doit être capable de traiter N'IMPORTE QUEL template PDF uploadé par n'importe quel utilisateur avec des zones de positionnement personnalisées.**