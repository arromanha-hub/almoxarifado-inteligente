
export enum StockStatus {
  DANGER = "Estoque Perigoso",
  COMFORTABLE = "Estoque Confortável"
}

export interface Product {
  id: string;
  item: string;
  sku: string;
  unit: string;
  minStock: number;
  location: string;
}

export interface Supplier {
  id: string;
  company: string;
  contact: string;
  email: string;
  address: string;
  phone?: string;
}

export interface Entry {
  id: string;
  date: string;
  productId: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  shippingCost: number;
  observation?: string;
}

export interface Exit {
  id: string;
  date: string;
  productId: string;
  requestedQty: number;
  returnedQty: number;
  returnDate?: string;
  unitPrice: number;
  responsible: string;
  application: string;
  observation?: string;
}

export interface InventoryConsolidated {
  productId: string;
  productName: string;
  sku: string;
  totalIn: number;
  totalOut: number;
  balance: number;
  minStock: number;
  status: StockStatus;
  avgUnitCost: number;
  totalCost: number;
  location: string;
}

export type UserRole = "ADMINISTRADOR" | "ALMOXARIFE" | "SOLICITANTE";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
