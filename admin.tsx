import React, { PropsWithChildren, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, DataProvider, useAuth, useData } from './services/store';
import AdminDashboard from './pages/AdminDashboard';
import { LayoutDashboard, LogOut, Moon, Sun, ShoppingBag, Home, Menu, X, Lock, AlertCircle } from 'lucide-react';
import { Button } from './components/UI';
import AuthModal from './components/AuthModal';

// --- Admin Layout Components ---

const AdminLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, logout, isLoading, signIn } = useAuth();
  const { isDarkMode, toggleTheme } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Local state for the Admin Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-primary-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        Loading Admin Portal...
      </div>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    // Attempt login
    const { error } = await signIn(email, password);
    
    if (error) {
      setLoginError(error);
    } else {
      // Login successful, the useEffect or re-render will check user.role
      // Note: If the user logs in but is NOT an admin, the UI will still show this form 
      // but with the error below (handled by the check after this function).
      setTimeout(() => {
         // Small delay to allow state update. 
         // If still here, it means role is not admin.
         setLoginError("Login successful, but this account is not an Administrator.");
      }, 1000);
    }
    setIsLoggingIn(false);
  };

  // Auth Guard: If not admin, show dedicated Admin Login Screen
  if (!user || user.role !== 'admin') {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border dark:border-gray-700">
                 <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform -rotate-3">
                         <Lock size={32} />
                     </div>
                     <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                     <p className="text-gray-500 dark:text-gray-400 mt-2">Secure access for store managers</p>
                 </div>

                 {/* If logged in as user, show small notice but keep login form active */}
                 {user && (
                   <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-yellow-800 dark:text-yellow-200">
                        Logged in as <strong>{user.email}</strong> (Customer)
                      </span>
                      <button onClick={logout} className="text-yellow-900 dark:text-yellow-100 underline hover:no-underline font-bold">
                        Sign Out
                      </button>
                   </div>
                 )}

                 {loginError && (
                   <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-300 animate-pulse">
                      <AlertCircle size={16} /> {loginError}
                   </div>
                 )}
                 
                 <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="admin@digiflow.store"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full py-3 text-base font-bold shadow-lg shadow-primary-500/30" 
                      isLoading={isLoggingIn}
                    >
                      Login to Dashboard
                    </Button>
                 </form>

                 <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors">
                      <ArrowLeftIcon /> Return to Storefront
                    </a>
                 </div>
             </div>
             
             <div className="mt-8 text-center text-xs text-gray-400">
               &copy; {new Date().getFullYear()} Digiflow Store Admin. Secured by Supabase.
             </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 relative overflow-hidden transition-colors duration-200">
       {/* Mobile Sidebar Overlay */}
       {isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
           onClick={() => setIsSidebarOpen(false)}
         />
       )}

       {/* Sidebar */}
       <aside className={`
          fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-30 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       `}>
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-primary-900/50">D</div>
                <span className="text-xl font-bold tracking-tight">Digiflow</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
               <X size={20} />
             </button>
          </div>
          
          <div className="p-4 flex-grow overflow-y-auto">
              <div className="text-xs text-gray-500 uppercase font-bold mb-4 px-2 tracking-wider">Main Menu</div>
              <nav className="space-y-1">
                  <button onClick={() => setIsSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 bg-primary-700 text-white rounded-lg shadow-md border border-primary-600">
                      <LayoutDashboard size={18} /> Dashboard
                  </button>
                  <a href="/" className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                      <ShoppingBag size={18} /> View Storefront
                  </a>
              </nav>
          </div>

          <div className="p-4 border-t border-gray-800 bg-gray-900">
             <div className="flex items-center gap-3 mb-4 px-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-inner font-bold text-xs">
                    {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user.fullName}</p>
                    <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">{user.role}</p>
                </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium">
                 <LogOut size={16} /> Sign Out
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <div className="flex-grow flex flex-col min-h-screen w-full md:w-auto overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10 border-b dark:border-gray-700">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                     <Menu size={24} />
                  </button>
                  <div className="md:hidden font-bold text-xl flex items-center gap-2 dark:text-white">
                    Admin
                  </div>
              </div>
              
              <div className="hidden md:block text-gray-500 dark:text-gray-400 text-sm font-medium">
                 {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-2">
                 <a href="/" className="md:hidden p-2 text-gray-500 dark:text-gray-400"><Home size={20} /></a>
                 <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
              </div>
          </header>

          {/* Page Content */}
          <main className="p-6 overflow-y-auto flex-grow bg-gray-100 dark:bg-gray-900">
             <AdminDashboard />
          </main>
       </div>
       <AuthModal />
    </div>
  );
};

// Simple Icon component for the login screen
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <AdminLayout />
      </DataProvider>
    </AuthProvider>
  );
};

// Mount Root
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AdminApp />);
}
