# Prompt pour Claude IA - Création de 3 workflows n8n pour système de devis PDF

Bonjour Claude, j'ai besoin que tu me créés 3 workflows n8n complets et fonctionnels pour un système de génération automatique de devis PDF avec templates personnalisés.

## 🎯 **Contexte général :**
Application de gestion d'atelier laser (découpe/gravure) au Maroc avec :
- Base de données Supabase PostgreSQL
- Frontend React/TypeScript 
- Système de devis avec templates PDF personnalisables
- Génération automatique de PDF via Gotenberg
- Envoi automatique par email/WhatsApp

## 🔗 **3 workflows à créer :**

### 1. **Template Ingestion** (ID: MiN78Eu9dsp0KFNu)
```
URL: POST https://n8n.srv782553.hstgr.cloud/webhook/template/upload
Purpose: Upload PDF/PNG → Génération template HTML optimisé
```

### 2. **Generate Quote PDF** (ID: Id5nBudYoeXMjOLd)  
```
URL: POST https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate
Purpose: Données devis + template → PDF final via Gotenberg
```

### 3. **Send & Track** (ID: pHWoIi4xTxufCEu7)
```
URL: POST https://n8n.srv782553.hstgr.cloud/webhook/quotes/send
Purpose: Envoi email/WhatsApp + suivi ouverture/signature
```

---

## 🔧 **WORKFLOW 1 : Template Ingestion**

### 📥 **Input (multipart/form-data) :**
```
POST /webhook/template/upload
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="template.pdf"
Content-Type: application/pdf
[binary_pdf_data]

--boundary
Content-Disposition: form-data; name="name"
Mon Template Devis

--boundary
Content-Disposition: form-data; name="org_id"
123e4567-e89b-12d3-a456-426614174000

--boundary--
```

### 🎯 **Traitement requis :**
1. **Validation fichier** : PDF/PNG/JPG, max 10MB
2. **Extraction métadonnées** : Dimensions, nombre de pages
3. **Conversion en HTML** : Template HTML avec zones placeholders
4. **Génération CSS** : Variables pour couleurs, polices, positions
5. **Upload Supabase Storage** : Sauvegarder fichier original
6. **Insertion BDD** : Créer enregistrement dans `quote_templates`

### 📤 **Output JSON :**
```json
{
  "success": true,
  "template_id": "tpl_123456789",
  "name": "Mon Template Devis",
  "html_template": "<div class='quote-template'>...</div>",
  "background_url": "https://supabase.co/storage/v1/object/public/templates/template_123.pdf",
  "css_vars": {
    "primary_color": "#1e40af",
    "font_family": "Arial, sans-serif",
    "logo_position": "top-left"
  },
  "placeholders": {
    "company_name": { "x": 50, "y": 750, "width": 200 },
    "quote_number": { "x": 400, "y": 750, "width": 100 },
    "customer_info": { "x": 50, "y": 600, "width": 250, "height": 100 },
    "items_table": { "x": 50, "y": 400, "width": 500, "height": 150 },
    "totals": { "x": 400, "y": 200, "width": 150, "height": 80 }
  },
  "processing_time": "2.3s"
}
```

---

## 🔧 **WORKFLOW 2 : Generate Quote PDF**

