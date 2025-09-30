import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Breadcrumb from './components/Breadcrumb';
import MobileBottomNav from './components/MobileBottomNav';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import Quotes from './pages/Quotes';
import QuoteForm from './pages/QuoteForm';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import WorkOrders from './pages/WorkOrders';
import Purchases from './pages/Purchases';
import Projects from './pages/Projects';
import Planning from './pages/Planning';
import Locations from './pages/Locations';
import Lots from './pages/Lots';
import Scraps from './pages/Scraps';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import QuickDevis from './pages/QuickDevis';

function App() {
  return (
    <Layout>
      <Breadcrumb />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/materials/:id" element={<MaterialDetail />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/quotes/new" element={<QuoteForm />} />
        <Route path="/quotes/:id/edit" element={<QuoteForm />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/lots" element={<Lots />} />
        <Route path="/scraps" element={<Scraps />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/quick-devis" element={<QuickDevis />} />
      </Routes>
      <MobileBottomNav />
    </Layout>
  );
}

export default App;
