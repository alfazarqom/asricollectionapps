export interface Product {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock' | string;
  condition: string;
  price: number;
  sale_price?: number | null;
  sale_price_starts_at?: string | null;
  sale_price_ends_at?: string | null;
  currency: string;
  link?: string;
  image_link: string;
  additional_image_link?: string;
  brand: string;
  item_group_id?: string;
  google_product_category?: string;
  product_type?: string;
  color?: string;
  size?: string;
  status?: string;
  display_image?: string;
}

export interface CartItem {
  id: string; // product id
  title: string;
  price: number; // authoritative unit price
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  brand?: string;
}

export interface Recipient {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface CourierOption {
  code: string;
  name: string;
  cost: number;
  etd: string;
  description: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_link?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  courier_name: string;
  tracking_number: string;
  shipping_notes: string;
  duitku_reference: string;
  duitku_payment_url?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  audit_logs?: Array<{ action: string; timestamp: string; details: any }>;
}

export interface AdminMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  failedCount: number;
}
