// providers/ProductionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product, CartItem, User, Order, Review, Category } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';

// ------------------ CART CONTEXT ------------------
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  syncCartWithDB: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from Supabase if user is logged in
  const loadCart = async (userId: string) => {
    const { data, error } = await supabase!
      .from('carts')
      .select('*')
      .eq('user_id', userId);
    if (!error && data) setCart(data.map(item => ({ ...item, quantity: item.quantity })));
  };

  const addToCart = async (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    if (isSupabaseConfigured() && supabase.auth.user()) {
      await supabase!.from('carts').upsert({ ...product, user_id: supabase.auth.user()?.id, quantity: 1 });
    }
  };

  const removeFromCart = async (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    if (isSupabaseConfigured() && supabase.auth.user()) {
      await supabase!.from('carts').delete().eq('id', productId).eq('user_id', supabase.auth.user()?.id);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    if (isSupabaseConfigured() && supabase.auth.user()) {
      await supabase!.from('carts').update({ quantity }).eq('id', productId).eq('user_id', supabase.auth.user()?.id);
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (isSupabaseConfigured() && supabase.auth.user()) {
      await supabase!.from('carts').delete().eq('user_id', supabase.auth.user()?.id);
    }
  };

  const syncCartWithDB = async () => {
    const user = supabase.auth.user();
    if (user) await loadCart(user.id);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, syncCartWithDB }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// ------------------ AUTH CONTEXT ------------------
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string; needVerification?: boolean }>;
  signUp: (email: string, password: string, name: string, phone: string, referralCode?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  verifyOtp: (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => Promise<{ error?: string }>;
  resendOtp: (identifier: string, type?: 'signup' | 'sms') => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured()) return setIsLoading(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchUserProfile(session.user.id);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) await fetchUserProfile(session.user.id);
        if (event === 'SIGNED_OUT') setUser(null);
      });

      return () => subscription.unsubscribe();
    };
    initAuth();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (error) console.error(error);
    else setUser(profile);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signInWithPhone = async (phone: string) => {
    let formatted = phone.replace(/\D/g, '');
    if (!formatted.startsWith('254')) formatted = '254' + formatted.slice(-9);
    const { error } = await supabase.auth.signInWithOtp({ phone: '+' + formatted });
    if (error) return { error: error.message };
    return { needVerification: true };
  };

  const signUp = async (email: string, password: string, name: string, phone: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, referral_code: referralCode },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) return { error: error.message };
    return {};
  };

  const verifyOtp = async (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => {
    const params: any = { token, type };
    if (type === 'sms') params.phone = identifier;
    else params.email = identifier;
    const { error } = await supabase.auth.verifyOtp(params);
    if (error) return { error: error.message };
    return {};
  };

  const resendOtp = async (identifier: string, type: 'signup' | 'sms' = 'signup') => {
    if (type === 'sms') {
      const { error } = await supabase.auth.signInWithOtp({ phone: identifier });
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.auth.resend({ type: 'signup', email: identifier });
      if (error) return { error: error.message };
    }
    return {};
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/#/profile?reset=true' });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) console.error(error);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signInWithPhone, signUp, signOut, updateUser, verifyOtp, resendOtp, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// ------------------ DATA CONTEXT ------------------
interface DataContextType {
  products: Product[];
  categories: Category[];
  orders: Order[];
  isDarkMode: boolean;
  isDataLoading: boolean;
  toggleTheme: () => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (orderId: string, status: Order['status']) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addReview: (productId: string, review: Review) => Promise<void>;
  subscribeToNewsletter: (email: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (!isSupabaseConfigured()) return setIsDataLoading(false);

      const { data: cats } = await supabase.from('categories').select('*');
      if (cats) setCategories(cats);

      const { data: prods } = await supabase.from('products').select('*');
      if (prods) setProducts(prods);

      if (user) {
        const { data: ords } = await supabase.from('orders').select('*').eq('user_id', user.id).order('date', { ascending: false });
        if (ords) setOrders(ords);
      }
      setIsDataLoading(false);
    };
    loadData();
  }, [user]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.theme = newMode ? 'dark' : 'light';
      return newMode;
    });
  };

  const addProduct = async (product: Product) => {
    setProducts(prev => [...prev, product]);
    await supabase.from('products').insert(product);
  };

  const updateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    await supabase.from('products').update(product).eq('id', product.id);
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    await supabase.from('orders').insert(order);

    // Reduce stock
    for (const item of order.items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.id);
      }
    }
  };

  const updateOrder = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    await supabase.from('orders').update({ status }).eq('id', orderId);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    const wishlist = user.wishlist || [];
    const updated = wishlist.includes(productId) ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    await updateUser({ wishlist: updated });
  };

  const addReview = async (productId: string, review: Review) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedReviews = [...(product.reviews || []), review];
    const rating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
    await updateProduct({ ...product, reviews: updatedReviews, rating });
  };

  const subscribeToNewsletter = async (email: string) => {
    const { error } = await supabase.from('subscribers').insert({ email });
    return !error;
  };

  return (
    <DataContext.Provider value={{ products, categories, orders, isDarkMode, isDataLoading, toggleTheme, addProduct, updateProduct, deleteProduct, addOrder, updateOrder, toggleWishlist, addReview, subscribeToNewsletter }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
