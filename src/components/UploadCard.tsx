import React, { useState } from 'react';
import { Upload, FileType, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { validateFile, formatFileSize, toBase64 } from '../lib/companyHelpers';
import type { FileValidation } from '../types/company';

interface UploadCardProps {
  title: string;
  description: string;
  accept: string;
  maxMB: number;
  mimes: string[];
  icon: 'pdf' | 'image';
  color: 'blue' | 'green' | 'purple';
  onFileSelect: (file: File, base64: string) => void;
  validation?: FileValidation;
  isProcessing?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-200',
    icon: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700'
  }
};

export default function UploadCard({
  title,
  description,
  accept,
  maxMB,
  mimes,
  icon,
  color,
  onFileSelect,
  validation,
  isProcessing = false
}: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const classes = colorClasses[color];
  const IconComponent = icon === 'pdf' ? FileType : Image;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    
    // Validation côté client
    const fileValidation = validateFile(file, { maxMB, mimes });
    if (!fileValidation.valid) {
      return; // L'erreur sera affichée via validation prop
    }
    
    try {
      setIsConverting(true);
      const base64 = await toBase64(file);
      onFileSelect(file, base64);
    } catch (error) {
      console.error('Erreur conversion base64:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const getStatusIcon = () => {
    if (isConverting || isProcessing) {
      return <div className="animate-spin h-5 w-5 border-b-2 border-current rounded-full" />;
    }
    
    if (validation?.valid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (validation?.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    
    return <IconComponent className={`w-5 h-5 ${classes.icon}`} />;
  };

  const getStatusMessage = () => {
    if (isConverting) return 'Conversion en cours...';
    if (isProcessing) return 'Traitement...';
    if (validation?.valid && selectedFile) {
      return `✓ ${selectedFile.name} (${validation.size})`;
    }
    if (validation?.error) return validation.error;
    return null;
  };

  return (
    <div className={`p-4 ${classes.bg} border ${classes.border} rounded-lg`}>
      {/* En-tête */}
      <div className="flex items-center space-x-2 mb-3">
        {getStatusIcon()}
        <span className={`font-medium ${classes.text}`}>
          {title}
        </span>
      </div>

      {/* Zone d'upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          id={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
          disabled={isConverting || isProcessing}
        />
        
        <label 
          htmlFor={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="cursor-pointer block"
        >
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedFile ? 'Changer le fichier' : 'Cliquer pour sélectionner'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </label>
      </div>

      {/* Statut */}
      {getStatusMessage() && (
        <div className={`mt-3 p-2 rounded text-sm ${
          validation?.valid 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : validation?.error
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {getStatusMessage()}
        </div>
      )}
    </div>
  );
}