### 📥 **Input JSON :**
```json
{
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "template_id": "tpl_123456789",
  "quote_data": {
    "number": "DEV-2025-001",
    "date": "2025-01-06",
    "valid_until": "2025-01-20",
    "customer": {
      "name": "SARL ATLAS CONSTRUCTION",
      "address": "Zone Industrielle Sidi Bernoussi",
      "city": "Casablanca",
      "postal_code": "20600",
      "phone": "+212 522 98 76 54",
      "email": "contact@atlas-construction.ma",
      "ice": "001987654000000",
      "rc": "98765",
      "if": "12345"
    },
    "company": {
      "name": "DECOUPE EXPRESS",
      "address": "BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA",
      "city": "MOHAMMEDIA", 
      "postal_code": "28810",
      "phone": "TEL: 05 23 30 58 80 / 06 66 04 58 24",
      "email": "contact@decoupe-express.ma",
      "ice": "ICE: 002741154000000",
      "rc": "RC: 27441/14",
      "if": "IF: 40208300",
      "logo_url": "https://supabase.co/storage/v1/object/public/logos/logo.png"
    },
    "items": [
      {
        "line_number": 1,
        "sku": "INOX-2MM",
        "label": "Découpe laser acier inox 304 - 2mm",
        "qty": 3.250,
        "unit": "m²",
        "unit_price": 85.00,
        "discount": 5,
        "tax_rate": 20,
        "subtotal": 262.19,
        "tax_amount": 52.44,
        "total": 314.63,
        "notes": "Finition brossée"
      },
      {
        "line_number": 2,
        "sku": "PLIAGE-ALU",
        "label": "Pliage et soudure - Assemblage final",
        "qty": 1.000,
        "unit": "service",
        "unit_price": 450.00,
        "discount": 0,
        "tax_rate": 20,
        "subtotal": 450.00,
        "tax_amount": 90.00,
        "total": 540.00,
        "notes": "Soudure TIG"
      }
    ],
    "totals": {
      "subtotal": 712.19,
      "tax_amount": 142.44,
      "total": 854.63,
      "currency": "MAD"
    },
    "payment_terms": "Paiement à 30 jours fin de mois",
    "notes": "Livraison sous 15 jours ouvrés"
  }
}
```

### 🎯 **Traitement requis :**
1. **Récupération template** : Depuis Supabase via template_id
2. **Génération HTML** : Fusion template + données devis
3. **Conversion PDF** : Via Gotenberg (HTML → PDF)
4. **Upload résultat** : Sauvegarder PDF dans Supabase Storage
5. **Mise à jour BDD** : Ajouter pdf_url dans table devis

### 📤 **Output JSON :**
```json
{
  "success": true,
  "quote": {
    "id": "quote_987654321",
    "number": "DEV-2025-001",
    "pdf_url": "https://supabase.co/storage/v1/object/public/quotes/DEV-2025-001.pdf",
    "html_preview": "<html>...</html>",
    "file_size": 245760,
    "pages": 1
  },
  "template_used": "Mon Template Devis",
  "generation_time": "2025-01-06T10:30:00Z",
  "processing_duration": "3.2s"
}
```

---

## 🔧 **WORKFLOW 3 : Send & Track**

### 📥 **Input JSON :**
```json
{
  "quote_id": "quote_987654321",
  "send_methods": ["email", "whatsapp"],
  "recipients": {
    "email": "contact@atlas-construction.ma",
    "phone": "+212 6 12 34 56 78"
  },
  "custom_message": "Bonjour,\n\nVeuillez trouver ci-joint votre devis DEV-2025-001.\n\nCordialement,\nDECOUPE EXPRESS",
  "options": {
    "send_reminders": true,
    "reminder_days": [3, 7, 15],
    "allow_signature": true,
    "track_opening": true,
    "auto_follow_up": true
  },
  "branding": {
    "company_name": "DECOUPE EXPRESS",
    "logo_url": "https://supabase.co/storage/v1/object/public/logos/logo.png",
    "primary_color": "#1e40af",
    "signature": "L'équipe DECOUPE EXPRESS\nTEL: 05 23 30 58 80"
  }
}
```

### 🎯 **Traitement requis :**
1. **Récupération PDF** : Depuis Supabase Storage
2. **Envoi Email** : Via SMTP avec tracking pixels
3. **Envoi WhatsApp** : Via API WhatsApp Business
4. **Génération liens** : URLs de suivi et signature
5. **Programmation relances** : Selon reminder_days
6. **Mise à jour BDD** : Statut envoi dans table devis

