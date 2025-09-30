import React from 'react';
import QuickDevisGenerator from '../components/QuickDevisGenerator';

export default function QuickDevis() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Générateur de Devis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Créez des devis professionnels rapidement avec nos outils intelligents
        </p>
      </div>

      <QuickDevisGenerator />
    </div>
  );
}