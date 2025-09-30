import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  CreditCard,
  Wrench,
  ShoppingBag,
  FolderOpen,
  Calendar,
  MapPin,
  Package2,
  Scissors,
  BarChart3,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    category: 'Tableau de bord',
    items: [
      { path: '/', label: 'Accueil', icon: Home }
    ]
  },
  {
    category: 'Commercial',
    items: [
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/quick-devis', label: 'Générateur Devis', icon: FileText },
      { path: '/quotes', label: 'Devis', icon: FileText },
      { path: '/orders', label: 'Commandes', icon: ShoppingCart },
      { path: '/invoices', label: 'Factures', icon: Receipt },
      { path: '/payments', label: 'Paiements', icon: CreditCard }
    ]
  },
  {
    category: 'Stock & Matières',
    items: [
      { path: '/materials', label: 'Matières', icon: Package },
      { path: '/lots', label: 'Lots', icon: Package2 },
      { path: '/locations', label: 'Emplacements', icon: MapPin },
      { path: '/scraps', label: 'Chutes', icon: Scissors }
    ]
  },
  {
    category: 'Production',
    items: [
      { path: '/work-orders', label: 'Bons de travail', icon: Wrench },
      { path: '/purchases', label: 'Achats', icon: ShoppingBag },
      { path: '/projects', label: 'Projets', icon: FolderOpen },
      { path: '/planning', label: 'Planning', icon: Calendar }
    ]
  },
  {
    category: 'Analytics',
    items: [
      { path: '/analytics', label: 'Analyses', icon: BarChart3 },
      { path: '/templates', label: 'Templates', icon: FileText }
    ]
  }
];

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Tableau de bord']);
  const location = useLocation();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const isActiveLink = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Mobile */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Atelier Laser
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Atelier Laser
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((category) => (
                <div key={category.category}>
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <span>{category.category}</span>
                    <ChevronDown 
                      size={16} 
                      className={`transform transition-transform ${
                        expandedCategories.includes(category.category) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedCategories.includes(category.category) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActiveLink(item.path)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            <Icon size={18} className="mr-3" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeMobileMenu} />
            <div className="relative flex flex-col w-80 max-w-xs bg-white dark:bg-gray-800 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {menuItems.map((category) => (
                  <div key={category.category}>
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      <span>{category.category}</span>
                      <ChevronDown 
                        size={16} 
                        className={`transform transition-transform ${
                          expandedCategories.includes(category.category) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {expandedCategories.includes(category.category) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={closeMobileMenu}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isActiveLink(item.path)
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                              }`}
                            >
                              <Icon size={18} className="mr-3" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <main className="px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}