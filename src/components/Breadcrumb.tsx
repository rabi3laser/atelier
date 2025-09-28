import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Accueil',
  '/clients': 'Clients',
  '/materials': 'Matières',
  '/quotes': 'Devis',
  '/orders': 'Commandes',
  '/invoices': 'Factures',
  '/payments': 'Paiements',
  '/work-orders': 'Bons de travail',
  '/purchases': 'Achats',
  '/projects': 'Projets',
  '/planning': 'Planning',
  '/locations': 'Emplacements',
  '/lots': 'Lots',
  '/scraps': 'Chutes',
  '/analytics': 'Analytics',
  'new': 'Nouveau',
  'edit': 'Modifier',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip UUID segments (they look like: 123e4567-e89b-12d3-a456-426614174000)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    if (isUUID) {
      breadcrumbItems.push({
        label: 'Détails',
        path: index === pathSegments.length - 1 ? undefined : currentPath
      });
    } else {
      const label = routeLabels[currentPath] || routeLabels[segment] || segment;
      breadcrumbItems.push({
        label,
        path: index === pathSegments.length - 1 ? undefined : currentPath
      });
    }
  });

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {index === 0 && <Home size={16} className="inline mr-1" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}