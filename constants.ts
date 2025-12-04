import { Product, User } from './types';

// Updated: Till Number removed. Configure this in your Supabase Edge Function Secrets.
export const MPESA_TILL_NUMBER = ""; 

// SECURITY UPDATE: API Keys have been removed from frontend code.
// Please configure MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your Supabase Dashboard.

// SUPABASE CONFIGURATION
export const SUPABASE_URL = "https://iersasvsfdeldzucdmse.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcnNhc3ZzZmRlbGR6dWNkbXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTYzNjYsImV4cCI6MjA4MDI5MjM2Nn0.01wRPGcRJnfM98f3QPceOI79J47pnPsV4_Ae1KegBc8";

// ADMIN CONFIGURATION
export const SUPER_ADMIN_EMAIL = "ianmuriithiflowerz@gmail.com";

export const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'phones', name: 'Mobile Accessories' },
  { id: 'computers', name: 'Computer Accessories' },
  { id: 'gadgets', name: 'Tech Gadgets' },
  { id: 'clothing', name: 'Clothing' },
];

// Mock Initial Data (Fallback if Supabase is empty/offline)
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Ultra-Slim Power Bank 20000mAh',
    description: 'Fast charging, dual USB output, lightweight design perfect for travel.',
    price: 3500,
    category: 'phones',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1625946132715-e25f694605e6?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 50,
    rating: 4.5,
    reviews: [],
    tags: ['charging', 'mobile'],
  },
  {
    id: 'p2',
    name: 'Noise Cancelling Headphones',
    description: 'Immersive sound experience with active noise cancellation.',
    price: 8500,
    category: 'gadgets',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 20,
    rating: 4.8,
    reviews: [],
    tags: ['audio', 'wireless'],
    isFlashSale: true,
    discount: 15,
    flashSaleEndTime: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'p3',
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB backlit, blue switches, durable aluminum frame.',
    price: 6000,
    category: 'computers',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b91a91e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 15,
    rating: 4.7,
    reviews: [],
  },
  {
    id: 'p4',
    name: 'Digiflow Developer Hoodie',
    description: 'Premium cotton blend, comfortable fit, minimalist logo.',
    price: 2500,
    category: 'clothing',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 100,
    rating: 4.9,
    reviews: [],
  },
  {
    id: 'p5',
    name: 'Smart Watch Series X',
    description: 'Health tracking, notifications, waterproof.',
    price: 12000,
    category: 'gadgets',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 30,
    rating: 4.6,
    reviews: [],
  },
  {
    id: 'p6',
    name: 'USB-C Hub Multiport',
    description: 'HDMI, USB 3.0, SD Card Reader for laptops.',
    price: 4500,
    category: 'computers',
    images: [
      'https://images.unsplash.com/photo-1625243226999-5287e07d7920?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1616440347437-b1c73416ef12?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 45,
    rating: 4.4,
    reviews: [],
  },
  {
    id: 'p7',
    name: 'Wireless Charging Stand',
    description: 'Fast wireless charging for all Qi-enabled devices. Sleek desk design.',
    price: 2800,
    category: 'phones',
    images: [
      'https://images.unsplash.com/photo-1616400619175-5beda3a17896?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1619948616131-4822709a0a09?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 60,
    rating: 4.3,
    reviews: [],
  },
  {
    id: 'p8',
    name: 'Rugged Shockproof Case (iPhone 14/15)',
    description: 'Military-grade drop protection with built-in kickstand.',
    price: 1500,
    category: 'phones',
    images: [
      'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 100,
    rating: 4.7,
    reviews: [],
  },
  {
    id: 'p9',
    name: 'Ergonomic Vertical Mouse',
    description: 'Reduces wrist strain. Wireless connection with high precision sensor.',
    price: 3200,
    category: 'computers',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 25,
    rating: 4.5,
    reviews: [],
  },
  {
    id: 'p10',
    name: 'Laptop Cooling Pad RGB',
    description: '5 high-speed fans with adjustable speed and RGB lighting.',
    price: 2200,
    category: 'computers',
    images: [
      'https://images.unsplash.com/photo-1588620061730-264d183063f2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 40,
    rating: 4.2,
    reviews: [],
  },
  {
    id: 'p11',
    name: 'Smart Home LED Bulb (WiFi)',
    description: 'Control color and brightness via app. Alexa/Google Home compatible.',
    price: 1800,
    category: 'gadgets',
    images: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 80,
    rating: 4.6,
    reviews: [],
  },
  {
    id: 'p12',
    name: 'Mini Drone with 4K Camera',
    description: 'Foldable design, auto-hover, and 20 mins flight time.',
    price: 15000,
    category: 'gadgets',
    images: [
      'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 10,
    rating: 4.8,
    reviews: [],
    isFlashSale: true,
    discount: 10,
    flashSaleEndTime: new Date(Date.now() + 172800000).toISOString(), 
  },
  {
    id: 'p13',
    name: 'Digiflow Branded Cap',
    description: 'Stylish black cap with embroidered logo. Adjustable strap.',
    price: 800,
    category: 'clothing',
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 150,
    rating: 4.9,
    reviews: [],
  },
  {
    id: 'p14',
    name: 'Tech Graphic T-Shirt',
    description: '100% cotton tee with modern circuit board design print.',
    price: 1200,
    category: 'clothing',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 120,
    rating: 4.4,
    reviews: [],
  },
  {
    id: 'p15',
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof, 12-hour battery life, and deep bass.',
    price: 4500,
    category: 'gadgets',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543512214-318c77a790d3?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 35,
    rating: 4.7,
    reviews: [],
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  email: 'demo@digiflow.com',
  fullName: 'John Doe',
  role: 'user', 
  phone: '254700000000',
  addresses: [{
    id: 'a1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '700000000',
    street: '123 Nairobi St',
    region: 'Nairobi',
    city: 'CBD',
    isDefault: true
  }],
  referralCode: 'JOHN123',
  referralEarnings: 500,
  referralCount: 5,
  wishlist: [],
};