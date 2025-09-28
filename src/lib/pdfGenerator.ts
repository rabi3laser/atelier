import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabase } from './supabase';
import { fmtMAD, num3, safeNum, nFixed } from './format';
import { N8nQuoteService } from './n8nQuoteService';

export interface DevisLigne {
  ligne_numero: number;
  designation: string;
  mode_facturation: string;
  quantite: number;
  prix_unitaire_ht: number;
  remise_pct: number;
  montant_ht: number;
  tva_pct: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
  matiere_id?: string;
}

export interface DevisData {
  numero: string;
  date_devis: string;
  date_validite?: string;
  client: {
    nom: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    ice?: string;
    rc?: string;
    if?: string;
  };
  entreprise?: {
    nom: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    ice?: string;
    rc?: string;
    if?: string;
    logo?: string;
  };
  lignes: DevisLigne[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  taux_tva: number;
  remise_globale_pct?: number;
  conditions?: string;
  notes?: string;
}

export interface TemplateZone {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TemplateConfig {
  zones: {
    entreprise: TemplateZone;
    numero: TemplateZone;
    date: TemplateZone;
    client: TemplateZone;
    lignes: TemplateZone;
    totaux: TemplateZone;
  };
}

type RawLigne = {
  ligne_numero?: number;
  designation?: string;
  libelle?: string;
  mode_facturation?: 'm2'|'feuille'|'service';
  mode?: 'm2'|'feuille'|'service';
  quantite?: number | string;
  qty?: number | string;
  prix_unitaire_ht?: number | string;
  remise_pct?: number | string;
  tva_pct?: number | string;
  montant_ht?: number | string;
  montant_tva?: number | string;
  montant_ttc?: number | string;
  notes?: string;
  matiere_id?: string | null;
};

type LigneNorm = {
  ligne_numero: number;
  designation: string;
  mode_facturation: 'm2'|'feuille'|'service';
  quantite: number;
  prix_unitaire_ht: number;
  remise_pct: number;
  tva_pct: number;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
};

export class PDFGenerator {
  private templateConfig: TemplateConfig | null = null;
  private companyInfo: any = null;
  private companyInfoLoaded = false;

  constructor() {
    console.log('🔧 PDFGenerator initialisé');
  }

  private async loadCompanyInfo(): Promise<void> {
    if (this.companyInfoLoaded) {
      console.log('ℹ️ Informations entreprise déjà chargées');
      return;
    }
    
    console.log('📊 Chargement des informations entreprise...');
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('cle, valeur')
        .in('cle', [
          'entreprise_nom',
          'entreprise_adresse',
          'entreprise_code_postal',
          'entreprise_ville',
          'entreprise_telephone',
          'entreprise_email',
          'entreprise_ice',
          'entreprise_rc',
          'entreprise_if',
          'entreprise_logo'
        ]);

      if (!error && data) {
        this.companyInfo = data.reduce((acc: any, setting: any) => {
          const key = setting.cle.replace('entreprise_', '');
          acc[key] = setting.valeur;
          return acc;
        }, {});
        console.log('✅ Informations entreprise chargées:', this.companyInfo);
      } else {
        console.warn('⚠️ Erreur chargement settings:', error);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger les informations entreprise:', error);
    }

    // Valeurs par défaut DECOUPE EXPRESS
    if (!this.companyInfo || Object.keys(this.companyInfo).length === 0) {
      console.log('📝 Utilisation des valeurs par défaut DECOUPE EXPRESS');
      this.companyInfo = {
        nom: 'DECOUPE EXPRESS',
        adresse: 'BOULEVARD MOULAY YOUSSEF PARC INDUSTRIEL MOHAMMEDIA',
        code_postal: '28810',
        ville: 'MOHAMMEDIA',
        telephone: 'TEL: 05 23 30 58 80 / 06 66 04 58 24',
        email: 'contact@decoupe-express.ma',
        ice: 'ICE: 002741154000000',
        rc: 'RC: 27441/14',
        if: 'IF: 40208300'
      };
    }
    
    this.companyInfoLoaded = true;
  }

  private async enrichDevisData(devisData: DevisData): Promise<DevisData> {
    await this.loadCompanyInfo();
    
    return {
      ...devisData,
      entreprise: this.companyInfo
    };
  }

