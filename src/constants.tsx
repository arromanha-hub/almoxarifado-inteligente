
import { Product, Supplier, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', item: 'Papel A4', sku: 'PAP-001', unit: 'Pacote', minStock: 10, location: 'Prateleira A1' },
  { id: '2', item: 'Caneta Azul', sku: 'CAN-001', unit: 'Unidade', minStock: 50, location: 'Gaveta B2' },
  { id: '3', item: 'Cartucho HP 664', sku: 'SUP-001', unit: 'Unidade', minStock: 5, location: 'Armário C1' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: '1', company: 'Papelaria Central', contact: 'João Silva', email: 'vendas@papelaria.com', address: 'Rua das Flores, 123' },
  { id: '2', company: 'Suprimentos Tech', contact: 'Maria Souza', email: 'contato@techsupri.com', address: 'Av. Industrial, 456' },
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Admin User',
  role: 'ADMINISTRADOR'
};
