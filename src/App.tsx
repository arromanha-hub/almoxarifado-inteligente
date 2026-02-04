import React, { useState } from 'react';
import { InventoryProvider } from './InventoryContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Suppliers from './components/Suppliers';
import Entries from './components/Entries';
import Exits from './components/Exits';
import InventoryConsolidatedView from './components/InventoryConsolidated';
import Reports from './components/Reports';
import Auth from './components/Auth';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'suppliers': return <Suppliers />;
      case 'entries': return <Entries />;
      case 'exits': return <Exits />;
      case 'consolidated': return <InventoryConsolidatedView />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <InventoryProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </InventoryProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
