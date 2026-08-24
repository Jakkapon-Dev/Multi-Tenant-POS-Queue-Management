export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  currency: string;
  taxRate: number;
  serviceFee: number;
  tables?: DiningTable[];
  categories?: Category[];
  users?: User[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  pinCode?: string | null;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  menuItems: MenuItem[];
}

export interface ModifierOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  prepTimeMinutes: number;
  sortOrder: number;
  modifierGroups?: ModifierGroup[];
}

export interface DiningTable {
  id: string;
  tenantId: string;
  tableNumber: string;
  zone: string;
  capacity: number;
  qrCodeToken: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILL_REQUESTED';
  currentOrderId?: string | null;
  orders?: Order[];
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  status?: 'QUEUED' | 'COOKING' | 'DONE' | 'CANCELLED';
  notes?: string | null;
  modifiers?: Array<{ groupName: string; optionName: string; extraPrice: number }>;
}

export interface Order {
  id: string;
  tenantId: string;
  tableId?: string | null;
  table?: DiningTable | null;
  orderNumber: string;
  customerName?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'PROMPTPAY' | 'CREDIT_CARD' | null;
  subtotal: number;
  tax: number;
  serviceFee: number;
  discount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  cartId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: Array<{ groupName: string; optionName: string; extraPrice: number }>;
  notes: string;
  itemTotalPrice: number;
}
