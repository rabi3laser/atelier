import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ShoppingCart, Package, Users } from 'lucide-react';
import Button from './Button';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Nouveau client',
      icon: Users,
      onClick: () => navigate('/clients'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: 'Nouveau devis',
      icon: FileText,
      onClick: () => navigate('/quotes/new'),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Nouvelle commande',
      icon: ShoppingCart,
      onClick: () => navigate('/orders'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      label: 'Nouvelle matière',
      icon: Package,
      onClick: () => navigate('/materials'),
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2 hover:shadow-md`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}