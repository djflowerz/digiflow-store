export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  reviews: Review[];
  discount?: number;
  isFlashSale?: boolean;
  flashSaleEndTime?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phonePrefix?: string; // e.g. +254
  additionalPhone?: string;
  street: string; // Address / Building
  additionalInfo?: string;
  region: string;
  city: string;
  isDefault?: boolean;
  label?: string; // Optional internal label
  // Legacy fields kept optional for backward compatibility
  zip?: string;
  country?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'user';
  avatar?: string;
  addresses: Address[];
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  referralCount: number;
  wishlist: string[]; // Product IDs
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'paid' | 'processing' | 'shipped' | 'delivered';
  date: string;
  paymentMethod: 'mpesa' | 'card';
  shippingAddress: Address;
}

export interface Coupon {
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
}

export enum SortOption {
  PRICE_LOW_HIGH = 'price_asc',
  PRICE_HIGH_LOW = 'price_desc',
  NEWEST = 'newest',
  RATING = 'rating',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}