### 📤 **Output JSON :**
```json
{
  "success": true,
  "sent_via": ["email", "whatsapp"],
  "tracking": {
    "email_id": "email_123456",
    "whatsapp_id": "wa_789012",
    "tracking_url": "https://track.decoupe-express.ma/quote/DEV-2025-001",
    "signature_url": "https://sign.decoupe-express.ma/quote/DEV-2025-001"
  },
  "scheduled_reminders": [
    {
      "date": "2025-01-09T10:00:00Z",
      "method": "email",
      "reminder_id": "rem_001"
    },
    {
      "date": "2025-01-13T10:00:00Z", 
      "method": "whatsapp",
      "reminder_id": "rem_002"
    }
  ],
  "delivery_status": {
    "email": "delivered",
    "whatsapp": "sent"
  }
}
```

---

## 🗄️ **Schéma Supabase COMPLET :**

### **Tables existantes (à utiliser) :**
```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT DEFAULT '',
  code_postal TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  siret TEXT DEFAULT '',
  ice TEXT DEFAULT '',
  rc TEXT DEFAULT '',
  if TEXT DEFAULT '',
  conditions_paiement INTEGER DEFAULT 30,
  actif BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Devis
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  date_devis DATE DEFAULT CURRENT_DATE,
  date_validite DATE,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','envoye','accepte','refuse','expire')),
  montant_ht NUMERIC(12,2) DEFAULT 0,
  montant_tva NUMERIC(12,2) DEFAULT 0,
  montant_ttc NUMERIC(12,2) DEFAULT 0,
  taux_tva NUMERIC(5,2) DEFAULT 20.00,
  remise_globale_pct NUMERIC(5,2) DEFAULT 0,
  conditions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  template_id UUID REFERENCES quote_templates(id),
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lignes de devis
CREATE TABLE devis_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  ligne_numero INTEGER NOT NULL,
  matiere_id UUID REFERENCES matieres(id),
  designation TEXT NOT NULL,
  mode_facturation TEXT DEFAULT 'm2' CHECK (mode_facturation IN ('m2','feuille','service')),
  quantite NUMERIC(12,4) DEFAULT 1,
  prix_unitaire_ht NUMERIC(14,3),
  remise_pct NUMERIC(5,2) DEFAULT 0,
  montant_ht NUMERIC(15,2),
  tva_pct NUMERIC(5,2) DEFAULT 20,
  montant_tva NUMERIC(15,2),
  montant_ttc NUMERIC(15,2),
  notes TEXT DEFAULT '',
  UNIQUE(devis_id, ligne_numero)
);
```

### **Nouvelles tables (à créer par les workflows) :**
```sql
-- Templates de devis
CREATE TABLE quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  html_template TEXT NOT NULL,
  css_vars JSONB DEFAULT '{}',
  placeholders JSONB DEFAULT '{}',
  background_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assets de branding
CREATE TABLE branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  palette JSONB DEFAULT '{}',
  fonts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Politiques RLS
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access quote_templates" ON quote_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access branding_assets" ON branding_assets FOR ALL USING (true) WITH CHECK (true);
```

---

## 🔧 **WORKFLOW 1 DÉTAILLÉ : Template Ingestion**

### **Étapes du workflow :**

1. **Webhook Trigger**
   - URL: `/webhook/template/upload`
   - Method: POST
   - Content-Type: multipart/form-data

2. **File Validation Node**
   ```javascript
   // Valider le fichier uploadé
   const file = $input.binary.file;
   const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
   const maxSize = 10 * 1024 * 1024; // 10MB
   
   if (!allowedTypes.includes(file.mimeType)) {
     throw new Error('Type de fichier non supporté');
   }
   
   if (file.fileSize > maxSize) {
     throw new Error('Fichier trop volumineux (max 10MB)');
   }
   
   return {
     file_data: file.data,
     file_name: $node.parameter.name || file.fileName,
     file_type: file.mimeType,
     file_size: file.fileSize
   };
   ```

3. **Supabase Storage Upload**
   - Bucket: `templates`
   - Path: `templates/{timestamp}_{filename}`
   - Public: true

