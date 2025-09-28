import { supabase } from './supabase';

export interface QuoteTemplate {
  id: string;
  name: string;
  version: number;
  html_template: string;
  css_vars: Record<string, any>;
  placeholders: Record<string, any>;
  background_url?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandingAssets {
  id: string;
  logo_url?: string;
  palette: Record<string, string>;
  fonts: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TemplateUploadResponse {
  success: boolean;
  template_id?: string;
  html_template?: string;
  background_url?: string;
  error?: string;
}

export class TemplateService {
  private static N8N_URL = 'https://n8n.srv782553.hstgr.cloud';

  // Upload template via n8n workflow
  static async uploadTemplate(file: File, name?: string): Promise<TemplateUploadResponse> {
    try {
      console.log('📤 Upload template vers n8n:', file.name);
      
      // Préparer les données selon le nouveau format n8n
      const requestData = {
        body: {
          org_id: 'test123',
          name: name || file.name.replace(/\.[^/.]+$/, ''), // Nom sans extension
          file: {
            fileName: file.name,
            mimeType: file.type,
            fileSize: (file.size / 1024 / 1024).toFixed(2) + 'MB'
          }
        }
      };
      
      const response = await fetch('https://n8n.srv782553.hstgr.cloud/webhook/template/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Template uploadé:', result);
      
      // Le workflow n8n gère maintenant la sauvegarde en base
      if (result.success) {
        console.log('✅ Template traité par n8n:', result.template_id);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur upload template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Sauvegarder template dans Supabase
  static async saveTemplateToDatabase(template: Omit<QuoteTemplate, 'created_at' | 'updated_at' | 'version'>): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .insert({
        ...template,
        version: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Récupérer templates depuis Supabase
  static async getTemplates(): Promise<QuoteTemplate[]> {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Récupérer template par défaut
  static async getDefaultTemplate(): Promise<QuoteTemplate | null> {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Définir template par défaut
  static async setDefaultTemplate(templateId: string): Promise<void> {
    // Retirer default des autres
    await supabase
      .from('quote_templates')
      .update({ is_default: false });
    
    // Définir nouveau default
    const { error } = await supabase
      .from('quote_templates')
      .update({ is_default: true })
      .eq('id', templateId);
    
    if (error) throw error;
  }

  // Supprimer template
  static async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) throw error;
  }

  // Gestion des assets de branding
  static async getBrandingAssets(): Promise<BrandingAssets | null> {
    const { data, error } = await supabase
      .from('branding_assets')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async updateBrandingAssets(assets: Partial<BrandingAssets>): Promise<BrandingAssets> {
    // Vérifier s'il existe déjà des assets
    const existing = await this.getBrandingAssets();
    
    if (existing) {
      const { data, error } = await supabase
        .from('branding_assets')
        .update({ ...assets, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('branding_assets')
        .insert(assets)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
}

export const templateService = TemplateService;