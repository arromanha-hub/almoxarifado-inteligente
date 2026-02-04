
import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { StockStatus } from '../types';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, Package, PieChart as PieChartIcon, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Fix: Redefining jsPDFWithAutoTable as 'any' to resolve issues where jsPDF instance methods 
// (like setFontSize, text, save) were not being recognized through the interface extension 
// due to environment-specific type augmentation failures between jsPDF and jspdf-autotable.
type jsPDFWithAutoTable = any;

const Reports: React.FC = () => {
  const {
    entries, exits, consolidatedInventory, products, suppliers,
    reportsFilters, setReportsFilters
  } = useInventory();

  const { startDate, endDate } = reportsFilters;
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('');

  // Cores para o gráfico
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Função utilitária de formatação de data string
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Get unique responsibles from exits
  const responsibles = useMemo(() => Array.from(new Set(exits.map(e => e.responsible))), [exits]);

  // Filtered data for reports
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const dateMatch = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      const supplierMatch = !selectedSupplier || e.supplierId === selectedSupplier;
      return dateMatch && supplierMatch;
    });
  }, [entries, startDate, endDate, selectedSupplier]);

  const filteredExits = useMemo(() => {
    return exits.filter(ex => {
      const dateMatch = (!startDate || ex.date >= startDate) && (!endDate || ex.date <= endDate);
      const respMatch = !selectedResponsible || ex.responsible === selectedResponsible;
      return dateMatch && respMatch;
    });
  }, [exits, startDate, endDate, selectedResponsible]);

  // Agrupamento por Setor (Aplicação)
  const exitsBySector = useMemo(() => {
    const sectors: Record<string, { name: string; value: number; quantity: number }> = {};

    filteredExits.forEach(ex => {
      const sectorName = ex.application || 'Não Informado';
      const totalValue = (ex.requestedQty - ex.returnedQty) * ex.unitPrice;
      const totalQty = (ex.requestedQty - ex.returnedQty);

      if (!sectors[sectorName]) {
        sectors[sectorName] = { name: sectorName, value: 0, quantity: 0 };
      }
      sectors[sectorName].value += totalValue;
      sectors[sectorName].quantity += totalQty;
    });

    return Object.values(sectors).sort((a, b) => b.value - a.value);
  }, [filteredExits]);

  // Calculations
  const totalInValue = filteredEntries.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
  const totalOutValue = filteredExits.reduce((acc, curr) => acc + ((curr.requestedQty - curr.returnedQty) * curr.unitPrice), 0);
  const itemsToRestock = consolidatedInventory.filter(i => i.status === StockStatus.DANGER);
  const inventoryValue = consolidatedInventory.reduce((acc, curr) => acc + curr.totalCost, 0);

  const topSector = exitsBySector.length > 0 ? exitsBySector[0] : null;

  const exportToCSV = () => {
    const headers = ["Setor", "Quantidade de Itens", "Valor Total Consumido"];
    const rows = exitsBySector.map(s => [s.name, s.quantity, s.value.toFixed(2)]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_saidas_setor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Casting to jsPDFWithAutoTable (which is 'any') to suppress method visibility errors
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const today = new Date().toLocaleDateString('pt-BR');

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Relatório de Almoxarifado', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de Emissão: ${today}`, 14, 30);
    doc.text(`Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Hoje'}`, 14, 35);

    // Resumo KPI
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Resumo Financeiro do Período', 14, 45);

    const kpiData = [
      ['Total em Compras', `R$ ${totalInValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Total em Saídas', `R$ ${totalOutValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Valor em Estoque Atual', `R$ ${inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Itens com Estoque Crítico', `${itemsToRestock.length} itens`]
    ];

    doc.autoTable({
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Tabela por Setor
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Consumo por Setor / Aplicação', 14, currentY);

    const sectorData = exitsBySector.map(s => [
      s.name,
      s.quantity.toString(),
      `R$ ${s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${((s.value / (totalOutValue || 1)) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: [['Setor', 'Qtd Itens', 'Valor Total', '% do Total']],
      body: sectorData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });

    doc.save(`relatorio_almoxarifado_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
          <Filter size={20} className="text-blue-600" />
          <h2>Filtros de Relatório</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data Início</label>
            <input
              type="date"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={startDate}
              onChange={e => setReportsFilters({ ...reportsFilters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data Fim</label>
            <input
              type="date"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={endDate}
              onChange={e => setReportsFilters({ ...reportsFilters, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fornecedor (Entradas)</label>
            <select
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
            >
              <option value="">Todos</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Responsável (Saídas)</label>
            <select
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={selectedResponsible}
              onChange={e => setSelectedResponsible(e.target.value)}
            >
              <option value="">Todos</option>
              {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Compras (Período)</span>
          </div>
          <p className="text-xl font-bold text-slate-800">R$ {totalInValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><TrendingDown size={20} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saídas por Setor</span>
          </div>
          <p className="text-xl font-bold text-slate-800">R$ {totalOutValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          {topSector && (
            <p className="text-[10px] text-amber-600 font-medium mt-1">Destaque: {topSector.name}</p>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Valor em Estoque</span>
          </div>
          <p className="text-xl font-bold text-slate-800">R$ {inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Package size={20} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Itens Críticos</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{itemsToRestock.length} <span className="text-sm font-normal text-slate-400">produtos</span></p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl text-white">
        <div>
          <h3 className="font-bold">Análise de Consumo por Setor / Aplicação</h3>
          <p className="text-xs text-slate-400">Resumo financeiro agrupado por centro de custo/setor.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
          >
            <Download size={18} /> Exportar CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition-colors"
          >
            <FileText size={18} /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Saídas por Setor */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
            <TrendingDown size={18} className="text-amber-500" /> Detalhamento por Setor
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px]">Setor / Aplicação</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-center">Itens Retirados</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Valor Consumido</th>
                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">% do Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exitsBySector.map((s, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{s.name}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{s.quantity.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    R$ {s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">
                    {((s.value / (totalOutValue || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {exitsBySector.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    Nenhuma saída registrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Gráfico de Distribuição */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6 font-bold text-slate-700">
            <PieChartIcon size={18} className="text-blue-500" />
            <h3>Distribuição de Custos</h3>
          </div>
          <div className="h-80">
            {exitsBySector.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exitsBySector}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {exitsBySector.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                Sem dados para o gráfico
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Entradas (Mantida para conferência) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" /> Resumo de Entradas (Compras)
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px]">Data</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px]">Produto</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Qtd</th>
              <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-slate-500">{formatDate(e.date)}</td>
                <td className="px-4 py-2 text-slate-700">{products.find(p => p.id === e.productId)?.item}</td>
                <td className="px-4 py-2 text-right font-bold">{e.quantity.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2 text-right font-mono">R$ {(e.quantity * e.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {filteredEntries.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Nenhuma entrada no período.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
