import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { 
  PerformanceMensuelle, 
  AnalyseABCMatiere, 
  SuggestionRestock 
} from '../types/analytics';
import { 
  getPerformanceMensuelle, 
  getAnalyseABCMatieres, 
  getSuggestionsRestock 
} from '../lib/analytics';
import { fmtMAD, num3 } from '../lib/format';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Tabs from '../components/Tabs';

export default function Analytics() {
  const [performance, setPerformance] = useState<PerformanceMensuelle[]>([]);
  const [analyseABC, setAnalyseABC] = useState<AnalyseABCMatiere[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRestock[]>([]);
  const [activeTab, setActiveTab] = useState('performance');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [performanceData, abcData, suggestionsData] = await Promise.all([
        getPerformanceMensuelle(),
        getAnalyseABCMatieres(),
        getSuggestionsRestock(),
      ]);
      
      setPerformance(performanceData);
      setAnalyseABC(abcData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données analytiques:', error);
      // En cas d'erreur, définir des tableaux vides pour éviter les crashes
      setPerformance([]);
      setAnalyseABC([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getClasseABCBadge = (classe: string) => {
    const config = {
      A: { variant: 'success' as const, label: 'Classe A' },
      B: { variant: 'warning' as const, label: 'Classe B' },
      C: { variant: 'default' as const, label: 'Classe C' },
    };
    
    const classeConfig = config[classe as keyof typeof config];
    return classeConfig ? (
      <Badge variant={classeConfig.variant}>{classeConfig.label}</Badge>
    ) : (
      <Badge>{classe}</Badge>
    );
  };

  const getAlerteBadge = (niveau: string) => {
    const config = {
      URGENT: { variant: 'danger' as const, label: 'URGENT' },
      ATTENTION: { variant: 'warning' as const, label: 'ATTENTION' },
      SURVEILLER: { variant: 'info' as const, label: 'SURVEILLER' },
      OK: { variant: 'success' as const, label: 'OK' },
    };
    
    const alerteConfig = config[niveau as keyof typeof config];
    return alerteConfig ? (
      <Badge variant={alerteConfig.variant}>{alerteConfig.label}</Badge>
    ) : (
      <Badge>{niveau}</Badge>
    );
  };

  // Colonnes pour les tables
  const performanceColumns = [
    {
      key: 'mois',
      label: 'Mois',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      }),
    },
    {
      key: 'ca_ttc',
      label: 'CA TTC',
      render: (value: number) => (
        <div className="text-right font-medium text-green-600 dark:text-green-400">
          {fmtMAD(value)}
        </div>
      ),
    },
    {
      key: 'nb_factures',
      label: 'Nb Factures',
      render: (value: number) => (
        <div className="text-right">{value}</div>
      ),
    },
    {
      key: 'panier_moyen',
      label: 'Panier moyen',
      render: (value: number) => (
        <div className="text-right">{fmtMAD(value)}</div>
      ),
    },
    {
      key: 'production_totale_m2',
      label: 'Production',
      render: (value: number) => (
        <div className="text-right">{num3(value)} m²</div>
      ),
    },
    {
      key: 'ca_par_m2',
      label: 'CA/m²',
      render: (value: number) => (
        <div className="text-right font-medium">{fmtMAD(value)}</div>
      ),
    },
  ];

  const abcColumns = [
    {
      key: 'designation',
      label: 'Matière',
      render: (value: string, row: AnalyseABCMatiere) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'classe_abc',
      label: 'Classe',
      render: (value: string) => getClasseABCBadge(value),
    },
    {
      key: 'valeur_totale_mouvements',
      label: 'Valeur mouvements',
      render: (value: number) => (
        <div className="text-right font-medium">{fmtMAD(value)}</div>
      ),
    },
    {
      key: 'quantite_consommee',
      label: 'Qty consommée',
      render: (value: number) => (
        <div className="text-right">{num3(value)} m²</div>
      ),
    },
    {
      key: 'pourcentage_cumul',
      label: '% Cumulé',
      render: (value: number) => (
        <div className="text-right">{value}%</div>
      ),
    },
    {
      key: 'valeur_stock',
      label: 'Stock actuel',
      render: (value: number) => (
        <div className="text-right">{fmtMAD(value)}</div>
      ),
    },
  ];

  const suggestionsColumns = [
    {
      key: 'designation',
      label: 'Matière',
      render: (value: string, row: SuggestionRestock) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'niveau_alerte',
      label: 'Alerte',
      render: (value: string) => getAlerteBadge(value),
    },
    {
      key: 'quantite_disponible',
      label: 'Stock actuel',
      render: (value: number, row: SuggestionRestock) => (
        <div className="text-right">
          {num3(value)} {row.unite}
        </div>
      ),
    },
    {
      key: 'jours_stock_restant',
      label: 'Jours restants',
      render: (value: number) => (
        <div className={`text-right font-medium ${
          value <= 7 ? 'text-red-600 dark:text-red-400' :
          value <= 15 ? 'text-orange-600 dark:text-orange-400' :
          value <= 30 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {value === 999 ? '∞' : `${value}j`}
        </div>
      ),
    },
    {
      key: 'conso_moyenne_jour',
      label: 'Conso/jour',
      render: (value: number, row: SuggestionRestock) => (
        <div className="text-right text-sm">
          {num3(value)} {row.unite}
        </div>
      ),
    },
    {
      key: 'quantite_suggeree',
      label: 'Qty suggérée',
      render: (value: number, row: SuggestionRestock) => (
        <div className="text-right font-medium text-blue-600 dark:text-blue-400">
          {num3(value)} {row.unite}
        </div>
      ),
    },
  ];

  const tabs = [
    {
      id: 'performance',
      label: 'Performance mensuelle',
      content: (
        <div className="space-y-6">
          {/* KPIs rapides */}
          {performance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">CA ce mois</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {fmtMAD(performance[0]?.ca_ttc || 0)}
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Factures</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {performance[0]?.nb_factures || 0}
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Production</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {num3(performance[0]?.production_totale_m2 || 0)} m²
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">CA/m²</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {fmtMAD(performance[0]?.ca_par_m2 || 0)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          <Card title="Évolution mensuelle">
            <Table columns={performanceColumns} data={performance} />
            {performance.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune donnée de performance disponible
              </div>
            )}
          </Card>
        </div>
      ),
    },
    {
      id: 'abc',
      label: 'Analyse ABC',
      content: (
        <Card title="Classification ABC des matières">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Principe de l'analyse ABC :</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li><strong>Classe A (≤80%)</strong> : Matières à forte valeur, gestion prioritaire</li>
              <li><strong>Classe B (80-95%)</strong> : Matières à valeur moyenne, gestion standard</li>
              <li><strong>Classe C (&gt;95%)</strong> : Matières à faible valeur, gestion simplifiée</li>
            </ul>
          </div>
          
          <Table columns={abcColumns} data={analyseABC} />
          {analyseABC.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucune donnée d'analyse ABC disponible
            </div>
          )}
        </Card>
      ),
    },
    {
      id: 'restock',
      label: 'Suggestions restock',
      content: (
        <div className="space-y-6">
          {/* Alertes urgentes */}
          {suggestions.filter(s => s.niveau_alerte === 'URGENT').length > 0 && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Alertes urgentes ({suggestions.filter(s => s.niveau_alerte === 'URGENT').length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.filter(s => s.niveau_alerte === 'URGENT').slice(0, 6).map((suggestion) => (
                  <div key={suggestion.matiere_id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="font-medium text-red-800 dark:text-red-200">{suggestion.designation}</div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Stock: {num3(suggestion.quantite_disponible)} {suggestion.unite}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Reste: {suggestion.jours_stock_restant}j
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          <Card title="Toutes les suggestions de réapprovisionnement">
            <Table columns={suggestionsColumns} data={suggestions} />
            {suggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune suggestion de réapprovisionnement
              </div>
            )}
          </Card>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement des données analytiques...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Tableaux de bord et analyses avancées</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}