
import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { StockStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, PackageCheck, Calendar, Filter, X as XIcon } from 'lucide-react';

const Dashboard: React.FC = () => {
  const {
    consolidatedInventory, exits, products, entries,
    dashboardFilters, setDashboardFilters
  } = useInventory();

  const { startDate, endDate } = dashboardFilters;

  // Função para formatar data sem fuso horário
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const clearDateFilters = () => {
    setDashboardFilters({ startDate: '', endDate: '' });
  };

  // Filtragem de movimentações baseada no período selecionado
  const filteredExits = useMemo(() => {
    return exits.filter(ex => {
      const afterStart = !startDate || ex.date >= startDate;
      const beforeEnd = !endDate || ex.date <= endDate;
      return afterStart && beforeEnd;
    });
  }, [exits, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const afterStart = !startDate || e.date >= startDate;
      const beforeEnd = !endDate || e.date <= endDate;
      return afterStart && beforeEnd;
    });
  }, [entries, startDate, endDate]);

  // Estatísticas calculadas
  const lowStock = consolidatedInventory.filter(i => i.status === StockStatus.DANGER);

  // O Valor Total em estoque é um snapshot (atual), mas as movimentações financeiras são por período
  const totalValueInStock = consolidatedInventory.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalPurchasedInPeriod = filteredEntries.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost) + (curr.shippingCost || 0), 0);

  // Top produtos mais movimentados no período
  const productMovements = useMemo(() => {
    return products.map(p => {
      const totalOut = filteredExits
        .filter(e => e.productId === p.id)
        .reduce((acc, curr) => acc + (curr.requestedQty - curr.returnedQty), 0);
      return { name: p.item, totalOut };
    }).sort((a, b) => b.totalOut - a.totalOut).slice(0, 5);
  }, [products, filteredExits]);

  const stats = [
    { label: 'Itens em Estoque', value: consolidatedInventory.length, icon: PackageCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Estoque Crítico', value: lowStock.length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    {
      label: startDate || endDate ? 'Compras no Período' : 'Valor Total em Estoque',
      value: `R$ ${(startDate || endDate ? totalPurchasedInPeriod : totalValueInStock).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { label: startDate || endDate ? 'Saídas no Período' : 'Total de Saídas', value: filteredExits.length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Filtro de Data */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Filter size={20} className="text-blue-600" />
          <span>Filtro de Período</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            className="bg-transparent text-sm focus:outline-none text-slate-600"
            value={startDate}
            onChange={(e) => setDashboardFilters({ ...dashboardFilters, startDate: e.target.value })}
            title="Data Início"
          />
          <span className="text-slate-300">|</span>
          <input
            type="date"
            className="bg-transparent text-sm focus:outline-none text-slate-600"
            value={endDate}
            onChange={(e) => setDashboardFilters({ ...dashboardFilters, endDate: e.target.value })}
            title="Data Fim"
          />
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilters}
              className="ml-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Limpar Filtros"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`${stat.bg} p-3 rounded-lg`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Top Outflow Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Top 5 Produtos - Saídas</h3>
            {(startDate || endDate) && (
              <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-full">
                Período Filtrado
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMovements}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="totalOut" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {productMovements.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {productMovements.length === 0 && (
            <div className="text-center py-12 text-slate-300 italic text-sm">Nenhuma saída registrada no período.</div>
          )}
        </div>

        {/* List: Critical Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Alertas de Reposição (Atual)</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {lowStock.length > 0 ? (
              lowStock.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold">
                      {item.productName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-rose-900">{item.productName}</p>
                      <p className="text-xs text-rose-700">Saldo: {item.balance.toLocaleString('pt-BR')} (Mín: {item.minStock.toLocaleString('pt-BR')})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-rose-400 uppercase font-bold">Local</p>
                    <p className="text-xs text-rose-800 font-medium">{item.location}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <PackageCheck size={48} className="mx-auto mb-2 opacity-20" />
                <p>Estoque confortável para todos os itens.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
