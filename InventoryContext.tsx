import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Product, Supplier, Entry, Exit, InventoryConsolidated, StockStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from './constants';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  entries: Entry[];
  exits: Exit[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addEntry: (e: Omit<Entry, 'id'>) => void;
  updateEntry: (id: string, e: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  addExit: (ex: Omit<Exit, 'id'>) => void;
  updateExit: (id: string, updates: Partial<Exit>) => void;
  deleteExit: (id: string) => void;
  consolidatedInventory: InventoryConsolidated[];
  getSupplierTotal: (supplierId: string) => number;
  // User Preferences / Filters
  dashboardFilters: { startDate: string; endDate: string };
  setDashboardFilters: (filters: { startDate: string; endDate: string }) => void;
  reportsFilters: { startDate: string; endDate: string };
  setReportsFilters: (filters: { startDate: string; endDate: string }) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exits, setExits] = useState<Exit[]>([]);
  const [dashboardFilters, setDashboardFiltersState] = useState({ startDate: '', endDate: '' });
  const [reportsFilters, setReportsFiltersState] = useState({ startDate: '', endDate: '' });

  const { user } = useAuth();

  // Load data from Supabase and localStorage
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('item');

      if (error) {
        console.error('Error fetching products:', error);
      } else if (data) {
        // Map snake_case to camelCase
        const mappedProducts: Product[] = data.map(p => ({
          id: p.id,
          item: p.item,
          sku: p.sku,
          unit: p.unit,
          minStock: p.min_stock,
          location: p.location
        }));
        setProducts(mappedProducts);
      }
      setLoading(false);
    };

    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company');

      if (error) {
        console.error('Error fetching suppliers:', error);
      } else if (data) {
        setSuppliers(data);
      }
    };

    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
      } else if (data) {
        const mappedEntries: Entry[] = data.map(e => ({
          id: e.id,
          date: e.date,
          productId: e.product_id,
          supplierId: e.supplier_id,
          quantity: Number(e.quantity),
          unitCost: Number(e.unit_cost),
          shippingCost: Number(e.shipping_cost),
          observation: e.observation
        }));
        setEntries(mappedEntries);
      }
    };

    const fetchExits = async () => {
      const { data, error } = await supabase
        .from('exits')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching exits:', error);
      } else if (data) {
        const mappedExits: Exit[] = data.map(ex => ({
          id: ex.id,
          date: ex.date,
          productId: ex.product_id,
          requestedQty: Number(ex.requested_qty),
          returnedQty: Number(ex.returned_qty),
          returnDate: ex.return_date,
          unitPrice: Number(ex.unit_price),
          responsible: ex.responsible,
          application: ex.application,
          observation: ex.observation
        }));
        setExits(mappedExits);
      }
    };

    fetchProducts();
    fetchSuppliers();
    fetchEntries();
    fetchExits();
  }, []);

  // Fetch User Preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error fetching preferences:', error);
      } else if (data) {
        setDashboardFiltersState({
          startDate: data.dashboard_start_date || '',
          endDate: data.dashboard_end_date || ''
        });
        setReportsFiltersState({
          startDate: data.reports_start_date || '',
          endDate: data.reports_end_date || ''
        });
      }
    };

    fetchPreferences();
  }, [user]);

  const setDashboardFilters = async (filters: { startDate: string; endDate: string }) => {
    setDashboardFiltersState(filters);
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        dashboard_start_date: filters.startDate || null,
        dashboard_end_date: filters.endDate || null,
        updated_at: new Date().toISOString()
      });

    if (error) console.error('Error saving dashboard filters:', error);
  };

  const setReportsFilters = async (filters: { startDate: string; endDate: string }) => {
    setReportsFiltersState(filters);
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        reports_start_date: filters.startDate || null,
        reports_end_date: filters.endDate || null,
        updated_at: new Date().toISOString()
      });

    if (error) console.error('Error saving reports filters:', error);
  };


  const addProduct = async (p: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        item: p.item,
        sku: p.sku,
        unit: p.unit,
        min_stock: p.minStock,
        location: p.location
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao adicionar produto: " + error.message);
      return;
    }

    if (data) {
      const newProduct: Product = {
        id: data.id,
        item: data.item,
        sku: data.sku,
        unit: data.unit,
        minStock: data.min_stock,
        location: data.location
      };
      setProducts(prev => [...prev, newProduct]);
    }
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    const updateData: any = {};
    if (p.item !== undefined) updateData.item = p.item;
    if (p.sku !== undefined) updateData.sku = p.sku;
    if (p.unit !== undefined) updateData.unit = p.unit;
    if (p.minStock !== undefined) updateData.min_stock = p.minStock;
    if (p.location !== undefined) updateData.location = p.location;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar produto: " + error.message);
      return;
    }

    setProducts(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
  };

  const deleteProduct = async (id: string) => {
    if (entries.some(e => e.productId === id) || exits.some(ex => ex.productId === id)) {
      alert("Não é possível excluir um produto que possui movimentações (entradas ou saídas).");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir produto: " + error.message);
        return;
      }

      setProducts(prev => prev.filter(item => item.id !== id));
    }
  };

  const addSupplier = async (s: Omit<Supplier, 'id'>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company: s.company,
        contact: s.contact,
        email: s.email,
        address: s.address,
        phone: s.phone
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao adicionar fornecedor: " + error.message);
      return;
    }

    if (data) {
      setSuppliers(prev => [...prev, data]);
    }
  };

  const updateSupplier = async (id: string, s: Partial<Supplier>) => {
    const { error } = await supabase
      .from('suppliers')
      .update(s)
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar fornecedor: " + error.message);
      return;
    }

    setSuppliers(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
  };

  const deleteSupplier = async (id: string) => {
    if (entries.some(e => e.supplierId === id)) {
      alert("Não é possível excluir um fornecedor que possui entradas vinculadas.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir fornecedor: " + error.message);
        return;
      }

      setSuppliers(prev => prev.filter(item => item.id !== id));
    }
  };

  const addEntry = async (e: Omit<Entry, 'id'>) => {
    const { data, error } = await supabase
      .from('entries')
      .insert({
        date: e.date,
        product_id: e.productId,
        supplier_id: e.supplierId,
        quantity: e.quantity,
        unit_cost: e.unitCost,
        shipping_cost: e.shippingCost,
        observation: e.observation
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao adicionar entrada: " + error.message);
      return;
    }

    if (data) {
      const newEntry: Entry = {
        id: data.id,
        date: data.date,
        productId: data.product_id,
        supplierId: data.supplier_id,
        quantity: Number(data.quantity),
        unitCost: Number(data.unit_cost),
        shippingCost: Number(data.shipping_cost),
        observation: data.observation
      };
      setEntries(prev => [...prev, newEntry]);
    }
  };

  const updateEntry = async (id: string, e: Partial<Entry>) => {
    const updateData: any = {};
    if (e.date !== undefined) updateData.date = e.date;
    if (e.productId !== undefined) updateData.product_id = e.productId;
    if (e.supplierId !== undefined) updateData.supplier_id = e.supplierId;
    if (e.quantity !== undefined) updateData.quantity = e.quantity;
    if (e.unitCost !== undefined) updateData.unit_cost = e.unitCost;
    if (e.shippingCost !== undefined) updateData.shipping_cost = e.shippingCost;
    if (e.observation !== undefined) updateData.observation = e.observation;

    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar entrada: " + error.message);
      return;
    }

    setEntries(prev => prev.map(item => item.id === id ? { ...item, ...e } : item));
  };

  const deleteEntry = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta entrada? O saldo do estoque será recalculado.")) {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir entrada: " + error.message);
        return;
      }

      setEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  const addExit = async (ex: Omit<Exit, 'id'>) => {
    const { data, error } = await supabase
      .from('exits')
      .insert({
        date: ex.date,
        product_id: ex.productId,
        requested_qty: ex.requestedQty,
        returned_qty: ex.returnedQty,
        return_date: ex.returnDate,
        unit_price: ex.unitPrice,
        responsible: ex.responsible,
        application: ex.application,
        observation: ex.observation
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao adicionar saída: " + error.message);
      return;
    }

    if (data) {
      const newExit: Exit = {
        id: data.id,
        date: data.date,
        productId: data.product_id,
        requestedQty: Number(data.requested_qty),
        returnedQty: Number(data.returned_qty),
        returnDate: data.return_date,
        unitPrice: Number(data.unit_price),
        responsible: data.responsible,
        application: data.application,
        observation: data.observation
      };
      setExits(prev => [...prev, newExit]);
    }
  };

  const updateExit = async (id: string, updates: Partial<Exit>) => {
    const updateData: any = {};
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.productId !== undefined) updateData.product_id = updates.productId;
    if (updates.requestedQty !== undefined) updateData.requested_qty = updates.requestedQty;
    if (updates.returnedQty !== undefined) updateData.returned_qty = updates.returnedQty;
    if (updates.returnDate !== undefined) updateData.return_date = updates.returnDate;
    if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
    if (updates.responsible !== undefined) updateData.responsible = updates.responsible;
    if (updates.application !== undefined) updateData.application = updates.application;
    if (updates.observation !== undefined) updateData.observation = updates.observation;

    const { error } = await supabase
      .from('exits')
      .update(updateData)
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar saída: " + error.message);
      return;
    }

    setExits(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExit = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro de saída? O saldo do estoque será recalculado.")) {
      const { error } = await supabase
        .from('exits')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir saída: " + error.message);
        return;
      }

      setExits(prev => prev.filter(e => e.id !== id));
    }
  };

  const getSupplierTotal = (supplierId: string) => {
    return entries
      .filter(e => e.supplierId === supplierId)
      .reduce((acc, curr) => acc + (curr.quantity * curr.unitCost) + (curr.shippingCost || 0), 0);
  };

  const consolidatedInventory = useMemo(() => {
    return products.map(product => {
      // Filtra e ordena entradas e saídas por data para cálculo cronológico do CMM
      const prodEntries = [...entries]
        .filter(e => e.productId === product.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const prodExits = [...exits]
        .filter(e => e.productId === product.id);

      // --- CÁLCULO DE CUSTO MÉDIO MÓVEL (CMM) ---
      // Iniciamos com zero, pois o custo é determinado pelas entradas
      let currentAvgCost = 0;
      let qtyAccumulatedForCost = 0;
      let totalValueAccumulated = 0;

      prodEntries.forEach(entry => {
        // O valor da entrada inclui quantidade * custo unitário + frete
        const entryValue = (entry.quantity * entry.unitCost) + (entry.shippingCost || 0);
        const newValue = totalValueAccumulated + entryValue;
        const newQty = qtyAccumulatedForCost + entry.quantity;

        if (newQty > 0) {
          currentAvgCost = newValue / newQty;
        }

        totalValueAccumulated = newValue;
        qtyAccumulatedForCost = newQty;
      });

      // Cálculo de saldos para exibição
      const totalIn = prodEntries.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalOutRaw = prodExits.reduce((acc, curr) => acc + (curr.requestedQty - curr.returnedQty), 0);

      const balance = totalIn - totalOutRaw;
      const status = balance < product.minStock ? StockStatus.DANGER : StockStatus.COMFORTABLE;

      // O valor total do estoque agora é baseado no CMM calculado
      const totalCost = balance * currentAvgCost;

      return {
        productId: product.id,
        productName: product.item,
        sku: product.sku,
        totalIn,
        totalOut: totalOutRaw,
        balance,
        minStock: product.minStock,
        status,
        avgUnitCost: currentAvgCost,
        totalCost,
        location: product.location
      };
    });
  }, [products, entries, exits]);

  return (
    <InventoryContext.Provider value={{
      products, suppliers, entries, exits,
      addProduct, updateProduct, deleteProduct,
      addSupplier, updateSupplier, deleteSupplier,
      addEntry, updateEntry, deleteEntry,
      addExit, updateExit, deleteExit,
      consolidatedInventory, getSupplierTotal,
      dashboardFilters, setDashboardFilters,
      reportsFilters, setReportsFilters
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within Provider");
  return context;
};
