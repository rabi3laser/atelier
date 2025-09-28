import React, { useState } from 'react';
import { QrCode, Search } from 'lucide-react';

interface ScanInputProps {
  placeholder?: string;
  onScan: (code: string) => void;
  className?: string;
}

export default function ScanInput({ placeholder = "Scanner code/QR ou saisir...", onScan, className = '' }: ScanInputProps) {
  const [value, setValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onScan(value.trim());
      setValue('');
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    // Simulation du scan - dans un vrai projet, on utiliserait une lib comme zxing-js
    setTimeout(() => {
      const mockCode = `SCAN-${Date.now().toString().slice(-6)}`;
      setValue(mockCode);
      onScan(mockCode);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-12 py-2 w-full border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white border border-blue-600 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Scanner QR Code"
        >
          <QrCode size={20} className={isScanning ? 'animate-pulse' : ''} />
        </button>
      </div>
      {isScanning && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
          📱 Simulation du scan en cours...
        </div>
      )}
    </form>
  );
}