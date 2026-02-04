
import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { Plus, Search, Edit3, Trash2, X as XIcon, DollarSign } from 'lucide-react';
import { Product } from '../types';

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, consolidatedInventory } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    item: '',
    sku: '',
    unit: '',
    minStock: 0,
    location: ''
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        item: product.item,
        sku: product.sku,
        unit: product.unit,
        minStock: product.minStock,
        location: product.location
      });
    } else {
      setEditingId(null);
      setFormData({ item: '', sku: '', unit: '', minStock: 0, location: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, formData);
    } else {
      addProduct(formData);
    }
    handleOpenModal(); // Reset and close
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p =>
    p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvgCostForProduct = (productId: string) => {
    const consolidated = consolidatedInventory.find(c => c.productId === productId);
    return consolidated?.avgUnitCost || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por item ou SKU..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Unid.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Preço Médio</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Mínimo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Localização</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const avgCost = getAvgCostForProduct(product.id);
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{product.item}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4 text-slate-600">{product.unit}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono text-sm ${avgCost > 0 ? 'text-blue-600 font-bold' : 'text-slate-300 italic'}`}>
                        {avgCost > 0 ? `R$ ${avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem entradas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-right font-mono">{product.minStock}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{product.location}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                          title="Editar Produto"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Excluir Produto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Produto' : 'Cadastrar Novo Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Item (Descrição)</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Próprio (SKU)</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="Unidade">Unidade</option>
                  <option value="Peça">Peça</option>
                  <option value="Kilogramas (Kg)">Kilogramas (Kg)</option>
                  <option value="Gramas (g)">Gramas (g)</option>
                  <option value="Litros (L)">Litros (L)</option>
                  <option value="Mililitros (ml)">Mililitros (ml)</option>
                  <option value="Metros (m)">Metros (m)</option>
                  <option value="Centímetros (cm)">Centímetros (cm)</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Pacote">Pacote</option>
                  <option value="Rolo">Rolo</option>
                  <option value="Par">Par</option>
                  <option value="Cento">Cento</option>
                  <option value="Kit">Kit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                <input type="number" step="any" required min="0" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Local de Armazenamento</label>
                <input required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 font-bold">
                  {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