4. **Template Processing Node**
   ```javascript
   // Générer template HTML selon le type
   const fileType = $json.file_type;
   let htmlTemplate = '';
   let placeholders = {};
   
   if (fileType === 'application/pdf') {
     // Template PDF - zones prédéfinies
     htmlTemplate = `
       <div class="quote-template pdf-based" style="position: relative; width: 595px; height: 842px; background-image: url('${$json.background_url}');">
         <div class="company-info" data-zone="company" style="position: absolute; top: 50px; left: 50px;">
           {{company_name}}<br>
           {{company_address}}<br>
           {{company_phone}}
         </div>
         <div class="quote-number" data-zone="number" style="position: absolute; top: 50px; right: 50px;">
           Devis N° {{quote_number}}
         </div>
         <div class="quote-date" data-zone="date" style="position: absolute; top: 80px; right: 50px;">
           Date: {{quote_date}}
         </div>
         <div class="customer-info" data-zone="customer" style="position: absolute; top: 200px; left: 50px;">
           {{customer_name}}<br>
           {{customer_address}}<br>
           {{customer_city}}
         </div>
         <div class="items-table" data-zone="items" style="position: absolute; top: 350px; left: 50px; width: 500px;">
           {{items_table}}
         </div>
         <div class="totals" data-zone="totals" style="position: absolute; bottom: 100px; right: 50px;">
           {{totals_section}}
         </div>
       </div>
     `;
     
     placeholders = {
       company: { x: 50, y: 750, width: 200, height: 80 },
       number: { x: 400, y: 750, width: 150, height: 30 },
       date: { x: 400, y: 720, width: 150, height: 30 },
       customer: { x: 50, y: 600, width: 250, height: 100 },
       items: { x: 50, y: 400, width: 500, height: 150 },
       totals: { x: 400, y: 200, width: 150, height: 80 }
     };
   } else {
     // Template Image - zones flexibles
     htmlTemplate = `
       <div class="quote-template image-based" style="position: relative; background-image: url('${$json.background_url}'); background-size: cover;">
         <!-- Zones configurables -->
         <div class="overlay-content">
           {{dynamic_content}}
         </div>
       </div>
     `;
   }
   
   return {
     html_template: htmlTemplate,
     placeholders: placeholders,
     css_vars: {
       primary_color: '#1e40af',
       secondary_color: '#64748b',
       font_family: 'Arial, sans-serif',
       font_size_base: '12px'
     }
   };
   ```

5. **Supabase Insert**
   - Table: `quote_templates`
   - Données: template généré + métadonnées

### **Gestion d'erreurs :**
```javascript
// Node Error Handler
if ($json.error) {
  return {
    success: false,
    error: $json.error,
    message: 'Échec du traitement du template',
    details: $json.details || 'Erreur inconnue'
  };
}
```

---

## 🔧 **WORKFLOW 2 DÉTAILLÉ : Generate Quote PDF**

### **Étapes du workflow :**

1. **Webhook Trigger**
   - URL: `/webhook/quotes/generate`
   - Method: POST
   - Content-Type: application/json

2. **Data Validation Node**
   ```javascript
   // Valider les données obligatoires
   const required = ['quote_data.number', 'quote_data.customer.name', 'quote_data.items'];
   const missing = required.filter(field => {
     const value = field.split('.').reduce((obj, key) => obj?.[key], $json);
     return !value;
   });
   
   if (missing.length > 0) {
     throw new Error(`Champs obligatoires manquants: ${missing.join(', ')}`);
   }
   
   return $json;
   ```

3. **Template Retrieval**
   ```javascript
   // Récupérer template depuis Supabase
   const templateId = $json.template_id;
   let template;
   
   if (templateId) {
     // Template spécifique
     const { data } = await supabase
       .from('quote_templates')
       .select('*')
       .eq('id', templateId)
       .single();
     template = data;
   } else {
     // Template par défaut
     const { data } = await supabase
       .from('quote_templates')
       .select('*')
       .eq('is_default', true)
       .single();
     template = data;
   }
   
   if (!template) {
     throw new Error('Aucun template disponible');
   }
   
   return { ...$json, template };
   ```

