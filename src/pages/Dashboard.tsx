import React from 'react';
import { Package, Users, TrendingUp, FileText, ShoppingCart, Receipt, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function Dashboard() {
  // Données simulées - à remplacer par de vraies données
  const recentActivities = [
    { type: 'devis', numero: 'DEV-2024-001', client: 'Client A', montant: 1250.00, date: '2024-01-15' },
    { type: 'commande', numero: 'CMD-2024-001', client: 'Client B', montant: 890.50, date: '2024-01-14' },
    { type: 'facture', numero: 'FACT-2024-001', client: 'Client C', montant: 2100.00, date: '2024-01-13' },
  ];

  const alerts = [
    { type: 'stock', message: 'Stock faible: Acier inox 2mm', level: 'warning' },
    { type: 'facture', message: '3 factures en retard de paiement', level: 'danger' },
    { type: 'production', message: '2 bons de travail en attente', level: 'info' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'devis': return FileText;
      case 'commande': return ShoppingCart;
      case 'facture': return Receipt;
      default: return FileText;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'danger': return <Badge variant="danger">Urgent</Badge>;
      case 'warning': return <Badge variant="warning">Attention</Badge>;
      case 'info': return <Badge variant="info">Info</Badge>;
      default: return <Badge>Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de votre atelier laser</p>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alertes</h3>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-900 dark:text-white">{alert.message}</span>
                {getAlertBadge(alert.level)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Stock total"
          value="1,247.5 m²"
          icon={Package}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Clients actifs"
          value="23"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="CA du mois"
          value="45,230.00 MAD"
          icon={TrendingUp}
          trend={{ value: 8.3, isPositive: true }}
        />
      </div>

      {/* Actions rapides */}
      <QuickActions />

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Activité récente">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Icon size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.numero}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.client}
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {activity.montant.toFixed(2)} MAD
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Résumé production">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-900 dark:text-white">Bons planifiés</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-900 dark:text-white">En cours</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">2</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-900 dark:text-white">Terminés ce mois</span>
              <span className="font-bold text-green-600 dark:text-green-400">18</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}