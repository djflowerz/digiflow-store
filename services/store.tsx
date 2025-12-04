import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product, CartItem, User, Order, Review, Category } from '../types';
import { SUPER_ADMIN_EMAIL, CATEGORIES as INITIAL_CATEGORIES, MOCK_PRODUCTS, SUPABASE_URL } from '../constants';

// ------------------ CART CONTEXT ------------------
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('digiflow_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('digiflow_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
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
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: User }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string; needVerification?: boolean }>;
  signUp: (email: string, password: string, name: string, phone: string, referralCode?: string) => Promise<{ error?: string; needVerification?: boolean; user?: User }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias
  updateUser: (data: Partial<User>) => Promise<void>;
  verifyOtp: (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => Promise<{ error?: string; user?: User }>;
  resendOtp: (identifier: string, type?: 'signup' | 'sms') => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured()) {
          console.warn("Supabase not configured.");
          setIsLoading(false);
          return;
      }

      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
          await fetchUserProfile(session.user.id, session.user);
      } else {
          setIsLoading(false);
      }

      const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id, session.user);
        }
        if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('digiflow_user');
            setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    };
    initAuth();
  }, []);

  const fetchUserProfile = async (uid: string, sessionUser?: any) => {
    try {
        let profileData = null;
        
        // 1. Try to get profile from DB
        const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
        
        profileData = profile;

        // 2. Fallback: If DB fetch failed, construct user from Auth Session
        if (!profileData || error) {
            // Use passed sessionUser or fetch it
            let authUser = sessionUser;
            if (!authUser) {
                const { data } = await supabase!.auth.getUser();
                authUser = data.user;
            }
            
            if (authUser && authUser.id === uid) {
                 const newProfile = {
                     id: authUser.id,
                     email: authUser.email || '',
                     fullName: authUser.user_metadata?.full_name || 'User',
                     role: 'user', // Default
                     phone: authUser.phone || authUser.user_metadata?.phone || '',
                     referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                     addresses: [],
                     wishlist: []
                 };

                 // Attempt to self-heal (create profile) in background if table exists
                 if (error?.code === 'PGRST116') { // Row not found
                     supabase!.from('profiles').insert(newProfile).then(({ error: insertError }) => {
                         if (insertError) console.error("Auto-create profile failed:", insertError);
                     });
                 }
                 profileData = newProfile;
            }
        }

        // 3. Set User State & FORCE ADMIN if email matches
        if (profileData) {
            const isSuperAdmin = profileData.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();
            
            // CRITICAL FIX: Force Admin Role LOCALLY immediately
            if (isSuperAdmin) {
                profileData.role = 'admin';
                
                // Update DB in background to persist it
                if (profileData.id) {
                    supabase!.from('profiles').update({ role: 'admin' }).eq('id', profileData.id).then();
                }
            }

            const fullUser = {
                ...profileData,
                addresses: profileData.addresses || [],
                wishlist: profileData.wishlist || [],
                referralCount: profileData.referralCount || 0,
                referralEarnings: profileData.referralEarnings || 0
            } as User;

            setUser(fullUser);
            return fullUser;
        }
        return null;

    } catch (e) {
        console.error("Critical Profile Fetch Exception", e);
        return null;
    } finally {
        setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) return { error: "Supabase not connected." };
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    
    // Explicitly wait for profile fetch to determine role before returning
    const userProfile = await fetchUserProfile(data.user.id, data.user);
    return { user: userProfile || undefined };
  };

  const signInWithPhone = async (phone: string) => {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
    if (!formatted.startsWith('254')) formatted = '254' + formatted;

    const { error } = await supabase!.auth.signInWithOtp({ phone: '+' + formatted });
    if (error) return { error: error.message };
    return { needVerification: true };
  };

  const signUp = async (email: string, password: string, name: string, phone: string, referralCode?: string) => {
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, referral_code: referralCode },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) return { error: error.message };

    // If session is present immediately (auto-confirm enabled), fetch user profile
    if (data.session && data.user) {
        const userProfile = await fetchUserProfile(data.user.id, data.user);
        return { user: userProfile || undefined };
    }

    return { needVerification: true };
  };

  const verifyOtp = async (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => {
    const params: any = { token, type };
    if (type === 'sms') params.phone = identifier;
    else params.email = identifier;
    const { error } = await supabase!.auth.verifyOtp(params);
    if (error) return { error: error.message };
    
    // Fetch profile after verification to determine redirect
    const { data: { user } } = await supabase!.auth.getUser();
    let userProfile = undefined;
    if (user) {
        userProfile = await fetchUserProfile(user.id, user);
    }
    return { user: userProfile || undefined };
  };

  const resendOtp = async (identifier: string, type: 'signup' | 'sms' = 'signup') => {
    if (type === 'sms') {
      const { error } = await supabase!.auth.signInWithOtp({ phone: identifier });
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase!.auth.resend({ type: 'signup', email: identifier });
      if (error) return { error: error.message };
    }
    return { message: 'Sent' };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/#/profile?reset=true' });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase!.auth.signOut();
    setUser(null);
    localStorage.removeItem('digiflow_user');
    
    // Attempt to clear Supabase local storage keys if URL is present
    if (SUPABASE_URL) {
        try {
            const url = new URL(SUPABASE_URL);
            const projectRef = url.hostname.split('.')[0];
            localStorage.removeItem('sb-' + projectRef + '-auth-token');
        } catch (e) {
            // ignore invalid url
        }
    }
    // Force refresh to clear any stale state and redirect home
    window.location.href = '/index.html'; 
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    if (user.id) {
        const { error } = await supabase!.from('profiles').update(data).eq('id', user.id);
        if (error) console.error("Update User Error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, isLoading, signIn, signInWithPhone, signUp, signOut, logout: signOut, updateUser, verifyOtp, resendOtp, resetPassword,
        isAuthModalOpen, openAuthModal: () => setIsAuthModalOpen(true), closeAuthModal: () => setIsAuthModalOpen(false)
    }}>
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
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (orderId: string, status: Order['status']) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addReview: (productId: string, review: Review) => Promise<void>;
  subscribeToNewsletter: (email: string) => Promise<boolean>;
  seedDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (!isSupabaseConfigured()) {
          setIsDataLoading(false);
          return;
      }

      const { data: cats } = await supabase!.from('categories').select('*');
      if (cats && cats.length > 0) setCategories([{ id: 'all', name: 'All Products' }, ...cats]);

      const { data: prods } = await supabase!.from('products').select('*');
      if (prods) {
          // Fix missing images visual bug
          const fixedProds = prods.map((p: any) => ({
             ...p,
             images: (p.images && p.images.length > 0) ? p.images : [`https://picsum.photos/500/500?random=${p.id}`]
          }));
          setProducts(fixedProds as any);
      }

      if (user) {
        // Admin sees all, User sees own
        let query = supabase!.from('orders').select('*').order('date', { ascending: false });
        if (user.role !== 'admin') {
            query = query.eq('userId', user.id);
        }
        const { data: ords } = await query;
        if (ords) setOrders(ords as any);
      }
      setIsDataLoading(false);
    };
    loadData();

    // Theme logic
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    }
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
    await supabase!.from('products').insert(product);
  };

  const updateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    await supabase!.from('products').update(product).eq('id', product.id);
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase!.from('products').delete().eq('id', id);
  };

  const addCategory = async (category: Category) => {
      setCategories(prev => [...prev, category]);
      await supabase!.from('categories').insert(category);
  };

  const deleteCategory = async (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      await supabase!.from('categories').delete().eq('id', id);
  };

  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    await supabase!.from('orders').insert(order);

    // Reduce stock
    for (const item of order.items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        await supabase!.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.id);
      }
    }
  };

  const updateOrder = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    await supabase!.from('orders').update({ status }).eq('id', orderId);
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
    const { error } = await supabase!.from('subscribers').insert({ email });
    return !error;
  };

  const seedDatabase = async () => {
      try {
          const cats = INITIAL_CATEGORIES.filter(c => c.id !== 'all');
          await supabase!.from('categories').upsert(cats, { onConflict: 'id' });

          const prods = MOCK_PRODUCTS.map(p => ({
              ...p,
              reviews: [],
              images: p.images || ['https://picsum.photos/500/500']
          }));
          await supabase!.from('products').upsert(prods, { onConflict: 'id' });
          alert("Database seeded! Refresh page.");
      } catch (e) {
          console.error(e);
          alert("Seeding failed check console");
      }
  };

  return (
    <DataContext.Provider value={{ 
        products, categories, orders, isDarkMode, isDataLoading, toggleTheme, 
        addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, 
        addOrder, updateOrder, toggleWishlist, addReview, subscribeToNewsletter, seedDatabase
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
