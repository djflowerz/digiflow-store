import React, { PropsWithChildren, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, DataProvider, useAuth, useData } from './services/store';
import AdminDashboard from './pages/AdminDashboard';
import { LayoutDashboard, LogOut, Moon, Sun, ShoppingBag, Home, Menu, X } from 'lucide-react';
import AuthModal from './components/AuthModal';

// --- Admin Layout Components ---

const AdminLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, logout, isLoading, openAuthModal } = useAuth();
  const { isDarkMode, toggleTheme } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-primary-600">Loading Dashboard...</div>;
  }

  // Auth Guard: If not admin, show restricted access
  if (!user || user.role !== 'admin') {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <LayoutDashboard size={32} />
                 </div>
                 <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
                 <p className="text-gray-500 mb-6">You must be logged in as an administrator to access this dashboard.</p>
                 
                 {user ? (
                     <div className="space-y-3">
                         <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded">Current Role: {user.role}</p>
                         <button onClick={logout} className="text-gray-500 hover:text-gray-900 text-sm underline">Logout</button>
                         <div className="mt-4">
                            <a href="/" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Return to Store</a>
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                        <button onClick={openAuthModal} className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors">
                            Login as Admin
                        </button>
                        <a href="/" className="block text-primary-600 hover:underline">Return to Store</a>
                     </div>
                 )}
             </div>
             <AuthModal />
        </div>
     );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
       {/* Mobile Sidebar Overlay */}
       {isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-black/50 z-20 md:hidden"
           onClick={() => setIsSidebarOpen(false)}
         />
       )}

       {/* Sidebar */}
       <aside className={`
          fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       `}>
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-lg flex items-center justify-center font-bold">D</div>
                <span className="text-xl font-bold">Digiflow Admin</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
               <X size={20} />
             </button>
          </div>
          
          <div className="p-4">
              <div className="text-xs text-gray-500 uppercase font-bold mb-4 px-2">Menu</div>
              <nav className="space-y-1">
                  <button onClick={() => setIsSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 bg-primary-700 text-white rounded-lg shadow-sm">
                      <LayoutDashboard size={18} /> Dashboard
                  </button>
                  <a href="/" className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                      <ShoppingBag size={18} /> View Store
                  </a>
              </nav>
          </div>

          <div className="mt-auto p-4 border-t border-gray-800">
             <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm">
                 <LogOut size={16} /> Logout
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <div className="flex-grow flex flex-col min-h-screen w-full md:w-auto">
          {/* Top Bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300">
                     <Menu size={24} />
                  </button>
                  <div className="md:hidden font-bold text-xl flex items-center gap-2">
                    Admin
                  </div>
              </div>
              
              <div className="hidden md:block text-gray-500 dark:text-gray-400 text-sm">
                 Welcome back, {user.fullName}
              </div>
              <div className="flex items-center gap-4">
                 <a href="/" className="md:hidden p-2 text-gray-500"><Home size={20} /></a>
                 <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
              </div>
          </header>

          {/* Page Content */}
          <main className="p-6 overflow-y-auto flex-grow">
             <AdminDashboard />
          </main>
       </div>
       <AuthModal />
    </div>
  );
};

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