  private normalizeLigne(l: RawLigne, index: number): LigneNorm {
    const designation = (l.designation ?? l.libelle ?? '').toString();
    const mode_facturation = (l.mode_facturation ?? l.mode ?? 'm2') as LigneNorm['mode_facturation'];
    const quantite = safeNum(l.quantite ?? l.qty, 0);
    const pu = safeNum(l.prix_unitaire_ht, 0);
    const remise = safeNum(l.remise_pct, 0);
    const tva = safeNum(l.tva_pct, 20);

    const montant_ht_calc = +(quantite * pu * (1 - remise / 100)).toFixed(3);
    const ht = safeNum(l.montant_ht, montant_ht_calc);
    const tva_amt_calc = +(ht * (tva / 100)).toFixed(3);
    const mtva = safeNum(l.montant_tva, tva_amt_calc);
    const ttc_calc = +(ht + mtva).toFixed(3);
    const ttc = safeNum(l.montant_ttc, ttc_calc);

    return {
      ligne_numero: safeNum(l.ligne_numero, index + 1),
      designation,
      mode_facturation,
      quantite,
      prix_unitaire_ht: pu,
      remise_pct: remise,
      tva_pct: tva,
      montant_ht: ht,
      montant_tva: mtva,
      montant_ttc: ttc,
      notes: l.notes,
    };
  }

  private normalizeLignes(raw: RawLigne[] | undefined | null): LigneNorm[] {
    return (raw ?? [])
      .filter(Boolean)
      .map((l, i) => this.normalizeLigne(l as RawLigne, i));
  }

  async generatePDF(devisData: DevisData): Promise<Blob> {
    console.log('🚀 Génération PDF via n8n pour devis:', devisData.numero);
    
    try {
      // Convertir vers format n8n
      const n8nRequest = N8nQuoteService.convertDevisToN8nFormat(devisData);
      console.log('📊 Données converties pour n8n:', n8nRequest);
      
      // Appeler le workflow n8n
      const result = await N8nQuoteService.generateQuotePDF(n8nRequest);
      
      if (result.success && result.quote?.pdf_url) {
        console.log('✅ PDF généré via n8n:', result.quote.pdf_url);
        
        // Télécharger le PDF depuis l'URL pour retourner un Blob
        const pdfResponse = await fetch(result.quote.pdf_url);
        if (!pdfResponse.ok) {
          throw new Error('Impossible de télécharger le PDF généré');
        }
        
        return await pdfResponse.blob();
      } else {
        console.error('❌ Erreur n8n:', result.error);
        throw new Error(result.error || 'Erreur génération PDF via n8n');
      }
    } catch (error) {
      console.error('❌ Erreur workflow n8n, fallback vers génération locale:', error);
      
      // Fallback vers l'ancien système en cas d'erreur
      const enrichedData = await this.enrichDevisData(devisData);
      console.log('🔄 Fallback vers génération locale...');
      
      return await this.generateBasicPDF(enrichedData);
    }
  }

  private async generatePDFLegacy(devisData: DevisData): Promise<Blob> {
    console.log('🚀 Début génération PDF locale pour devis:', devisData.numero);
    
    const enrichedData = await this.enrichDevisData(devisData);
    console.log('📊 Données enrichies:', enrichedData);

    // Vérification du template
    const templateData = localStorage.getItem('devis_template');
    const templateName = localStorage.getItem('devis_template_name');
    const templateType = localStorage.getItem('devis_template_type');
    
    console.log('🎨 Diagnostic template complet:', {
      hasTemplate: !!templateData,
      templateName,
      templateType,
      templateLength: templateData?.length,
      templateStart: templateData?.substring(0, 100),
      isPDFFormat: templateData?.startsWith('data:application/pdf;base64,'),
      isImageFormat: templateData?.startsWith('data:image/'),
      actualFormat: templateData?.substring(0, 50)
    });
    
    if (templateData && (templateData.startsWith('data:application/pdf;base64,') || templateData.startsWith('data:image/'))) {
      console.log('🎯 UTILISATION DU TEMPLATE PERSONNALISÉ');
      
      try {
        return await this.generatePDFWithTemplate(enrichedData, templateData);
      } catch (error) {
        console.error('❌ Erreur avec le template, fallback vers PDF basique:', {
          error: (error as Error).message,
          stack: (error as Error).stack,
          templateStart: templateData.substring(0, 200),
          templateFormat: templateData.substring(0, 50)
        });
        console.log('🔄 Fallback vers PDF basique...');
      }
    } else {
      console.log('⚠️ AUCUN TEMPLATE VALIDE - Génération PDF basique');
    }

    console.log('📝 Génération PDF basique (sans template)');
    return await this.generateBasicPDF(enrichedData);
  }

