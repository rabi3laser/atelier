# Prompt pour Claude IA - Structure EXACTE des données envoyées au webhook N8N

Bonjour Claude, j'ai besoin que tu analyses la structure EXACTE des données que mon application React envoie au webhook n8n pour résoudre l'erreur "Missing required field: org_id".

## 🚨 **PROBLÈME ACTUEL :**
- Webhook N8N retourne erreur HTTP 500 "Internal Server Error"
- Erreur dans le workflow : "Missing required field: org_id at line 22"
- Les données semblent arriver mais ne sont pas parsées correctement

## 📡 **WEBHOOK N8N CONFIGURÉ :**
```
URL: POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor
Purpose: Extraire informations entreprise depuis 3 fichiers uploadés
```

## 📊 **STRUCTURE EXACTE ENVOYÉE PAR L'APPLICATION :**

### **Code JavaScript d'envoi RÉEL :**
```javascript
// Dans CompanyInfoExtractor.tsx ligne ~150-200
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
    siret: '',
    numero_tva: 'MA123456789',
    rcs: 'Casablanca 123456',
    forme_juridique: 'SARL',
    capital_social: 100000,
    logo_url: ''
  }
};

const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/company-extractor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'CompanyExtractor/1.0'
  },
  body: JSON.stringify(webhookPayload)
});
```

### **JSON EXACT envoyé (structure complète) :**
```json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKL0xhbmcgKGVuLVVTKQovU3RydWN0VHJlZVJvb3QgMyAwIFIKL01hcmtJbmZvIDw8L01hcmtlZCB0cnVlPj4KL01ldGFkYXRhIDQgMCBSCi9WaWV3ZXJQcmVmZXJlbmNlcyA1IDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzYgMCBSXQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvU3RydWN0VHJlZVJvb3QKL0sgWzcgMCBSXQovUGFyZW50VHJlZSA4IDAgUgovUGFyZW50VHJlZU5leHRLZXkgMQo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovU3ViamVjdCAoKQovQXV0aG9yICgpCi9UaXRsZSAoKQovQ3JlYXRvciAoQ2FudmEpCi9Qcm9kdWNlciAoQ2FudmEpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNTAxMDYyMTQxMjcrMDAnMDAnKQovTW9kRGF0ZSAoRDoyMDI1MDEwNjIxNDEyNyswMCcwMCcpCi9LZXl3b3JkcyAoKQo+PgplbmRvYmoKNSAwIG9iago8PAovRGlzcGxheURvY1RpdGxlIHRydWUKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1Jlc291cmNlcyA8PAovUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0KL0V4dEdTdGF0ZSA8PAovRzMgOSAwIFIKL0c0IDEwIDAgUgo+PgovRm9udCA8PAovRjUgMTEgMCBSCi9GNiAxMiAwIFIKL0Y3IDEzIDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUuMjc1NTkwNTUxMTgxIDg0MS44ODk3NjM3Nzk1Mjc2XQovQ29udGVudHMgMTQgMCBSCi9TdHJ1Y3RQYXJlbnRzIDAKL1BhcmVudCAxNSAwIFIKL1RhYnMgL1MKL0Jsb3JkQm94IFswIDAgNTk1LjI3NTU5MDU1MTE4MSA4NDEuODg5NzYzNzc5NTI3Nl0KL1RyaW1Cb3ggWzAgMCA1OTUuMjc1NTkwNTUxMTgxIDg0MS44ODk3NjM3Nzk1Mjc2XQovQ3JvcEJveCBbMCAwIDU5NS4yNzU1OTA1NTExODEgODQxLjg4OTc2Mzc3OTUyNzZdCi9Sb3RhdGUgMAo+PgplbmRvYmoK...",
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
    "siret": "",
    "numero_tva": "MA123456789",
    "rcs": "Casablanca 123456",
    "forme_juridique": "SARL",
    "capital_social": 100000,
    "logo_url": ""
  }
}
```

## 🔧 **CÔTÉ WORKFLOW N8N - CE QUI DEVRAIT ÊTRE REÇU :**

### **Node Webhook Trigger (ce que n8n reçoit) :**
```javascript
// Dans $input.first().json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,...",
  "logo_base64": "data:image/jpeg;base64,...",
  "tempo_image_base64": "data:image/png;base64,...",
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
    "numero_tva": "MA123456789",
    "rcs": "Casablanca 123456",
    "forme_juridique": "SARL",
    "capital_social": 100000,
    "logo_url": ""
  }
}
```