4. **HTML Generation Node**
   ```javascript
   // Générer HTML final avec données
   const template = $json.template;
   const quoteData = $json.quote_data;
   
   let html = template.html_template;
   
   // Remplacer les placeholders
   const replacements = {
     '{{company_name}}': quoteData.company.name,
     '{{company_address}}': quoteData.company.address,
     '{{company_phone}}': quoteData.company.phone,
     '{{quote_number}}': quoteData.number,
     '{{quote_date}}': new Date(quoteData.date).toLocaleDateString('fr-FR'),
     '{{customer_name}}': quoteData.customer.name,
     '{{customer_address}}': quoteData.customer.address,
     '{{customer_city}}': `${quoteData.customer.postal_code} ${quoteData.customer.city}`,
   };
   
   // Générer tableau des articles
   const itemsHtml = quoteData.items.map(item => `
     <tr>
       <td>${item.label}</td>
       <td style="text-align: right">${item.qty.toFixed(3)}</td>
       <td style="text-align: right">${item.unit_price.toFixed(2)} MAD</td>
       <td style="text-align: right">${item.discount}%</td>
       <td style="text-align: right">${item.total.toFixed(2)} MAD</td>
     </tr>
   `).join('');
   
   replacements['{{items_table}}'] = `
     <table style="width: 100%; border-collapse: collapse;">
       <thead>
         <tr style="background-color: #f3f4f6;">
           <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Désignation</th>
           <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Qté</th>
           <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Prix U.</th>
           <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Remise</th>
           <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
         </tr>
       </thead>
       <tbody>
         ${itemsHtml}
       </tbody>
     </table>
   `;
   
   // Générer section totaux
   replacements['{{totals_section}}'] = `
     <div style="text-align: right;">
       <div>Total HT: ${quoteData.totals.subtotal.toFixed(2)} MAD</div>
       <div>TVA (20%): ${quoteData.totals.tax_amount.toFixed(2)} MAD</div>
       <div style="font-weight: bold; font-size: 14px;">Total TTC: ${quoteData.totals.total.toFixed(2)} MAD</div>
     </div>
   `;
   
   // Appliquer tous les remplacements
   Object.entries(replacements).forEach(([placeholder, value]) => {
     html = html.replace(new RegExp(placeholder, 'g'), value);
   });
   
   return { ...quoteData, final_html: html };
   ```

5. **Gotenberg PDF Generation**
   ```javascript
   // Configuration Gotenberg
   const gotenbergUrl = 'http://gotenberg:3000/forms/chromium/convert/html';
   
   const formData = new FormData();
   formData.append('files', new Blob([finalHtml], { type: 'text/html' }), 'quote.html');
   
   // Options PDF
   const options = {
     paperWidth: '8.27',      // A4 width in inches
     paperHeight: '11.7',     // A4 height in inches
     marginTop: '0.5',
     marginBottom: '0.5',
     marginLeft: '0.5',
     marginRight: '0.5',
     preferCSSPageSize: 'false',
     printBackground: 'true',
     scale: '1.0'
   };
   
   Object.entries(options).forEach(([key, value]) => {
     formData.append(key, value);
   });
   
   const response = await fetch(gotenbergUrl, {
     method: 'POST',
     body: formData
   });
   
   if (!response.ok) {
     throw new Error('Erreur génération PDF Gotenberg');
   }
   
   return {
     pdf_buffer: await response.arrayBuffer(),
     content_type: 'application/pdf'
   };
   ```

6. **Supabase Storage Upload**
   - Bucket: `quotes`
   - Path: `quotes/{quote_number}_{timestamp}.pdf`

7. **Database Update**
   ```javascript
   // Mettre à jour le devis avec l'URL du PDF
   await supabase
     .from('devis')
     .update({
       pdf_url: pdfUrl,
       updated_at: new Date().toISOString()
     })
     .eq('numero', quoteNumber);
   ```

---

## 🔧 **WORKFLOW 3 DÉTAILLÉ : Send & Track**

### **Étapes du workflow :**

