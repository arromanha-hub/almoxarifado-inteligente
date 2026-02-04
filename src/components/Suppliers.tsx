
import React, { useState, useMemo } from 'react';
import { useInventory } from '../InventoryContext';
import { Plus, Search, Building2, Mail, MapPin, User, Edit3, Trash2, X as XIcon, Filter, Calendar, Phone } from 'lucide-react';
import { Supplier } from '../types';

const Suppliers: React.FC = () => {
  const { suppliers, entries, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para filtro de data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    email: '',
    address: '',
    phone: ''
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        company: supplier.company,
        contact: supplier.contact,
        email: supplier.email,
        address: supplier.address,
        phone: supplier.phone || ''
      });
    } else {
      setEditingId(null);
      setFormData({ company: '', contact: '', email: '', address: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSupplier(editingId, formData);
    } else {
      addSupplier(formData);
    }
    handleOpenModal();
    setIsModalOpen(false);
  };

  // Cálculo do total comprado filtrado por data para cada fornecedor
  const getFilteredSupplierTotal = (supplierId: string) => {
    return entries
      .filter(e => {
        const isSupplier = e.supplierId === supplierId;
        const afterStart = !startDate || e.date >= startDate;
        const beforeEnd = !endDate || e.date <= endDate;
        return isSupplier && afterStart && beforeEnd;
      })
      .reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas e Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por empresa ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  title="Limpar Filtros de Data"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <Plus size={20} /> Novo Fornecedor
            </button>
          </div>
        </div>

        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
            <Filter size={14} />
            <span>Exibindo compras de: {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} até {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => {
          const totalComprado = getFilteredSupplierTotal(supplier.id);

          return (
            <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group relative">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(supplier)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Fornecedor"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteSupplier(supplier.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Excluir Fornecedor"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 group-hover:bg-blue-50 rounded-lg transition-colors">
                  <Building2 className="text-slate-400 group-hover:text-blue-500" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {startDate || endDate ? 'Total no Período' : 'Total Comprado'}
                  </p>
                  <p className={`text-lg font-bold ${startDate || endDate ? 'text-blue-600' : 'text-slate-800'}`}>
                    R$ {totalComprado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 pr-12">{supplier.company}</h3>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span>{supplier.contact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{supplier.address}</span>
                </div>
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">Nenhum fornecedor encontrado para os critérios de busca.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Contato</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                <textarea required className="w-full p-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                  {editingId ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