## 🎯 **PROBLÈME IDENTIFIÉ :**

### **Erreur HTTP 500 "Internal Server Error"**
- Le webhook reçoit les données mais le workflow n8n crash
- Erreur à la ligne 22 du workflow : "Missing required field: org_id"
- Cela suggère que le workflow ne trouve pas `org_id` dans la structure reçue

## 🛠️ **SOLUTIONS À TESTER CÔTÉ N8N :**

### **Solution 1 - Modifier le node de validation n8n (ligne 22) :**
```javascript
// ANCIEN CODE (qui échoue)
const input = $input.first().json;
if (!input.org_id) {
  throw new Error('Missing required field: org_id');
}

// NOUVEAU CODE (à tester)
const webhookData = $input.first().json;
const input = webhookData.body || webhookData;

console.log('=== DEBUG WEBHOOK RECEPTION ===');
console.log('Webhook data keys:', Object.keys(webhookData));
console.log('Input keys:', Object.keys(input));
console.log('org_id direct:', webhookData.org_id);
console.log('org_id in body:', webhookData.body?.org_id);

if (!input.org_id) {
  throw new Error(`Missing required field: org_id. Received keys: ${Object.keys(input).join(', ')}`);
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

## 🔍 **DIAGNOSTIC REQUIS :**

### **Côté N8N - Ajouter ces logs dans le node de validation :**
```javascript
// Au début du node qui échoue (ligne 22)
console.log('=== STRUCTURE REÇUE PAR N8N ===');
console.log('Full input object:', JSON.stringify($input.first(), null, 2));
console.log('JSON keys:', Object.keys($input.first().json || {}));
console.log('Has body wrapper?', !!$input.first().json?.body);
console.log('org_id location test:');
console.log('  - Direct:', $input.first().json?.org_id);
console.log('  - In body:', $input.first().json?.body?.org_id);
console.log('  - In params:', $input.first().json?.params?.org_id);
```

## 🎯 **HYPOTHÈSES SUR LA CAUSE :**

### **Hypothèse 1 - Wrapping automatique par n8n :**
N8N reçoit peut-être :
```json
{
  "body": {
    "org_id": "test123",
    "pdf_base64": "...",
    "current_data": { ... }
  },
  "headers": { ... },
  "params": { ... }
}
```

### **Hypothèse 2 - Parsing JSON incorrect :**
Le workflow essaie d'accéder à `input.org_id` mais devrait accéder à `input.body.org_id`

### **Hypothèse 3 - Headers mal configurés :**
Le Content-Type n'est pas reconnu et les données sont parsées comme du texte

## 📋 **DONNÉES RÉELLES ENVOYÉES (basées sur l'image fournie) :**

```json
{
  "org_id": "test123",
  "pdf_base64": "data:application/pdf;base64,[LONG_BASE64_STRING]",
  "logo_base64": "data:image/jpeg;base64,[LONG_BASE64_STRING]", 
  "tempo_image_base64": "data:image/png;base64,[LONG_BASE64_STRING]",
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
    "numero_tva": "MA123456789",
    "rcs": "Casablanca 123456",
    "forme_juridique": "SARL",
    "capital_social": 100000,
    "logo_url": ""
  }
}
```

## 🔧 **ACTIONS REQUISES CÔTÉ N8N :**

1. **Ajouter les logs de debug** dans le node de validation (ligne 22)
2. **Tester l'accès** à `input.body.org_id` au lieu de `input.org_id`
3. **Vérifier** si n8n wrappe automatiquement les données JSON dans un objet `body`

## 🧪 **TEST SIMPLE POUR VALIDATION :**

```bash
# Test minimal pour vérifier la réception
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/company-extractor \
  -H "Content-Type: application/json" \
  -d '{"org_id": "test123", "test": "minimal"}'
```

## 🎯 **OBJECTIF :**

Identifier pourquoi le workflow n8n ne trouve pas `org_id` alors que l'application l'envoie correctement dans la structure JSON.

**Le problème est probablement dans la façon dont le workflow n8n parse les données reçues, pas dans l'envoi depuis l'application.**