  private async generatePDFWithTemplate(devisData: DevisData, templateData: string): Promise<Blob> {
    console.log('🎨 Génération PDF avec template...');
    
    let pdfDoc: PDFDocument;
    
    if (templateData.startsWith('data:application/pdf;base64,')) {
      console.log('📄 Chargement template PDF...');
      try {
        const templateBytes = this.loadPdfFromBase64(templateData);
        pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
        console.log('✅ Template PDF chargé avec succès');
      } catch (error) {
        console.error('❌ Erreur chargement template PDF:', error);
        throw error;
      }
    } else if (templateData.startsWith('data:image/')) {
      console.log('🖼️ Chargement template image...');
      try {
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        
        let image;
        if (templateData.includes('data:image/png')) {
          const imageBytes = this.loadImageFromBase64(templateData);
          image = await pdfDoc.embedPng(imageBytes);
        } else if (templateData.includes('data:image/jpeg') || templateData.includes('data:image/jpg')) {
          const imageBytes = this.loadImageFromBase64(templateData);
          image = await pdfDoc.embedJpg(imageBytes);
        }
        
        if (image) {
          const { width, height } = page.getSize();
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
          console.log('✅ Image template ajoutée en arrière-plan');
        }
      } catch (error) {
        console.error('❌ Erreur chargement template image:', error);
        throw error;
      }
    } else {
      throw new Error('Format de template non reconnu');
    }
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    console.log('✍️ Ajout des données sur le template DECOUPE EXPRESS...');

    // Positions ajustées pour votre template DECOUPE EXPRESS
    
    // Numéro de devis (dans le champ prévu)
    firstPage.drawText(devisData.numero, {
      x: 240, // Position du champ "Numéro de DEVIS"
      y: 770, // Ajusté pour votre template
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Date (dans le champ date)
    firstPage.drawText(new Date(devisData.date_devis).toLocaleDateString('fr-FR'), {
      x: 240, // Position du champ date
      y: 750, // Ajusté pour votre template
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Informations client (dans la zone client)
    let clientY = 680; // Position de la zone client
    const clientX = 50;

    firstPage.drawText(devisData.client.nom, {
      x: clientX,
      y: clientY,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    clientY -= 15;

    if (devisData.client.adresse) {
      firstPage.drawText(devisData.client.adresse, {
        x: clientX,
        y: clientY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      clientY -= 12;
    }

    if (devisData.client.code_postal && devisData.client.ville) {
      firstPage.drawText(`${devisData.client.code_postal} ${devisData.client.ville}`, {
        x: clientX,
        y: clientY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      clientY -= 12;
    }

    if (devisData.client.telephone) {
      firstPage.drawText(`Tél: ${devisData.client.telephone}`, {
        x: clientX,
        y: clientY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Lignes du devis (dans le tableau)
    let ligneY = 400; // Position du tableau
    const lignesNormalisees = this.normalizeLignes(devisData.lignes as any);
    
    console.log('📋 Ajout des lignes:', lignesNormalisees.length);
    
    // Positions des colonnes selon votre template
    const colPositions = {
      designation: 50,   // Colonne DESIGNATION
      quantite: 450,     // Colonne QUANTITE
      prix: 500,         // Colonne PRIX U.
      total: 650         // Colonne TOTAL
    };

    // Lignes de données
    lignesNormalisees.forEach((ligne) => {
      // Désignation
      firstPage.drawText(ligne.designation, {
        x: colPositions.designation,
        y: ligneY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      // Quantité
      firstPage.drawText(num3(ligne.quantite), {
        x: colPositions.quantite,
        y: ligneY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      // Prix unitaire
      firstPage.drawText(nFixed(ligne.prix_unitaire_ht, 2), {
        x: colPositions.prix,
        y: ligneY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      // Total
      firstPage.drawText(nFixed(ligne.montant_ht, 2), {
        x: colPositions.total,
        y: ligneY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      ligneY -= 15;
    });

    // Totaux (dans la zone totaux)
    const totalX = 650; // Position des totaux
    let totalY = 200; // Position verticale des totaux

    // Total HT
    firstPage.drawText(nFixed(devisData.montant_ht, 2), {
      x: totalX,
      y: totalY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    totalY -= 15;

    // TVA
    firstPage.drawText(nFixed(devisData.montant_tva, 2), {
      x: totalX,
      y: totalY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    totalY -= 15;

    // Total TTC
    firstPage.drawText(nFixed(devisData.montant_ttc, 2), {
      x: totalX,
      y: totalY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    console.log('💾 Sauvegarde du PDF avec template...');
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  private async generateBasicPDF(devisData: DevisData): Promise<Blob> {
    console.log('📝 Génération PDF basique avec informations DECOUPE EXPRESS...');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // En-tête entreprise DECOUPE EXPRESS
    console.log('🏢 Ajout informations DECOUPE EXPRESS');
    
    page.drawText('DECOUPE EXPRESS', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(1, 0.5, 0), // Orange comme dans votre logo
    });
    yPosition -= 25;

    if (devisData.entreprise?.adresse) {
      page.drawText(devisData.entreprise.adresse, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    if (devisData.entreprise?.code_postal && devisData.entreprise?.ville) {
      page.drawText(`${devisData.entreprise.code_postal} ${devisData.entreprise.ville}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    if (devisData.entreprise?.telephone) {
      page.drawText(devisData.entreprise.telephone, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    if (devisData.entreprise?.ice) {
      page.drawText(`ICE: ${devisData.entreprise.ice}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    }

    // Titre et numéro
    page.drawText('DEVIS', {
      x: width - 150,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`N° ${devisData.numero}`, {
      x: width - 150,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Date: ${new Date(devisData.date_devis).toLocaleDateString('fr-FR')}`, {
      x: width - 150,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Informations client
    yPosition = height - 200;
    page.drawText('Facturé à:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    page.drawText(devisData.client.nom, {
      x: 50,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;

    if (devisData.client.adresse) {
      page.drawText(devisData.client.adresse, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    if (devisData.client.code_postal && devisData.client.ville) {
      page.drawText(`${devisData.client.code_postal} ${devisData.client.ville}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    // Tableau des lignes
    yPosition = height - 350;
    const tableHeaders = ['Désignation', 'Qté', 'Prix U.', 'Remise', 'Total HT'];
    const colWidths = [250, 60, 80, 60, 80];
    let xPos = 50;

    // En-têtes
    tableHeaders.forEach((header, i) => {
      page.drawText(header, {
        x: xPos,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      xPos += colWidths[i];
    });

    yPosition -= 20;

    // Lignes normalisées
    const lignesNormalisees = this.normalizeLignes(devisData.lignes as any);
    console.log('📋 Rendu des lignes:', lignesNormalisees.length);
    
    lignesNormalisees.forEach((ligne) => {
      xPos = 50;
      const values = [
        ligne.designation,
        num3(ligne.quantite),
        `${nFixed(ligne.prix_unitaire_ht, 2)} DH`,
        `${nFixed(ligne.remise_pct, 0)}%`,
        `${nFixed(ligne.montant_ht, 2)} DH`
      ];

      values.forEach((value, i) => {
        page.drawText(value, {
          x: xPos,
          y: yPosition,
          size: 9,
          font,
          color: rgb(0, 0, 0),
        });
        xPos += colWidths[i];
      });
      yPosition -= 15;
    });

    // Totaux
    yPosition -= 20;
    const totals = [
      `Total HT: ${nFixed(devisData.montant_ht, 2)} DH`,
      `TVA (${nFixed(devisData.taux_tva, 0)}%): ${nFixed(devisData.montant_tva, 2)} DH`,
      `Total TTC: ${nFixed(devisData.montant_ttc, 2)} DH`
    ];

    totals.forEach((total) => {
      page.drawText(total, {
        x: width - 200,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    });

    console.log('💾 Sauvegarde PDF basique...');
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  private loadPdfFromBase64(b64: string): Uint8Array {
    console.log('🔄 Décodage Base64 PDF...');
    const clean = b64.replace(/^data:application\/pdf;base64,/, '').trim();
    const normalized = clean.replace(/\s/g, '');
    const bin = atob(normalized);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    
    const head = new TextDecoder().decode(bytes.slice(0, 5));
    if (head !== '%PDF-') {
      throw new Error('Base64 fourni ≠ PDF (pas de %PDF-)');
    }
    console.log('✅ PDF Base64 décodé avec succès');
    return bytes;
  }

  private loadImageFromBase64(b64: string): Uint8Array {
    console.log('🔄 Décodage Base64 image...');
    const clean = b64.replace(/^data:image\/[^;]+;base64,/, '').trim();
    const normalized = clean.replace(/\s/g, '');
    const bin = atob(normalized);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    console.log('✅ Image Base64 décodée avec succès');
    return bytes;
  }

  hasTemplate(): boolean {
    const template = localStorage.getItem('devis_template');
    const hasIt = !!template;
    console.log('🔍 Vérification template:', hasIt);
    return hasIt;
  }

  getTemplateConfig(): TemplateConfig | null {
    return this.templateConfig;
  }

  saveTemplateZones(zones: TemplateConfig['zones']): void {
    this.templateConfig = { zones };
    localStorage.setItem('pdf_template_zones', JSON.stringify(zones));
    console.log('💾 Zones template sauvegardées');
  }

  private getDefaultZones(): TemplateConfig['zones'] {
    const saved = localStorage.getItem('pdf_template_zones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.warn('⚠️ Erreur parsing zones sauvegardées');
      }
    }

    // Zones ajustées pour votre template DECOUPE EXPRESS
    return {
      entreprise: { x: 50, y: 750 },
      numero: { x: 240, y: 770 }, // Position du champ numéro dans votre template
      date: { x: 240, y: 750 },   // Position du champ date
      client: { x: 50, y: 680 },  // Zone client
      lignes: { x: 50, y: 400, width: 500, height: 200 }, // Tableau
      totaux: { x: 650, y: 200 }, // Zone totaux
    };
  }
}