export type Category = {
  slug: string;
  name: string;
  description: string;
  tone: string;
};

export type Product = {
  id: string;
  /** Stable catalog identity used as the public Product Code. */
  productCode?: string;
  slug: string;
  name: string;
  category: string;
  style: string;
  brand: string;
  priceGBP: number;
  priceEUR?: number;
  priceUSD?: number;
  images: string[];
  colors: string[];
  sizes: string[];
  shortDescription: string;
  description: string;
  /** Optional structured copy exposed by newer catalogue records. */
  productDetails?: string[];
  sizeFit?: string[];
  material?: string | null;
  featured: boolean;
  newIn: boolean;
};

export type CartItem = {
  /** Stable local cart-row identity; never sent to the order API. */
  cartLineId?: string;
  productId: string;
  productCode?: string;
  slug: string;
  name: string;
  title?: string;
  productUrl?: string;
  priceGBP: number;
  priceEUR?: number;
  priceUSD?: number;
  image?: string;
  color?: string;
  size: string;
  /** Product-specific customer size options persisted with this local cart row. */
  availableSizes?: string[];
  /** Marks a completed read-only lookup so empty results are not fetched again. */
  sizeOptionsResolved?: boolean;
  /** Transient lookup failure; omitted from persisted cart JSON to allow retry. */
  sizeOptionsFailed?: boolean;
  quantity: number;
};

export type CustomerDetails = {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  countryCode: string;
  countryName: string;
  address: string;
  city: string;
  county?: string;
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
