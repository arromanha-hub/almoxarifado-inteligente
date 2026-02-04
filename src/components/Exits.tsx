
import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Minus, Search, RotateCcw, Edit3, Trash2, X as XIcon, User, MapPin, Calendar, Filter } from 'lucide-react';
import { Exit } from '../types';

const Exits: React.FC = () => {
  const { exits, products, addExit, updateExit, deleteExit, consolidatedInventory } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedExitForReturn, setSelectedExitForReturn] = useState<Exit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para filtro de data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Obter lista única de setores e responsáveis para sugestões (datalist)
  const uniqueApplications = useMemo(() => {
    return Array.from(new Set(exits.map(ex => ex.application))).filter(Boolean).sort();
  }, [exits]);

  const uniqueResponsibles = useMemo(() => {
    return Array.from(new Set(exits.map(ex => ex.responsible))).filter(Boolean).sort();
  }, [exits]);

  // Função utilitária para pegar data local no formato YYYY-MM-DD
  const getTodayLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  // Função para formatar data sem erros de fuso horário
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Form states
  const [formData, setFormData] = useState({
    date: getTodayLocal(),
    productId: '',
    requestedQty: 0,
    returnedQty: 0,
    unitPrice: 0,
    responsible: '',
    application: '',
    observation: ''
  });

  const [returnQty, setReturnQty] = useState(0);

  const handleOpenModal = (exit?: Exit) => {
    if (exit) {
      setEditingId(exit.id);
      setFormData({
        date: exit.date,
        productId: exit.productId,
        requestedQty: exit.requestedQty,
        returnedQty: exit.returnedQty,
        unitPrice: exit.unitPrice,
        responsible: exit.responsible,
        application: exit.application,
        observation: exit.observation || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        date: getTodayLocal(),
        productId: '',
        requestedQty: 0,
        returnedQty: 0,
        unitPrice: 0,
        responsible: '',
        application: '',
        observation: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenReturnModal = (exit: Exit) => {
    setSelectedExitForReturn(exit);
    setReturnQty(1);
    setIsReturnModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) {
      const inv = consolidatedInventory.find(i => i.productId === formData.productId);
      if (inv && inv.balance < formData.requestedQty) {
        alert(`Saldo insuficiente! Disponível: ${inv.balance}`);
        return;
      }
      addExit(formData);
    } else {
      updateExit(editingId, formData);
    }

    setIsModalOpen(false);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExitForReturn) return;

    const maxReturn = selectedExitForReturn.requestedQty - selectedExitForReturn.returnedQty;
    if (returnQty <= 0 || returnQty > maxReturn) {
      alert(`Quantidade de devolução inválida. Máximo permitido: ${maxReturn}`);
      return;
    }

    updateExit(selectedExitForReturn.id, {
      returnedQty: selectedExitForReturn.returnedQty + returnQty,
      returnDate: getTodayLocal()
    });

    setIsReturnModalOpen(false);
    setSelectedExitForReturn(null);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.item || 'Desconhecido';

  const filteredExits = useMemo(() => {
    return exits.filter(ex => {
      const searchMatch = getProductName(ex.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.application.toLowerCase().includes(searchTerm.toLowerCase());
      const afterStart = !startDate || ex.date >= startDate;
      const beforeEnd = !endDate || ex.date <= endDate;
      return searchMatch && afterStart && beforeEnd;
    });
  }, [exits, searchTerm, startDate, endDate, products]);

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
              placeholder="Filtrar por produto, responsável ou setor..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
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
              className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-md shadow-amber-100"
            >
              <Minus size={20} /> Registrar Saída
            </button>
          </div>
        </div>

        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Responsável</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Solicitada</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center text-rose-500">Devolvida</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center bg-slate-100">Saída Real</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExits.sort((a, b) => b.date.localeCompare(a.date)).map(exit => {
                const realOut = exit.requestedQty - exit.returnedQty;
                return (
                  <tr key={exit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {formatDate(exit.date)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{getProductName(exit.productId)}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{exit.application}</p>
                      {exit.returnDate && (
                        <p className="text-[9px] text-emerald-600 mt-1 font-bold uppercase">Devolvido em: {formatDate(exit.returnDate)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{exit.responsible}</td>
                    <td className="px-6 py-4 text-slate-800 text-center font-bold">{exit.requestedQty.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-rose-500 text-center font-bold">{exit.returnedQty.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-slate-900 text-center font-bold bg-slate-50">{realOut.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {realOut > 0 && (
                          <button
                            onClick={() => handleOpenReturnModal(exit)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Registrar Devolução"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(exit)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Registro"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteExit(exit.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredExits.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhum registro encontrado no período selecionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Saída */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Registro de Saída' : 'Registrar Saída de Estoque'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input type="date" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                <select
                  required
                  disabled={!!editingId}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                  value={formData.productId}
                  onChange={e => {
                    const inv = consolidatedInventory.find(i => i.productId === e.target.value);
                    setFormData({ ...formData, productId: e.target.value, unitPrice: inv?.avgUnitCost || 0 });
                  }}
                >
                  <option value="">Selecione o produto...</option>
                  {products.map(p => {
                    const inv = consolidatedInventory.find(i => i.productId === p.id);
                    return <option key={p.id} value={p.id}>{p.item} (Disponível: {inv?.balance})</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.001"
                  disabled={!!editingId}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all"
                  value={formData.requestedQty}
                  onChange={e => setFormData({ ...formData, requestedQty: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                <input
                  required
                  list="responsible-suggestions"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={formData.responsible}
                  onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                />
                <datalist id="responsible-suggestions">
                  {uniqueResponsibles.map(resp => <option key={resp} value={resp} />)}
                </datalist>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Aplicação / Setor</label>
                <input
                  required
                  list="application-suggestions"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={formData.application}
                  onChange={e => setFormData({ ...formData, application: e.target.value })}
                />
                <datalist id="application-suggestions">
                  {uniqueApplications.map(app => <option key={app} value={app} />)}
                </datalist>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
                <textarea className="w-full p-2 border border-slate-300 rounded-lg h-20 focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={formData.observation} onChange={e => setFormData({ ...formData, observation: e.target.value })} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-md shadow-amber-200 font-bold">
                  {editingId ? 'Atualizar Registro' : 'Confirmar Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Devolução */}
      {isReturnModalOpen && selectedExitForReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Registrar Devolução</h2>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg mb-6 text-sm">
              <p className="text-emerald-800 font-bold mb-1">Produto: {getProductName(selectedExitForReturn.productId)}</p>
              <p className="text-emerald-600">Retirado por: {selectedExitForReturn.responsible}</p>
              <p className="text-emerald-600">Pendente de devolução: <span className="font-bold">{selectedExitForReturn.requestedQty - selectedExitForReturn.returnedQty}</span> unidades</p>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a Devolver</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.001"
                  max={selectedExitForReturn.requestedQty - selectedExitForReturn.returnedQty}
                  className="w-full p-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={returnQty}
                  onChange={e => setReturnQty(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 font-bold flex items-center gap-2 transition-all">
                  <RotateCcw size={18} /> Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exits;
