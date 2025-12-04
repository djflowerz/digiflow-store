import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, Truck, ShieldCheck, Phone, Check, Clock, Quote, ImageIcon, AlertTriangle } from 'lucide-react';
import { useData, useCart, useAuth } from '../services/store';
import { Button, Badge, StarRating, Skeleton } from '../components/UI';
import { CATEGORIES } from '../constants';

const Home: React.FC = () => {
  const { products, subscribeToNewsletter, isDataLoading } = useData();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Deriving sections from products
  // Featured: First 4
  const featuredProducts = products.slice(0, 4);
  
  // New Arrivals: Try to take distinct items (e.g. from end of list), or fallback to reverse of first 4
  const newArrivals = products.length > 4 
    ? products.slice().reverse().slice(0, 4) 
    : products.slice().reverse().slice(0, 4); 

  const flashSale = products.find(p => p.isFlashSale);

  const handleSubscribe = async () => {
    if(!email) return;
    setSubmitting(true);
    const success = await subscribeToNewsletter(email);
    setSubmitting(false);
    if (success) {
        setSubscribed(true);
        setEmail('');
    } else {
        alert("Failed to subscribe. Please try again.");
    }
  };

  const testimonials = [
    { name: "Sarah K.", location: "Nairobi", text: "Ordered a power bank in the morning and received it by evening. Super fast delivery!", rating: 5 },
    { name: "Brian M.", location: "Mombasa", text: "The quality of the developer hoodie is amazing. Fits perfectly and very comfortable.", rating: 5 },
    { name: "Emmanuel O.", location: "Kisumu", text: "Great customer service. They helped me choose the right gaming keyboard for my setup.", rating: 4 },
  ];

  const ProductCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-60 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-8 w-16 rounded" />
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-16 pb-12">
      {/* Admin Setup Warning */}
      {user?.role === 'admin' && products.length === 0 && !isDataLoading && (
        <div className="container mx-auto px-4 mt-4">
           <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-orange-800 dark:text-orange-200">
                  <AlertTriangle size={24} />
                  <div>
                      <h3 className="font-bold">Store is Empty</h3>
                      <p className="text-sm">Your database has no products. Go to Admin Dashboard to seed initial data.</p>
                  </div>
              </div>
              <Link to="/admin">
                  <Button size="sm" variant="secondary">Go to Admin</Button>
              </Link>
           </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?grayscale" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-2xl animate-in slide-in-from-left duration-700">
            <Badge color="blue">New Arrivals</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mt-4 mb-6 leading-tight">
              Upgrade Your <span className="text-primary-500">Digital Life</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover the latest tech gadgets, accessories, and premium gear at Digiflow Store. Quality meets innovation.
            </p>
            <div className="flex gap-4">
              <Link to="/shop">
                <Button size="lg" variant="primary">Shop Now</Button>
              </Link>
              <Link to="/shop?cat=gadgets">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                  View Gadgets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Trust Badges */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Countrywide shipping in Kenya' },
            { icon: ShieldCheck, title: 'Secure Payment', desc: 'Integrated M-Pesa & Cards' },
            { icon: Star, title: 'Quality Guarantee', desc: 'Verified authentic products' },
            { icon: Phone, title: '24/7 Support', desc: 'Expert assistance anytime' },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg">
                <feature.icon size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
          <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.filter(c => c.id !== 'all').map((cat, idx) => (
            <Link 
              key={cat.id} 
              to={`/shop?cat=${cat.id}`}
              className="group relative h-48 rounded-xl overflow-hidden cursor-pointer shadow-sm"
            >
              <img 
                src={`https://picsum.photos/400/400?random=${10 + idx}`} 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <h3 className="text-white text-xl font-bold text-center px-4">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="text-primary-500" /> New Arrivals
            </h2>
            <Link to="/shop?sort=newest" className="text-primary-600 hover:text-primary-700 font-medium text-sm">See All</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isDataLoading ? (
             [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
          ) : newArrivals.length === 0 ? (
             <div className="col-span-full text-center py-8 text-gray-500">
               No new arrivals yet. Check back soon!
             </div>
          ) : (
             newArrivals.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
              <div className="relative h-60 overflow-hidden bg-gray-100 dark:bg-gray-700 p-4">
                 <Link to={`/product/${product.id}`} className="flex h-full w-full items-center justify-center">
                    {product.images?.[0] ? (
                        <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                    ) : (
                        <ImageIcon size={48} className="text-gray-300" />
                    )}
                 </Link>
                 <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">New</span>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">{product.category}</p>
                <Link to={`/product/${product.id}`}>
                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 truncate hover:text-primary-600">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">KES {product.price.toLocaleString()}</span>
                  <Button size="sm" onClick={() => addToCart(product)}>Add</Button>
                </div>
              </div>
            </div>
          )))}
        </div>
      </section>

      {/* Flash Deal */}
      {flashSale && !isDataLoading && (
        <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <Badge color="yellow">Flash Deal</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-2">{flashSale.name}</h2>
              <p className="text-lg opacity-90 mb-6">{flashSale.description}</p>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <span className="text-4xl font-bold">KES {(flashSale.price * 0.85).toLocaleString()}</span>
                <span className="text-xl opacity-75 line-through">KES {flashSale.price.toLocaleString()}</span>
              </div>
              <Button 
                onClick={() => addToCart(flashSale)}
                className="mt-6 bg-white text-red-600 hover:bg-gray-100 border-none"
                size="lg"
              >
                Add to Cart
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <img src={flashSale.images[0]} alt={flashSale.name} className="w-64 md:w-80 rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform bg-white p-2" />
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
          <TrendingUp className="text-primary-500" /> Trending Now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isDataLoading ? (
            [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
          ) : featuredProducts.length === 0 ? (
             <div className="col-span-full text-center py-8 text-gray-500">
               Check out our shop for amazing products.
             </div>
          ) : (
            featuredProducts.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
              <div className="relative h-60 overflow-hidden bg-gray-100 dark:bg-gray-700 p-4">
                 <Link to={`/product/${product.id}`} className="flex h-full w-full items-center justify-center">
                    {product.images?.[0] ? (
                        <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                    ) : (
                         <ImageIcon size={48} className="text-gray-300" />
                    )}
                 </Link>
                 {product.stock < 10 && (
                   <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Low Stock</span>
                 )}
              </div>
              <div className="p-4">
                <p className="text-xs text-primary-600 font-semibold mb-1 uppercase tracking-wider">{product.category}</p>
                <Link to={`/product/${product.id}`}>
                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 truncate hover:text-primary-600">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">KES {product.price.toLocaleString()}</span>
                  <Button size="sm" onClick={() => addToCart(product)}>Add</Button>
                </div>
              </div>
            </div>
          )))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
           <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">What Our Customers Say</h2>
              <p className="text-gray-500 dark:text-gray-400">Don't just take our word for it</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm relative">
                   <Quote className="absolute top-4 right-4 text-gray-200 dark:text-gray-700" size={40} />
                   <div className="mb-4">
                      <StarRating rating={t.rating} />
                   </div>
                   <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{t.text}"</p>
                   <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.location}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4">
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Join the Digiflow Community</h2>
            <p className="text-gray-400 mb-8">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {subscribed ? (
                <div className="w-full bg-green-600 p-4 rounded-lg flex items-center justify-center gap-2 animate-in fade-in">
                    <Check size={20} /> You have successfully subscribed!
                </div>
              ) : (
                <>
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-grow px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="primary" size="lg" onClick={handleSubscribe} isLoading={submitting}>Subscribe</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;