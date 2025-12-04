import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product, CartItem, User, Order, Review, Category, Address } from '../types';
import { MOCK_PRODUCTS, MOCK_USER, CATEGORIES as INITIAL_CATEGORIES, SUPER_ADMIN_EMAIL } from '../constants';

// --- Cart Context ---
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

  // Persist cart to localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('digiflow_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
  }, []);

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

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string; needVerification?: boolean }>;
  signUp: (email: string, pass: string, name: string, phone: string, referralCode?: string) => Promise<{ error?: string; needVerification?: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  verifyOtp: (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => Promise<{ error?: string }>;
  resendOtp: (identifier: string, type?: 'signup' | 'sms') => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children?: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase!.auth.getSession();
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
          }
        } else {
          // Mock Mode
          const storedUser = localStorage.getItem('digiflow_user');
          if (storedUser) {
             const parsed = JSON.parse(storedUser);
             // Ensure legacy structure compatibility
             if (!parsed.addresses) parsed.addresses = [];
             if (!parsed.wishlist) parsed.wishlist = [];
             setUser(parsed);
          }
        }
      } catch (e) {
        console.error("Auth Init Error", e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    // Listen for auth changes
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchUserProfile = async (uid: string) => {
    if (!supabase) return;
    try {
      // 1. Fetch Profile
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      // 2. Handle Admin Auto-Promotion (Security Feature)
      if (profile && profile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && profile.role !== 'admin') {
         console.log("Auto-promoting Super Admin...");
         const { error: updateErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', uid);
         if (!updateErr) profile.role = 'admin';
      }

      // 3. Handle Missing Profile (Race Condition or Trigger Failure)
      if (error && error.code === 'PGRST116') {
         // Profile doesn't exist, likely trigger failed or hasn't run.
         // Let's create it manually if we have the user metadata.
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (authUser) {
             const newProfile = {
                 id: authUser.id,
                 email: authUser.email,
                 fullName: authUser.user_metadata.full_name || 'User',
                 role: authUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
                 phone: authUser.user_metadata.phone || authUser.phone || '',
                 referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                 referralEarnings: 0,
                 referralCount: 0,
                 addresses: [],
                 wishlist: []
             };
             const { error: insertErr } = await supabase.from('profiles').insert(newProfile);
             if (!insertErr) profile = newProfile;
         }
      } else if (error && error.code === '42P01') {
         console.warn("Table 'profiles' does not exist. Please run the SQL migration.");
      }

      if (profile) {
        setUser({
           ...profile,
           addresses: profile.addresses || [],
           wishlist: profile.wishlist || []
        });
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (isSupabaseConfigured()) {
      // Check for Super Admin First
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
         // Attempt login
         const { error } = await supabase!.auth.signInWithPassword({ email, password: pass });
         if (error && error.message.includes("Invalid login")) {
             return { error: "Account not found. Please switch to 'Sign Up' to create the Admin account first." };
         }
         if (error) return { error: error.message };
         return {};
      }

      const { error } = await supabase!.auth.signInWithPassword({ email, password: pass });
      return { error: error?.message };
    } else {
      // Mock Logic
      if (email === MOCK_USER.email && pass === 'password') {
        setUser(MOCK_USER);
        localStorage.setItem('digiflow_user', JSON.stringify(MOCK_USER));
        return {};
      }
      // Mock Admin
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && pass === 'admin123') {
         const adminUser = { ...MOCK_USER, id: 'admin1', email, role: 'admin' as const, fullName: 'Super Admin' };
         setUser(adminUser);
         localStorage.setItem('digiflow_user', JSON.stringify(adminUser));
         return {};
      }
      return { error: 'Invalid credentials (Mock: demo@digiflow.com / password)' };
    }
  };

  const signInWithPhone = async (phone: string) => {
      // Format phone: ensure +254
      let formatted = phone.replace(/\D/g, '');
      if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
      if (formatted.startsWith('7') || formatted.startsWith('1')) formatted = '254' + formatted;
      formatted = '+' + formatted;

      if (isSupabaseConfigured()) {
          const { error } = await supabase!.auth.signInWithOtp({ phone: formatted });
          if (error) return { error: error.message };
          return { needVerification: true };
      } else {
          // Mock Phone Login
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          alert(`[MOCK SMS] Your DigiFlow verification code is: ${code}`);
          localStorage.setItem('mock_otp', code);
          localStorage.setItem('mock_phone', formatted);
          return { needVerification: true };
      }
  };

  const signUp = async (email: string, pass: string, name: string, phone: string, referralCode?: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: name, phone, referral_code: referralCode },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) return { error: error.message };
      // Even if session is null (confirmation required), we return success state
      return { needVerification: true };
    } else {
      // Mock Sign Up
      const newUser: User = { 
          ...MOCK_USER, 
          id: `u-${Date.now()}`, 
          email, 
          fullName: name, 
          phone, 
          referralCode: 'NEWUser',
          role: 'user'
      };
      
      // Simulate Email Verification
      alert(`[MOCK EMAIL] Verification link sent to ${email}. Click 'I verified' to login.`);
      localStorage.setItem('temp_user', JSON.stringify(newUser));
      return { needVerification: true };
    }
  };

  const verifyOtp = async (identifier: string, token: string, type: 'signup' | 'recovery' | 'magiclink' | 'sms') => {
      if (isSupabaseConfigured()) {
          // Supabase Verify
          const verifyParams: any = { token, type };
          if (type === 'sms') verifyParams.phone = identifier;
          else verifyParams.email = identifier;

          const { data, error } = await supabase!.auth.verifyOtp(verifyParams);
          if (error) return { error: error.message };
          return {};
      } else {
          // Mock Verify
          const mockCode = localStorage.getItem('mock_otp');
          if (type === 'sms' && token !== mockCode && token !== '123456') {
              return { error: 'Invalid Code' };
          }
          
          if (type === 'sms') {
               const phone = localStorage.getItem('mock_phone') || identifier;
               const user = { ...MOCK_USER, phone, fullName: 'Phone User' };
               setUser(user);
               localStorage.setItem('digiflow_user', JSON.stringify(user));
               return {};
          }

          // For email mock, we just assume it worked if they clicked the button
          const temp = localStorage.getItem('temp_user');
          if (temp) {
             setUser(JSON.parse(temp));
             localStorage.setItem('digiflow_user', temp);
          }
          return {};
      }
  };

  const resendOtp = async (identifier: string, type: 'signup' | 'sms' = 'signup') => {
      if (!isSupabaseConfigured()) {
          if (type === 'sms') {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              alert(`[MOCK SMS RESEND] Code: ${code}`);
              localStorage.setItem('mock_otp', code);
          } else {
              alert(`[MOCK EMAIL RESEND] Link sent to ${identifier}`);
          }
          return { message: 'Code resent successfully' };
      }

      if (type === 'sms') {
           const { error } = await supabase!.auth.signInWithOtp({ phone: identifier });
           if (error) return { error: error.message };
      } else {
           const { error } = await supabase!.auth.resend({ type: 'signup', email: identifier });
           if (error) return { error: error.message };
      }
      return { message: 'Verification sent successfully' };
  };

  const resetPassword = async (email: string) => {
      if(isSupabaseConfigured()) {
          const { error } = await supabase!.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + '/#/profile?reset=true'
          });
          if (error) return { error: error.message };
          return {};
      } else {
          alert(`[MOCK] Password reset link sent to ${email}`);
          return {};
      }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase!.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('digiflow_user');
    localStorage.removeItem('digiflow_remember_email');
    localStorage.removeItem('mock_otp');
    localStorage.removeItem('temp_user');
    window.location.href = '/';
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    // Optimistic Update
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    if (isSupabaseConfigured()) {
       const { error } = await supabase!.from('profiles').update(data).eq('id', user.id);
       if (error) console.error("Update failed", error);
    } else {
       localStorage.setItem('digiflow_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, isLoading, signIn, signInWithPhone, signUp, signOut, logout: signOut, updateUser, 
        isAuthModalOpen, openAuthModal: () => setIsAuthModalOpen(true), closeAuthModal: () => setIsAuthModalOpen(false),
        verifyOtp, resendOtp, resetPassword
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


// --- Data Context (Products, Orders, System) ---
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
  subscribeToNewsletter: (email: string) => Promise<boolean>;
  addReview: (productId: string, review: Review) => Promise<void>;
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

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
        setIsDataLoading(true);
        if (isSupabaseConfigured()) {
            // Fetch Categories
            const { data: cats } = await supabase!.from('categories').select('*');
            if (cats && cats.length > 0) {
                 // Ensure 'all' exists in UI but not DB
                 const uiCats = [{ id: 'all', name: 'All Products' }, ...cats];
                 setCategories(uiCats);
            }

            // Fetch Products
            const { data: prods } = await supabase!.from('products').select('*');
            if (prods) {
                // Ensure every product has at least one image to prevent broken UI
                const sanitizedProds = prods.map((p: any) => ({
                    ...p,
                    images: (p.images && p.images.length > 0) 
                        ? p.images 
                        : [`https://picsum.photos/500/500?random=${p.id}`]
                }));
                setProducts(sanitizedProds as any);
            }

            // Fetch Orders (RLS handles filtering)
            const { data: ords } = await supabase!.from('orders').select('*').order('date', { ascending: false });
            if (ords) setOrders(ords as any);
        } else {
            // Mock Data
            setProducts(MOCK_PRODUCTS);
        }
        setIsDataLoading(false);
    };
    loadData();

    // Theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [user]); // Reload orders when user changes

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
    setIsDarkMode(!isDarkMode);
  };

  const addProduct = async (product: Product) => {
    // Ensure image presence
    const pWithImage = {
        ...product,
        images: (product.images && product.images.length > 0) ? product.images : [`https://picsum.photos/500/500?random=${product.id}`]
    };

    setProducts(prev => [...prev, pWithImage]);
    if (isSupabaseConfigured()) {
        const { error } = await supabase!.from('products').insert(pWithImage);
        if(error) console.error(error);
    }
  };

  const updateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    if (isSupabaseConfigured()) {
        await supabase!.from('products').update(product).eq('id', product.id);
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (isSupabaseConfigured()) {
        await supabase!.from('products').delete().eq('id', id);
    }
  };

  const addCategory = async (cat: Category) => {
      setCategories(prev => [...prev, cat]);
      if (isSupabaseConfigured()) {
          await supabase!.from('categories').insert(cat);
      }
  };

  const deleteCategory = async (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      if (isSupabaseConfigured()) {
          await supabase!.from('categories').delete().eq('id', id);
      }
  };

  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);

    // 1. Update Stock Locally
    const updatedProducts = products.map(p => {
        const item = order.items.find(i => i.id === p.id);
        if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        return p;
    });
    setProducts(updatedProducts);

    // 2. Persist to DB
    if (isSupabaseConfigured()) {
        await supabase!.from('orders').insert(order);
        
        // Update Stock in DB for each item
        for (const item of order.items) {
            const current = products.find(p => p.id === item.id);
            if(current) {
                await supabase!.from('products').update({ stock: Math.max(0, current.stock - item.quantity) }).eq('id', item.id);
            }
        }

        // 3. Referral Rewards (5% to referrer)
        if (user && user.referredBy) {
             const reward = order.total * 0.05;
             console.log(`Adding ${reward} reward to referrer ${user.referredBy}`);
             // Note: In a real app, use an RPC call or Edge Function to safely update another user's balance
        }
    }
  };

  const updateOrder = async (orderId: string, status: Order['status']) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (isSupabaseConfigured()) {
          await supabase!.from('orders').update({ status }).eq('id', orderId);
      }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return alert("Please login to use wishlist");
    
    const current = user.wishlist || [];
    const updated = current.includes(productId) 
      ? current.filter(id => id !== productId)
      : [...current, productId];
    
    await updateUser({ wishlist: updated });
  };

  const addReview = async (productId: string, review: Review) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const updatedReviews = [...product.reviews, review];
      // Recalculate rating
      const total = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = total / updatedReviews.length;

      const updatedProduct = { ...product, reviews: updatedReviews, rating: newRating };
      await updateProduct(updatedProduct);
  };

  const subscribeToNewsletter = async (email: string) => {
      if(isSupabaseConfigured()) {
          const { error } = await supabase!.from('subscribers').insert({ email });
          return !error;
      }
      return true; // Mock success
  };

  const seedDatabase = async () => {
    if (!isSupabaseConfigured()) return;
    try {
        console.log("Seeding Database...");
        
        // 1. Upload Categories (Exclude virtual 'all')
        const cats = INITIAL_CATEGORIES.filter(c => c.id !== 'all');
        const { error: catErr } = await supabase!.from('categories').upsert(cats, { onConflict: 'id' });
        if(catErr) throw catErr;

        // 2. Upload Products
        // Transform products to match DB schema if needed (arrays/json)
        const prods = MOCK_PRODUCTS.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            images: p.images,
            stock: p.stock,
            rating: p.rating,
            reviews: p.reviews,
            "isFlashSale": p.isFlashSale || false,
            discount: p.discount || 0,
            "flashSaleEndTime": p.flashSaleEndTime || null,
            tags: p.tags || []
        }));

        const { error: prodErr } = await supabase!.from('products').upsert(prods, { onConflict: 'id' });
        if(prodErr) throw prodErr;

        alert("Database populated successfully! Refresh the page.");
    } catch (e: any) {
        console.error("Seed Error", e);
        alert(`Seeding failed: ${e.message}`);
    }
  };

  return (
    <DataContext.Provider value={{ 
      products, categories, orders, isDarkMode, isDataLoading, toggleTheme, 
      addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, addOrder, updateOrder,
      toggleWishlist, subscribeToNewsletter, addReview, seedDatabase
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