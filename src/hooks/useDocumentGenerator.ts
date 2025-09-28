import { useState } from 'react';

interface DocumentGenerationResult {
  success: boolean;
  document_numero?: string;
  client_name?: string;
  total_amount?: string;
  html_content?: string;
  created_at?: string;
  error?: string;
}

export const useDocumentGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateDocument = async (documentId: string): Promise<DocumentGenerationResult> => {
    setIsGenerating(true);
    
    const webhookUrl = 'https://n8n.srv782553.hstgr.cloud/webhook/generate-document';
    
    try {
      console.log('Génération document pour ID:', documentId);
      
      // Détection de l'environnement
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('webcontainer-api.io');
      
      if (isDevelopment) {
        console.warn('Mode développement - génération simulée');
        
        // En développement, informer l'utilisateur
        alert('Mode développement détecté.\n\nLa génération de documents fonctionnera en production.\n\nPour tester maintenant, utilisez la commande curl dans le terminal ou déployez l\'application.');
        return { success: false, message: 'Test en développement' };
      }
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ document_id: documentId })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const result: DocumentGenerationResult = await response.json();
      
      if (result.success && result.html_content) {
        // Créer et ouvrir le document HTML
        const htmlBlob = new Blob([result.html_content], { type: 'text/html' });
        const url = URL.createObjectURL(htmlBlob);
        window.open(url, '_blank');
        
        // Nettoyer l'URL après ouverture
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('Document généré avec succès:', result.document_numero);
        
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la génération du document');
      }
      
    } catch (error) {
      console.error('Erreur génération document:', error);
      
      // Détection des erreurs de développement
      const isDevelopmentError = (error as Error).message.includes('Failed to fetch') && 
                                (window.location.hostname === 'localhost' || 
                                 window.location.hostname.includes('webcontainer-api.io'));
      
      if (isDevelopmentError) {
        alert('Impossible de générer le document en mode développement à cause des restrictions CORS.\n\nCela fonctionnera en production ou vous pouvez tester avec curl.');
      } else {
        // Message d'erreur plus spécifique pour la production
        let userMessage = 'Erreur lors de la génération du document';
        
        if ((error as Error).message.includes('404')) {
          userMessage = 'Workflow de génération non trouvé. Vérifiez la configuration N8N.';
        } else if ((error as Error).message.includes('500')) {
          userMessage = 'Erreur interne du serveur de génération. Vérifiez les logs N8N.';
        }
        
        alert(userMessage + '\n\nDétails: ' + (error as Error).message);
      }
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  return { generateDocument, isGenerating };
};

export default useDocumentGenerator;