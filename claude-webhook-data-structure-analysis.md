# Prompt pour Claude IA - Analyse structure données webhook Company Extractor

Bonjour Claude, j'ai besoin que tu analyses et corriges la structure des données envoyées à mon webhook n8n pour résoudre l'erreur "Missing required field: org_id".

## 🚨 **PROBLÈME ACTUEL :**
Mon application React envoie des données au webhook n8n mais le workflow retourne l'erreur :
```
Missing required field: org_id at line 22
```

## 📡 **WEBHOOK N8N CONFIGURÉ :**
```
URL: POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor
Purpose: Extraire informations entreprise depuis 3 fichiers uploadés
```

## 📊 **STRUCTURE ACTUELLE ENVOYÉE PAR L'APPLICATION :**

### **Code JavaScript d'envoi :**
```javascript
const webhookPayload = {
  org_id: 'test123',
  pdf_base64: pdfBase64,
  logo_base64: logoBase64,
  tempo_image_base64: tempoBase64,
  current_data: {
    company_name: 'DECOUPE EXPRESS',
    address: 'BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA',
    phone: 'TEL: 05 23 30 58 80 / 06 66 04 58 24',
    email: 'contact@decoupe-express.ma',
    website: 'www.decoupe-express.ma',
    ice: '002741154000000',
    rc: '27441/14',
    if: '40208300',
    forme_juridique: 'SARL',
    capital_social: 100000
  }
};

const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/company-extractor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(webhookPayload)
});
```

### **Données JSON EXACTES envoyées :**
```json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PA...",
  "logo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "tempo_image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
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

## 🔧 **CÔTÉ WORKFLOW N8N - RÉCEPTION ATTENDUE :**

### **Node Webhook Trigger :**
```javascript
// Ce que le webhook devrait recevoir dans $input.first().json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,...",
  "logo_base64": "data:image/jpeg;base64,...",
  "tempo_image_base64": "data:image/png;base64,...",
  "current_data": { ... }
}
```

### **Node Validation (ligne 22 qui échoue) :**
```javascript
// Code de validation qui échoue actuellement
const input = $input.first().json;

// Vérification qui échoue
if (!input.org_id) {
  throw new Error('Missing required field: org_id');
}

// Debug : Afficher la structure reçue
console.log('Structure reçue:', Object.keys(input));
console.log('org_id reçu:', input.org_id);
console.log('Type org_id:', typeof input.org_id);
```

## 🎯 **HYPOTHÈSES SUR LA CAUSE :**

### **Hypothèse 1 - Wrapping automatique :**
N8N reçoit peut-être :
```json
{
  "body": {
    "org_id": "test123",
    "pdf_base64": "...",
    ...
  }
}
```
Au lieu de :
```json
{
  "org_id": "test123",
  "pdf_base64": "...",
  ...
}
```

### **Hypothèse 2 - Headers incorrects :**
Le Content-Type n'est pas reconnu et les données sont parsées différemment.

### **Hypothèse 3 - Middleware proxy :**
Un proxy/middleware modifie la structure avant d'arriver au workflow.

## 🛠️ **SOLUTIONS À TESTER :**

### **Solution 1 - Modifier le node de validation n8n :**
```javascript
// Essayer différentes structures de réception
const webhookData = $input.first().json;
const input = webhookData.body || webhookData;

console.log('Webhook data structure:', Object.keys(webhookData));
console.log('Input structure:', Object.keys(input));
console.log('org_id found:', input.org_id);

if (!input.org_id) {
  throw new Error(`Missing required field: org_id. Received structure: ${JSON.stringify(Object.keys(input))}`);
}
```

### **Solution 2 - Test avec curl pour validation :**
```bash
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test123",
    "pdf_base64": "data:application/pdf;base64,JVBERi0xLjc=",
    "logo_base64": "data:image/png;base64,iVBORw0KGgo=",
    "tempo_image_base64": "data:image/png;base64,iVBORw0KGgo=",
    "current_data": {
      "company_name": "TEST COMPANY"
    }
  }'
```

### **Solution 3 - Modifier l'application pour envoyer différemment :**
```javascript
// Option A : Envoyer dans un wrapper body
const payload = {
  body: {
    org_id: 'test123',
    pdf_base64: pdfBase64,
    // ...
  }
};

// Option B : Envoyer en FormData
const formData = new FormData();
formData.append('org_id', 'test123');
formData.append('pdf_base64', pdfBase64);
// ...
```

## 🧪 **TESTS DE DIAGNOSTIC :**

### **Test 1 - Vérifier réception côté n8n :**
Ajouter dans le node de validation :
```javascript
console.log('=== DEBUG WEBHOOK RECEPTION ===');
console.log('Full input:', JSON.stringify($input.first(), null, 2));
console.log('JSON keys:', Object.keys($input.first().json || {}));
console.log('Body keys:', Object.keys($input.first().json?.body || {}));
console.log('org_id direct:', $input.first().json?.org_id);
console.log('org_id in body:', $input.first().json?.body?.org_id);
```

### **Test 2 - Vérifier envoi côté application :**
```javascript
console.log('=== DEBUG APPLICATION ENVOI ===');
console.log('Payload structure:', Object.keys(webhookPayload));
console.log('org_id value:', webhookPayload.org_id);
console.log('org_id type:', typeof webhookPayload.org_id);
console.log('JSON stringified:', JSON.stringify(webhookPayload).substring(0, 200));
```

## 🎯 **ACTIONS REQUISES :**

1. **Teste le curl** pour vérifier si le problème vient de l'application ou du workflow
2. **Ajoute les logs de debug** dans le node n8n pour voir la structure exacte reçue
3. **Vérifie** si n8n attend `input.body.org_id` au lieu de `input.org_id`

**Quelle solution veux-tu tester en premier ?**