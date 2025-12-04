import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Filter, Search, X, Eye } from 'lucide-react';
import { useData, useCart } from '../services/store';
import { Button, Modal, Pagination, StarRating } from '../components/UI';
import { CATEGORIES } from '../constants';
import { Product } from '../types';

const ITEMS_PER_PAGE = 9;

const Shop: React.FC = () => {
  const { products } = useData();
  const { addToCart } = useCart();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('cat') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState('relevance');
  const [minRating, setMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search suggestions logic
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5);
  }, [searchTerm, products]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesRating = p.rating >= minRating;
      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return -1; // Assuming mock data is already roughly ordered or random
      return 0; // Relevance (default order)
    });
  }, [products, selectedCategory, searchTerm, priceRange, sortBy, minRating]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, priceRange, sortBy, minRating]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Filter size={20} /> Categories
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-bold text-lg mb-4">Price Range</h3>
            <input 
              type="range" 
              min="0" max="100000" step="1000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>KES 0</span>
              <span>KES {priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
             <h3 className="font-bold text-lg mb-4">Rating</h3>
             <div className="space-y-2">
               {[4, 3, 2, 1].map(star => (
                 <label key={star} className="flex items-center gap-2 cursor-pointer group">
                   <input 
                    type="radio" 
                    name="rating" 
                    checked={minRating === star}
                    onChange={() => setMinRating(star)}
                    className="accent-primary-600"
                   />
                   <div className="flex">
                     <StarRating rating={star} />
                     <span className="text-sm text-gray-500 ml-2 group-hover:text-primary-600">& Up</span>
                   </div>
                 </label>
               ))}
               <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                    type="radio" 
                    name="rating" 
                    checked={minRating === 0}
                    onChange={() => setMinRating(0)}
                    className="accent-primary-600"
                   />
                   <span className="text-sm text-gray-500">Any Rating</span>
               </label>
             </div>
          </div>
        </div>

        {/* Product Grid & Top Bar */}
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 z-20 relative">
            
            {/* Search with Auto-suggest */}
            <div className="relative w-full sm:w-auto flex-grow max-w-md">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden z-30">
                  {searchSuggestions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearchTerm(p.name);
                        setShowSuggestions(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions && searchTerm && searchSuggestions.length === 0 && (
                 <div 
                   className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 text-center z-30 text-sm text-gray-500"
                   onClick={() => setShowSuggestions(false)}
                 >
                    No matches found
                 </div>
              )}
              {/* Overlay to close suggestions */}
              {showSuggestions && (
                <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)}></div>
              )}
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <Button variant="ghost" onClick={() => {
                setSelectedCategory('all');
                setSearchTerm('');
                setPriceRange([0, 100000]);
                setMinRating(0);
              }} className="mt-4">Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map(product => (
                  <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow relative">
                    <div className="relative h-64 bg-gray-100 dark:bg-gray-700 p-4 flex items-center justify-center">
                      <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                          <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" 
                          />
                      </Link>
                      {/* Quick View Button */}
                      <button 
                        onClick={() => setQuickViewProduct(product)}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
                      >
                        <Eye size={16} /> Quick View
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs text-gray-500 uppercase">{product.category}</p>
                        <div className="flex items-center gap-1">
                           <StarRating rating={product.rating} size={12} />
                        </div>
                      </div>
                      <Link to={`/product/${product.id}`}>
                          <h3 className="font-bold text-gray-900 dark:text-white truncate mb-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-primary-600">KES {product.price.toLocaleString()}</span>
                        <Button size="sm" onClick={() => addToCart(product)}>Add</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <Modal isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} title="Quick View" size="lg">
        {quickViewProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center p-4">
              <img src={quickViewProduct.images[0]} alt={quickViewProduct.name} className="max-w-full max-h-64 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{quickViewProduct.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                 <StarRating rating={quickViewProduct.rating} />
                 <span className="text-sm text-gray-500">({quickViewProduct.reviews.length} reviews)</span>
              </div>
              <p className="text-2xl font-bold text-primary-600 mb-4">KES {quickViewProduct.price.toLocaleString()}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{quickViewProduct.description}</p>
              <div className="flex gap-4">
                <Button onClick={() => {
                  addToCart(quickViewProduct);
                  setQuickViewProduct(null);
                }}>Add to Cart</Button>
                <Link to={`/product/${quickViewProduct.id}`} onClick={() => setQuickViewProduct(null)}>
                   <Button variant="outline">View Full Details</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Shop;
