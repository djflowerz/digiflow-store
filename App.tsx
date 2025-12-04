import React, { PropsWithChildren, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, CartProvider, DataProvider, useAuth } from './services/store';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CartCheckout from './pages/CartCheckout';
import UserDashboard from './pages/UserDashboard';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PrivateRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-20 text-center text-primary-600">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <DataProvider>
          <HashRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartCheckout />} />
                
                {/* Protected User Routes */}
                <Route path="/profile" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </HashRouter>
        </DataProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;