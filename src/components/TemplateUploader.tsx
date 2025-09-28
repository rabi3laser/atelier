import React, { useState } from 'react';
import { Upload, FileType, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import TemplateUploadInterface from './TemplateUploadInterface';

interface TemplateUploaderProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export default function TemplateUploader({ onSuccess, onError }: TemplateUploaderProps) {
  const handleUploadSuccess = (response: any) => {
    console.log('✅ Template upload réussi:', response);
    onSuccess();
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Erreur upload template:', error);
    onError?.(error);
  };
  return (
    <TemplateUploadInterface
      orgId="default"
      onSuccess={handleUploadSuccess}
      onError={handleUploadError}
    />
  );
}