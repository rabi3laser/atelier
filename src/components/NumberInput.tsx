import React from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  decimals?: number;
}

export default function NumberInput({ decimals = 2, className = '', ...props }: NumberInputProps) {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';

  return (
    <input
      type="number"
      step={decimals > 0 ? `0.${'0'.repeat(decimals - 1)}1` : '1'}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
}