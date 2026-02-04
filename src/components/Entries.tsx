
import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Plus, Search, Calendar, Package, Truck, DollarSign, X as XIcon, Filter, Edit3, Trash2 } from 'lucide-react';

const Entries: React.FC = () => {
  const { entries, products, suppliers, addEntry, updateEntry, deleteEntry } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para filtro de data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Função utilitária para pegar data local no formato YYYY-MM-DD
  const getTodayLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  // Função para formatar data sem fuso horário
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = useState({
    date: getTodayLocal(),
    productId: '',
    supplierId: '',
    quantity: 0,
    unitCost: 0,
    shippingCost: 0,
    observation: ''
  });

  const handleOpenModal = (entry?: any) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        date: entry.date,
        productId: entry.productId,
        supplierId: entry.supplierId,
        quantity: entry.quantity,
        unitCost: entry.unitCost,
        shippingCost: entry.shippingCost,
        observation: entry.observation || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        date: getTodayLocal(),
        productId: '',
        supplierId: '',
        quantity: 0,
        unitCost: 0,
        shippingCost: 0,
        observation: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateEntry(editingId, formData);
    } else {
      addEntry(formData);
    }
    setFormData({
      date: getTodayLocal(),
      productId: '',
      supplierId: '',
      quantity: 0,
      unitCost: 0,
      shippingCost: 0,
      observation: ''
    });
    setIsModalOpen(false);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.item || 'Desconhecido';
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.company || 'Desconhecido';

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const nameMatch = getProductName(e.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSupplierName(e.supplierId).toLowerCase().includes(searchTerm.toLowerCase());
      const afterStart = !startDate || e.date >= startDate;
      const beforeEnd = !endDate || e.date <= endDate;
      return nameMatch && afterStart && beforeEnd;
    });
  }, [entries, searchTerm, startDate, endDate, products, suppliers]);

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por produto ou fornecedor..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                className="bg-transparent text-sm focus:outline-none text-slate-600"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Data Início"
              />
              <span className="text-slate-300">|</span>
              <input
                type="date"
                className="bg-transparent text-sm focus:outline-none text-slate-600"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

            <button
              onClick={() => handleOpenModal()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
            >
              <Plus size={20} /> Registrar Entrada
            </button>
          </div>
        </div>

        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
            <Filter size={14} />
            <span>Período: {startDate ? formatDate(startDate) : 'Início'} até {endDate ? formatDate(endDate) : 'Hoje'}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data Compra</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Fornecedor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Qtd</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Unitário</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Frete</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Obs.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
                const totalEntry = (entry.quantity * entry.unitCost) + (entry.shippingCost || 0);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{getProductName(entry.productId)}</td>
                    <td className="px-6 py-4 text-slate-600">{getSupplierName(entry.supplierId)}</td>
                    <td className="px-6 py-4 text-slate-800 text-right font-bold">{entry.quantity.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-slate-600 text-right font-mono text-xs">
                      R$ {entry.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-amber-600 text-right font-mono text-xs italic">
                      {entry.shippingCost > 0 ? `R$ ${entry.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 text-right font-bold font-mono">
                      R$ {totalEntry.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic text-sm truncate max-w-[150px]">{entry.observation || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(entry)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Entrada"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Entrada"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Nenhum registro encontrado no período selecionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 my-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  {editingId ? <Edit3 size={24} /> : <Plus size={24} />}
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Editar Entrada de Estoque' : 'Nova Entrada de Estoque'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Compra</label>
                <input type="date" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.productId} onChange={e => {
                  setFormData({ ...formData, productId: e.target.value });
                }}>
                  <option value="">Selecione o produto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.item} ({p.sku})</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                  <option value="">Selecione o fornecedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                <input type="number" step="any" required min="0.001" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custo Unitário (R$)</label>
                <input type="number" step="0.01" required min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: Number(e.target.value) })} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Frete (R$)</label>
                <input type="number" step="0.01" min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.shippingCost} onChange={e => setFormData({ ...formData, shippingCost: Number(e.target.value) })} />
                <p className="text-[10px] text-slate-400 mt-1 italic">* O frete será rateado proporcionalmente no custo médio dos itens desta entrada.</p>
              </div>

              <div className="col-span-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Valor Total da Entrada:</span>
                  <span className="text-lg font-bold text-slate-800">
                    R$ {((formData.quantity * formData.unitCost) + formData.shippingCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
                <textarea className="w-full p-2 border border-slate-300 rounded-lg h-20 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.observation} onChange={e => setFormData({ ...formData, observation: e.target.value })} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 font-bold transition-all active:scale-95">
                  {editingId ? 'Atualizar Entrada' : 'Salvar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entries;