1. **Webhook Trigger**
   - URL: `/webhook/quotes/send`
   - Method: POST

2. **Quote Data Retrieval**
   ```javascript
   // Récupérer données complètes du devis
   const { data: devis } = await supabase
     .from('devis')
     .select(`
       *,
       clients(*),
       devis_lignes(*)
     `)
     .eq('id', $json.quote_id)
     .single();
   
   if (!devis) {
     throw new Error('Devis non trouvé');
   }
   
   return { ...devis, send_options: $json };
   ```

3. **Email Sending Node** (si email dans send_methods)
   ```javascript
   // Configuration SMTP
   const emailConfig = {
     host: 'smtp.gmail.com', // ou votre SMTP
     port: 587,
     secure: false,
     auth: {
       user: 'contact@decoupe-express.ma',
       pass: process.env.SMTP_PASSWORD
     }
   };
   
   const emailData = {
     from: 'DECOUPE EXPRESS <contact@decoupe-express.ma>',
     to: $json.send_options.recipients.email,
     subject: `Devis ${$json.numero} - DECOUPE EXPRESS`,
     html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
           <h1>DECOUPE EXPRESS</h1>
           <p>Votre devis est prêt</p>
         </div>
         
         <div style="padding: 20px;">
           <p>Bonjour ${$json.clients.nom},</p>
           
           <p>${$json.send_options.custom_message}</p>
           
           <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
             <h3>Détails du devis :</h3>
             <ul style="list-style: none; padding: 0;">
               <li><strong>Numéro :</strong> ${$json.numero}</li>
               <li><strong>Date :</strong> ${new Date($json.date_devis).toLocaleDateString('fr-FR')}</li>
               <li><strong>Montant TTC :</strong> ${$json.montant_ttc.toFixed(2)} MAD</li>
               <li><strong>Validité :</strong> ${new Date($json.date_validite).toLocaleDateString('fr-FR')}</li>
             </ul>
           </div>
           
           <div style="text-align: center; margin: 30px 0;">
             <a href="{{tracking_url}}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
               Voir le devis
             </a>
           </div>
           
           <p style="color: #6b7280; font-size: 12px;">
             DECOUPE EXPRESS - TEL: 05 23 30 58 80<br>
             ICE: 002741154000000 - RC: 27441/14
           </p>
         </div>
       </div>
     `,
     attachments: [{
       filename: `devis-${$json.numero}.pdf`,
       path: $json.pdf_url
     }]
   };
   
   // Ajouter pixel de tracking
   const trackingPixel = `<img src="https://track.decoupe-express.ma/open/${$json.id}" width="1" height="1" style="display:none;">`;
   emailData.html += trackingPixel;
   
   return emailData;
   ```

4. **WhatsApp Sending Node** (si whatsapp dans send_methods)
   ```javascript
   // API WhatsApp Business
   const whatsappData = {
     to: $json.send_options.recipients.phone,
     type: 'template',
     template: {
       name: 'quote_notification',
       language: { code: 'fr' },
       components: [
         {
           type: 'header',
           parameters: [
             {
               type: 'document',
               document: {
                 link: $json.pdf_url,
                 filename: `devis-${$json.numero}.pdf`
               }
             }
           ]
         },
         {
           type: 'body',
           parameters: [
             { type: 'text', text: $json.clients.nom },
             { type: 'text', text: $json.numero },
             { type: 'text', text: $json.montant_ttc.toFixed(2) }
           ]
         }
       ]
     }
   };
   
   return whatsappData;
   ```

5. **Tracking Setup Node**
   ```javascript
   // Créer liens de suivi
   const baseUrl = 'https://track.decoupe-express.ma';
   const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   
   const trackingData = {
     tracking_id: trackingId,
     tracking_url: `${baseUrl}/quote/${$json.numero}?track=${trackingId}`,
     signature_url: `${baseUrl}/sign/${$json.numero}?track=${trackingId}`,
     analytics_url: `${baseUrl}/analytics/${trackingId}`
   };
   
   return trackingData;
   ```

6. **Reminder Scheduling** (si send_reminders = true)
   ```javascript
   // Programmer les relances
   const reminderDays = [3, 7, 15]; // Jours après envoi
   const reminders = [];
   
   reminderDays.forEach((days, index) => {
     const reminderDate = new Date();
     reminderDate.setDate(reminderDate.getDate() + days);
     
     reminders.push({
       reminder_id: `rem_${$json.numero}_${index + 1}`,
       scheduled_date: reminderDate.toISOString(),
       method: index === 0 ? 'email' : 'whatsapp',
       message_template: `Rappel: Votre devis ${$json.numero} expire bientôt`
     });
   });
   
   return { reminders };
   ```

7. **Database Update**
   ```javascript
   // Mettre à jour le devis
   await supabase
     .from('devis')
     .update({
       statut: 'envoye',
       sent_at: new Date().toISOString(),
       meta: {
         tracking_id: trackingId,
         sent_via: $json.send_options.send_methods,
         reminders_scheduled: reminders.length
       }
     })
     .eq('id', $json.quote_id);
   ```

---

## 🔒 **Configuration sécurité et environnement :**

### **Variables d'environnement n8n :**
```bash
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre-service-key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact@decoupe-express.ma
SMTP_PASSWORD=votre-mot-de-passe-app

