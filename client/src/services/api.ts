import { Tenant, Category, DiningTable, Order } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async loginEmail(email: string, password: string, tenantSlug?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenantSlug }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  async loginPin(pinCode: string, tenantId: string) {
    const res = await fetch(`${API_BASE}/auth/login-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode, tenantId }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'PIN Login failed');
    return res.json();
  },

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE}/tenants`);
    if (!res.ok) throw new Error('Failed to fetch tenants');
    return res.json();
  },

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const res = await fetch(`${API_BASE}/tenants/slug/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch tenant info');
    return res.json();
  },

  // Menu
  async getMenu(tenantId: string): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/menu/tenant/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },

  // Tables
  async getTables(tenantId: string): Promise<DiningTable[]> {
    const res = await fetch(`${API_BASE}/tables/tenant/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },

  async getTableByToken(token: string): Promise<DiningTable> {
    const res = await fetch(`${API_BASE}/tables/token/${token}`);
    if (!res.ok) throw new Error('Invalid table QR code');
    return res.json();
  },

  async updateTableStatus(tableId: string, status: string): Promise<DiningTable> {
    const res = await fetch(`${API_BASE}/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update table status');
    return res.json();
  },

  // Orders
  async createOrder(orderData: {
    tenantId: string;
    tableId?: string | null;
    customerName?: string;
    orderType?: string;
    notes?: string;
    items: any[];
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to place order');
    return res.json();
  },

  async getOrders(tenantId: string, status?: string): Promise<Order[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/orders/tenant/${tenantId}${query}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getKdsOrders(tenantId: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/tenant/${tenantId}/kds`);
    if (!res.ok) throw new Error('Failed to fetch KDS orders');
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async updateOrderItemStatus(itemId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orders/item/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update dish status');
    return res.json();
  },

  async processPayment(orderId: string, paymentMethod: string, discount: number = 0): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, discount }),
    });
    if (!res.ok) throw new Error('Failed to process payment');
    return res.json();
  },

  // Inventory
  async getIngredients(tenantId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/inventory/tenant/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    return res.json();
  },

  async restockIngredient(ingredientId: string, amountToAdd: number): Promise<any> {
    const res = await fetch(`${API_BASE}/inventory/${ingredientId}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountToAdd }),
    });
    if (!res.ok) throw new Error('Failed to restock ingredient');
    return res.json();
  },

  // Analytics
  async getAnalytics(tenantId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/tenant/${tenantId}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },
};
