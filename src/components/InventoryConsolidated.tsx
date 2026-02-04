
import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { StockStatus } from '../types';
import { Search, Download, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

const InventoryConsolidatedView: React.FC = () => {
  const { consolidatedInventory } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = consolidatedInventory.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    alert("Exportação para Excel/PDF preparada para integração.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar estoque consolidado..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} /> Excel
          </button>
          <button
            onClick={handleExport}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Produto / SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Entradas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Saídas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Saldo Atual</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Mínimo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Custo Médio</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Custo Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Local</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.productId} className={`hover:bg-slate-50 transition-colors ${item.status === StockStatus.DANGER ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{item.productName}</p>
                    <p className="text-xs text-slate-400 font-mono uppercase">{item.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.totalIn.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.totalOut.toLocaleString('pt-BR')}</td>
                  <td className={`px-6 py-4 text-center font-bold font-mono text-lg ${item.balance <= 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {item.balance.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400 font-mono">{item.minStock.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${item.status === StockStatus.DANGER
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {item.status === StockStatus.DANGER ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                      {item.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-500 text-xs">
                    R$ {item.avgUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                    R$ {item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{item.location}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryConsolidatedView;
