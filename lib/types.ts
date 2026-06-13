export type Category = {
  slug: string;
  name: string;
  description: string;
  tone: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  style: string;
  brand: string;
  priceGBP: number;
  images: string[];
  colors: string[];
  sizes: string[];
  shortDescription: string;
  description: string;
  featured: boolean;
  newIn: boolean;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceGBP: number;
  color: string;
  size: string;
  quantity: number;
};

export type CustomerDetails = {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  address: string;
  city: string;
  postcode: string;
  preferredContact: "WhatsApp" | "Telegram";
  notes?: string;
};

export type OrderStatus =
  | "Order Submitted"
  | "Awaiting Confirmation"
  | "Payment Details Sent"
  | "Payment Received"
  | "Processing"
  | "Shipped"
  | "Completed"
  | "Cancelled";

export type Order = {
  orderNo: string;
  createdAt: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
};
