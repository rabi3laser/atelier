import React from 'react';

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}

export default function FormRow({ label, children, required = false, error }: FormRowProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}