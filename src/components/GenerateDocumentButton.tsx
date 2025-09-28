import React from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import useDocumentGenerator from '../hooks/useDocumentGenerator';
import Button from './Button';

interface GenerateDocumentButtonProps {
  documentId: string;
  documentType?: 'DEVIS' | 'FACTURE' | 'COMMANDE';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export default function GenerateDocumentButton({ 
  documentId, 
  documentType = "DEVIS",
  variant = "primary",
  size = "md",
  className = "",
  showLabel = true
}: GenerateDocumentButtonProps) {
  const { generateDocument, isGenerating } = useDocumentGenerator();
  
  const handleGenerate = async () => {
    try {
      console.log(`🎯 Génération ${documentType} pour ID:`, documentId);
      
      const result = await generateDocument(documentId);
      
      // Notification de succès
      if (result.success) {
        console.log(`✅ ${documentType} généré:`, result.document_numero);
        
        // Vous pouvez ajouter ici une notification toast si vous en avez
        // toast.success(`${documentType} ${result.document_numero} généré avec succès`);
      }
    } catch (error) {
      console.error(`❌ Erreur génération ${documentType}:`, error);
      
      // Notification d'erreur simple
      alert(`Erreur lors de la génération du ${documentType.toLowerCase()}: ${(error as Error).message}`);
      
      // Vous pouvez remplacer par un système de toast plus élégant
      // toast.error(`Erreur génération ${documentType}: ${error.message}`);
    }
  };
  
  const getIcon = () => {
    if (isGenerating) {
      return <Loader2 size={16} className="animate-spin" />;
    }
    
    switch (documentType) {
      case 'FACTURE':
        return <Download size={16} />;
      case 'COMMANDE':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };
  
  const getLabel = () => {
    if (isGenerating) {
      return 'Génération...';
    }
    
    if (!showLabel) {
      return null;
    }
    
    switch (documentType) {
      case 'FACTURE':
        return 'Générer facture';
      case 'COMMANDE':
        return 'Générer commande';
      default:
        return 'Générer PDF';
    }
  };
  
  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !documentId}
      variant={variant}
      size={size}
      className={className}
      title={`Générer ${documentType.toLowerCase()} PDF via workflow n8n`}
    >
      {getIcon()}
      {showLabel && getLabel() && (
        <span className="ml-2">{getLabel()}</span>
      )}
    </Button>
  );
}