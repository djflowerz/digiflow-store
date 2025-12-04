import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash, Edit, Upload, Database, RefreshCw, Users, Search, Package, Layers, Settings } from 'lucide-react';
import { useData } from '../services/store';
import { Button, Modal, Badge } from '../components/UI';
import { Product, User } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AdminDashboard: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, orders, categories, addCategory, deleteCategory, seedDatabase, updateOrder } = useData();
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seeding, setSeeding] = useState(false);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New Product Form State
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', price: 0, category: 'gadgets', description: '', stock: 0, images: []
  });

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Users when tab is active
  useEffect(() => {
      if (activeTab === 'users' && isSupabaseConfigured()) {
          setLoadingUsers(true);
          supabase!.from('profiles').select('*').then(({ data }) => {
              if (data) setUsers(data as any);
              setLoadingUsers(false);
          });
      }
  }, [activeTab]);

  const resetProductForm = () => {
      setProductForm({ name: '', price: 0, category: categories[0]?.id || 'gadgets', description: '', stock: 0, images: [] });
      setEditingProduct(null);
  };

  const handleEditProduct = (p: Product) => {
      setEditingProduct(p);
      setProductForm({ ...p, images: p.images || [] });
      setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: productForm.name!,
      description: productForm.description!,
      price: Number(productForm.price),
      category: productForm.category!,
      stock: Number(productForm.stock),
      images: productForm.images && productForm.images.length > 0 ? productForm.images : ['https://picsum.photos/500/500'],
      rating: editingProduct ? editingProduct.rating : 0,
      reviews: editingProduct ? editingProduct.reviews : []
    };

    if (editingProduct) {
        updateProduct(productData);
    } else {
        addProduct(productData);
    }
    
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCategoryName.trim()) return;
      const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
      addCategory({ id, name: newCategoryName });
      setNewCategoryName('');
  };

  const addImageUrl = () => {
      setProductForm(prev => ({ ...prev, images: [...(prev.images || []), ''] }));
  };

  const handleSeed = async () => {
    if (confirm("This will upload all initial mock products and categories to your Supabase database. Continue?")) {
      setSeeding(true);
      await seedDatabase();
      setSeeding(false);
    }
  };

  // Analytics Data
  const revenueData = [
    { name: 'Total Orders', value: orders.length },
    { name: 'Total Revenue', value: orders.reduce((sum, o) => sum + o.total, 0) / 1000 } // Scaled down for chart
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
           <p className="text-gray-500">Manage your store, products, and customers.</p>
        </div>
        {activeTab === 'products' && (
           <Button onClick={() => { resetProductForm(); setIsProductModalOpen(true); }}>
               <Plus size={20} className="mr-2" /> Add New Product
           </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b dark:border-gray-700 overflow-x-auto scrollbar-hide">
        <div className="flex gap-6">
            {[
                { id: 'analytics', label: 'Analytics', icon: null },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'orders', label: 'Orders', icon: Layers },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'categories', label: 'Categories', icon: Layers },
                { id: 'system', label: 'System', icon: Settings },
            ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 capitalize font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTab === tab.id 
                    ? 'border-b-2 border-primary-600 text-primary-600' 
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
            >
                {tab.icon && <tab.icon size={16}/>} {tab.label}
            </button>
            ))}
        </div>
      </div>

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
                 { label: 'Total Sales', value: `KES ${orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}`, color: 'bg-blue-500' },
                 { label: 'Total Orders', value: orders.length, color: 'bg-purple-500' },
                 { label: 'Products', value: products.length, color: 'bg-green-500' },
                 { label: 'Customers', value: users.length || (loadingUsers ? '...' : '0'), color: 'bg-orange-500' }
             ].map((stat, i) => (
                 <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                     <div className="text-gray-500 text-sm font-medium mb-1">{stat.label}</div>
                     <div className="text-2xl font-bold">{stat.value}</div>
                     <div className={`h-1 w-full mt-4 rounded-full ${stat.color} opacity-20`}>
                         <div className={`h-full w-2/3 rounded-full ${stat.color}`}></div>
                     </div>
                 </div>
             ))}
           </div>

           {/* Chart */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 h-96">
             <h3 className="font-bold mb-6 text-lg">Sales Overview</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip cursor={{ fill: '#F3F4F6' }} />
                 <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={60} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700">
                <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                <img src={p.images[0]} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                        </div>
                    </td>
                    <td className="p-4">
                        <Badge color="blue">{categories.find(c => c.id === p.category)?.name || p.category}</Badge>
                    </td>
                    <td className="p-4 font-mono">KES {p.price.toLocaleString()}</td>
                    <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.stock > 10 ? 'bg-green-100 text-green-800' : p.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-green-500' : p.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            {p.stock} units
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditProduct(p)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash size={18} />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                  <h3 className="font-bold flex items-center gap-2"><Users size={20}/> Registered Users</h3>
                  <div className="relative">
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none dark:bg-gray-700 dark:border-gray-600" />
                  </div>
              </div>
              
              {loadingUsers ? (
                  <div className="p-12 text-center text-gray-500">Loading users from database...</div>
              ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-750 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Referral Code</th>
                                <th className="p-4">Referred By</th>
                                <th className="p-4 text-right">Earnings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {users.map((u, i) => (
                                <tr key={u.id || i}>
                                    <td className="p-4">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">{u.email || u.phone}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm">{u.referralCode}</td>
                                    <td className="p-4 text-sm text-gray-500">{u.referredBy || '-'}</td>
                                    <td className="p-4 text-right font-bold text-green-600">KES {(u.referralEarnings || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )}
          </div>
      )}

      {/* --- CATEGORIES TAB --- */}
      {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                  <h3 className="font-bold mb-4 text-lg">Existing Categories</h3>
                  <div className="space-y-3">
                      {categories.filter(c => c.id !== 'all').map(c => (
                          <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                              <span className="font-medium">{c.name}</span>
                              <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                  <Trash size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 h-fit">
                  <h3 className="font-bold mb-4 text-lg">Add Category</h3>
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Category Name" 
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <Button type="submit"><Plus size={20} className="mr-1" /> Add</Button>
                  </form>
              </div>
          </div>
      )}

      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-750 text-xs text-gray-500 uppercase">
                      <tr>
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                      {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                              <td className="p-4 font-mono text-xs">{order.id}</td>
                              <td className="p-4 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                              <td className="p-4">
                                  <div className="text-sm font-bold">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</div>
                                  <div className="text-xs text-gray-500">{order.shippingAddress?.phone}</div>
                              </td>
                              <td className="p-4 font-bold">KES {order.total.toLocaleString()}</td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                  }`}>
                                      {order.status}
                                  </span>
                              </td>
                              <td className="p-4">
                                  <select 
                                      className="p-1 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
                                      value={order.status}
                                      onChange={(e) => updateOrder(order.id, e.target.value as any)}
                                  >
                                      <option value="paid">Paid</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                  </select>
                              </td>
                          </tr>
                      ))}
                      {orders.length === 0 && (
                          <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
              </div>
          </div>
      )}

      {/* --- SYSTEM TAB --- */}
      {activeTab === 'system' && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Database className="text-primary-600"/> System Operations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Manage your database state. Use "Sync / Seed Database" to populate your Supabase instance with the initial product catalog.
                  This is useful if your store is empty or if you want to reset demo data.
              </p>
              
              <div className="flex gap-4">
                  <Button onClick={handleSeed} disabled={seeding} isLoading={seeding}>
                      <Upload size={18} className="mr-2"/> 
                      {seeding ? 'Syncing...' : 'Sync / Seed Database'}
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw size={18} className="mr-2"/> Refresh Dashboard
                  </Button>
              </div>

              {!isSupabaseConfigured() && (
                   <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                       <strong>Note:</strong> Supabase is not configured. these operations will strictly affect local mock data state.
                   </div>
              )}
          </div>
      )}

      {/* Add/Edit Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
         <div className="space-y-4">
             <div>
                 <label className="block text-sm font-medium mb-1">Product Name</label>
                 <input 
                     type="text" 
                     className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                     value={productForm.name}
                     onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                 />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium mb-1">Price (KES)</label>
                     <input 
                         type="number" 
                         className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                         value={productForm.price}
                         onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                     />
                 </div>
                 <div>
                     <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                     <input 
                         type="number" 
                         className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                         value={productForm.stock}
                         onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                     />
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium mb-1">Category</label>
                 <select 
                     className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                     value={productForm.category}
                     onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                 >
                     {categories.filter(c => c.id !== 'all').map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                 </select>
             </div>

             <div>
                 <label className="block text-sm font-medium mb-1">Description</label>
                 <textarea 
                     className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                     rows={3}
                     value={productForm.description}
                     onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                 />
             </div>

             <div>
                 <label className="block text-sm font-medium mb-1">Images (URLs)</label>
                 {productForm.images?.map((img, idx) => (
                     <div key={idx} className="flex gap-2 mb-2">
                         <input 
                             type="text" 
                             className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                             value={img}
                             onChange={(e) => {
                                 const newImages = [...(productForm.images || [])];
                                 newImages[idx] = e.target.value;
                                 setProductForm({...productForm, images: newImages});
                             }}
                         />
                         <button 
                             onClick={() => {
                                 const newImages = productForm.images?.filter((_, i) => i !== idx);
                                 setProductForm({...productForm, images: newImages});
                             }}
                             className="text-red-500 p-2"
                         >
                             <Trash size={16}/>
                         </button>
                     </div>
                 ))}
                 <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={addImageUrl}>
                        <Plus size={14} className="mr-1"/> Add URL
                    </Button>
                 </div>
             </div>

             <div className="pt-4 flex justify-end gap-2">
                 <Button variant="ghost" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                 <Button onClick={handleSaveProduct}>Save Product</Button>
             </div>
         </div>
      </Modal>

    </div>
  );
};

export default AdminDashboard;
