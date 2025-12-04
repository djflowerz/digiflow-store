import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, Search, User, Moon, Sun, Heart, MessageCircle, Facebook, Twitter, Instagram } from 'lucide-react';
import { useCart, useAuth, useData } from '../services/store';
import { Button } from './UI';
import Chatbot from './Chatbot';
import AuthModal from './AuthModal';

export const Header: React.FC = () => {
  const { cartCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const { isDarkMode, toggleTheme } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600">Digiflow</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
          <Link to="/shop" className="text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400">Shop</Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400">About</Link>
          {user?.role === 'admin' && (
             <a href="/admin.html" className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1">
                Admin Panel
             </a>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <Link to="/shop" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full hidden sm:block">
            <Search size={20} />
          </Link>

          <Link to="/cart" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link to="/profile" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <User size={20} />
            </Link>
          ) : (
             <Button size="sm" onClick={openAuthModal}>Login</Button>
          )}

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900 absolute w-full shadow-lg z-50">
            <nav className="flex flex-col gap-4">
                 <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                 <Link to="/shop" onClick={() => setIsMenuOpen(false)}>Shop</Link>
                 <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
                 {user ? (
                   <Link to="/profile" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                 ) : (
                   <button onClick={() => { setIsMenuOpen(false); openAuthModal(); }} className="text-left font-medium text-primary-600">Login / Sign Up</button>
                 )}
                 {user?.role === 'admin' && (
                    <a href="/admin.html" className="text-red-500 font-medium">Go to Admin Dashboard</a>
                 )}
            </nav>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
             <h3 className="text-xl font-bold mb-4">Digiflow Store</h3>
             <p className="text-gray-400 text-sm mb-4">Your premium destination for tech gadgets, accessories, and modern lifestyle products.</p>
             <div className="flex gap-4">
               <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
               <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
             </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/shop?cat=phones" className="hover:text-white transition-colors">Mobile Accessories</Link></li>
              <li><Link to="/shop?cat=computers" className="hover:text-white transition-colors">Computers</Link></li>
              <li><Link to="/shop?cat=clothing" className="hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/shop?cat=gadgets" className="hover:text-white transition-colors">Gadgets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/profile" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <a href="tel:+254712293303" className="block text-sm text-gray-400 hover:text-white mb-1">Phone: +254 712 293 303</a>
            <a href="mailto:digiflowstore1@gmail.com" className="block text-sm text-gray-400 hover:text-white mb-2">Email: digiflowstore1@gmail.com</a>
            <p className="text-sm text-gray-400 mt-2">Nairobi, Kenya</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Digiflow Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Chatbot />
      <AuthModal />
    </div>
  );
};

export default Layout;