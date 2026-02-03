import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  FileBarChart,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos (PROD)', icon: Package },
    { id: 'suppliers', label: 'Fornecedores (FORN)', icon: Truck },
    { id: 'entries', label: 'Entradas (ENT)', icon: ArrowDownCircle },
    { id: 'exits', label: 'Saídas (SAI)', icon: ArrowUpCircle },
    { id: 'consolidated', label: 'Estoque (CONT)', icon: ClipboardList },
    { id: 'reports', label: 'Relatórios', icon: FileBarChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <span className={`font-bold text-lg transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} whitespace-nowrap overflow-hidden`}>
            ALMOX<span className="text-blue-400">ROMANHA</span>
          </span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
                <span className={`ml-4 font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={signOut}
            className="w-full flex items-center p-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className={`ml-4 font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              Sair do Sistema
            </span>
          </button>
          <div className="mt-4 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            {isSidebarOpen ? 'Versão 1.0.0' : 'v1'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 text-sm">Gerenciamento operacional e logístico</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-3 border border-slate-200">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-slate-700">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="text-sm text-slate-600 font-medium max-w-[150px] truncate">
                  {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
