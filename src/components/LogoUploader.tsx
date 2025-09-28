import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import Card from './Card';

export default function LogoUploader() {
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', 'test123')
        .single();
      
      if (!error && data?.logo_url) {
        setCurrentLogo(data.logo_url);
      }
    } catch (error) {
      console.log('Aucun logo configuré');
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    setUploadResult(null);
    
    try {
      // Validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez JPG, PNG, GIF, SVG ou WebP.');
      }
      
      if (file.size > maxSize) {
        throw new Error('Fichier trop volumineux. Taille maximum: 2MB.');
      }
      
      console.log('📤 Upload logo vers bucket "logos"...', {
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + 'MB'
      });
      
      // Nom de fichier unique
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      // Upload vers le bucket "logos" (qui existe et a les bonnes politiques RLS)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Erreur upload:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload réussi:', uploadData);
      
      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(uploadData.path);
      
      console.log('🔗 URL publique générée:', urlData.publicUrl);
      
      // Vérifier si l'organisation existe
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', 'test123')
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Créer l'organisation si elle n'existe pas
        console.log('🏢 Création de l\'organisation test123...');
        const { error: createError } = await supabase
          .from('organizations')
          .insert({
            id: 'test123',
            name: 'Mon Atelier Laser',
            logo_url: urlData.publicUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('❌ Erreur création organisation:', createError);
          throw new Error(`Erreur création organisation: ${createError.message}`);
        }
        
        console.log('✅ Organisation créée avec succès');
      } else if (checkError) {
        throw new Error(`Erreur vérification organisation: ${checkError.message}`);
      } else {
        // Mettre à jour l'organisation existante
        console.log('🔄 Mise à jour organisation existante...');
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ 
            logo_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'test123');
        
        if (updateError) {
          console.error('❌ Erreur mise à jour:', updateError);
          throw new Error(`Erreur mise à jour: ${updateError.message}`);
        }
        
        console.log('✅ Organisation mise à jour');
      }
      
      setCurrentLogo(urlData.publicUrl);
      setUploadResult({
        success: true,
        message: 'Logo mis à jour avec succès'
      });
      
      console.log('✅ Logo sauvegardé dans organizations');
      
    } catch (error) {
      console.error('❌ Erreur complète upload logo:', error);
      setUploadResult({
        success: false,
        message: `Erreur lors de l'upload: ${(error as Error).message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  return (
    <Card title="Logo de l'entreprise">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            Uploadez le logo de votre entreprise pour l'inclure dans vos documents.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Formats acceptés : JPG, PNG, GIF, WebP</li>
            <li>Taille maximum : 2MB</li>
            <li>Résolution recommandée : 300x100px</li>
          </ul>
        </div>

        {/* Logo actuel */}
        {currentLogo && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Logo actuel :</h4>
            <img 
              src={currentLogo} 
              alt="Logo DECOUPE EXPRESS" 
              className="max-h-20 max-w-40 object-contain border border-gray-200 dark:border-gray-600 rounded bg-white"
            />
          </div>
        )}

        {/* Zone d'upload */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="logo-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {currentLogo ? 'Changer le logo' : 'Ajouter un logo'}
                </span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  Cliquez pour sélectionner un fichier
                </span>
              </label>
              <input
                id="logo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        {/* État de l'upload */}
        {uploading && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Upload en cours...
            </span>
          </div>
        )}

        {/* Résultat */}
        {uploadResult && (
          <div className={`flex items-center space-x-2 p-3 rounded ${
            uploadResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {uploadResult.success ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            )}
            <span className={`text-sm ${
              uploadResult.success 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {uploadResult.message}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}