# WhatsApp Business API
WHATSAPP_TOKEN=votre-token-whatsapp
WHATSAPP_PHONE_ID=votre-phone-id

# Gotenberg
GOTENBERG_URL=http://gotenberg:3000

# Tracking
TRACKING_BASE_URL=https://track.decoupe-express.ma
```

### **Gestion d'erreurs globale :**
```javascript
// Node Error Handler (sur chaque workflow)
const errorResponse = {
  success: false,
  error: $json.error?.message || 'Erreur inconnue',
  workflow_id: '{{workflow_id}}',
  timestamp: new Date().toISOString(),
  input_data: $json
};

// Log dans Supabase pour debug
await supabase
  .from('workflow_logs')
  .insert({
    workflow_name: '{{workflow_name}}',
    status: 'error',
    error_message: errorResponse.error,
    input_data: $json,
    created_at: new Date().toISOString()
  });

return errorResponse;
```

---

## 🧪 **Tests complets à effectuer :**

### **Test 1 - Template Ingestion :**
```bash
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/template/upload \
  -F "file=@template-test.pdf" \
  -F "name=Template Test" \
  -F "org_id=test-org-123"
```

### **Test 2 - Generate Quote PDF :**
```bash
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/quotes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "tpl_123",
    "quote_data": {
      "number": "TEST-001",
      "customer": {"name": "Client Test"},
      "items": [{"label": "Test", "qty": 1, "unit_price": 100}],
      "totals": {"total": 120}
    }
  }'
```

### **Test 3 - Send & Track :**
```bash
curl -X POST https://n8n.srv782553.hstgr.cloud/webhook/quotes/send \
  -H "Content-Type: application/json" \
  -d '{
    "quote_id": "quote_123",
    "send_methods": ["email"],
    "recipients": {"email": "test@example.com"}
  }'
```

---

## 🎯 **Résultat attendu :**

1. **Template Ingestion** : PDF uploadé → Template HTML dans Supabase
2. **Generate Quote PDF** : Données devis → PDF généré et stocké
3. **Send & Track** : PDF envoyé par email/WhatsApp avec suivi

**Créez ces 3 workflows n8n avec toutes ces spécifications pour une intégration parfaite avec l'application React/Supabase !** 🚀

## 📋 **Checklist finale :**
- [ ] Workflow 1 : Template Ingestion fonctionnel
- [ ] Workflow 2 : Generate Quote PDF fonctionnel  
- [ ] Workflow 3 : Send & Track fonctionnel
- [ ] Tests des 3 endpoints
- [ ] Gestion d'erreurs complète
- [ ] Logs et monitoring
- [ ] Variables d'environnement configurées
- [ ] Sécurité et validation des données