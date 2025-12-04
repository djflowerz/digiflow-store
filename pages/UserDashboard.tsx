import React, { useState } from 'react';
import { Package, User, Gift, Heart, LogOut, Save } from 'lucide-react';
import { useAuth, useData } from '../services/store';
import { Button, OrderStepper } from '../components/UI';

const UserDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { orders, products } = useData();
  const [activeTab, setActiveTab] = useState('orders');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });

  if (!user) return null;

  const userOrders = orders.filter(o => o.userId === user.id);
  const wishlistItems = products.filter(p => user.wishlist?.includes(p.id));

  const startEdit = () => {
      setEditForm({ fullName: user.fullName, phone: user.phone || '' });
      setEditMode(true);
  };

  const saveProfile = async () => {
      await updateUser({ fullName: editForm.fullName, phone: editForm.phone });
      setEditMode(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2 flex-shrink-0">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center mb-6">
            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {user.fullName.charAt(0)}
            </div>
            <h3 className="font-bold">{user.fullName}</h3>
            <p className="text-sm text-gray-500 break-words">{user.email}</p>
          </div>

          {[
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'profile', label: 'Profile Details', icon: User },
            { id: 'referrals', label: 'Referrals & Rewards', icon: Gift },
            { id: 'wishlist', label: 'Wishlist', icon: Heart },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
          
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-8 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Order History</h2>
              {userOrders.length === 0 ? <p className="text-gray-500">No orders yet.</p> : (
                userOrders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                      <div>
                        <p className="font-bold text-lg">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}</p>
                      </div>
                      <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs uppercase font-bold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Order Tracking Stepper */}
                    <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg px-4">
                      <OrderStepper status={order.status} />
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                                <img src={item.images[0]} className="w-full h-full object-cover" />
                             </div>
                             <span>{item.quantity}x {item.name}</span>
                          </div>
                          <span className="font-medium">KES {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t dark:border-gray-700 pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>KES {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Referral Program</h2>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 rounded-lg mb-8">
                <p className="text-sm text-primary-800 dark:text-primary-200 mb-2">Share your unique link and earn cash!</p>
                <div className="flex gap-2">
                  <code className="bg-white dark:bg-black px-4 py-2 rounded border flex-grow truncate">
                    https://digiflow.store/register?ref={user.referralCode}
                  </code>
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(`https://digiflow.store/register?ref=${user.referralCode}`)}>Copy</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary-600">{user.referralCount}</p>
                  <p className="text-sm text-gray-500">Friends Invited</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">KES {user.referralEarnings}</p>
                  <p className="text-sm text-gray-500">Total Earned</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {wishlistItems.map(p => (
                 <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex gap-4 transition-transform hover:scale-[1.02]">
                    <img src={p.images[0]} className="w-20 h-20 object-cover rounded" />
                    <div>
                      <h4 className="font-bold line-clamp-2">{p.name}</h4>
                      <p className="text-primary-600 font-bold mt-1">KES {p.price.toLocaleString()}</p>
                      <Button size="sm" className="mt-2" onClick={() => window.location.hash = `/product/${p.id}`}>View</Button>
                    </div>
                 </div>
               ))}
               {wishlistItems.length === 0 && <p className="text-gray-500">Wishlist empty.</p>}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Profile Details</h2>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        {editMode ? (
                            <input 
                                type="text" 
                                value={editForm.fullName} 
                                onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                                className="w-full p-2 border rounded" 
                            />
                        ) : (
                            <input type="text" disabled value={user.fullName} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="text" disabled value={user.email} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 cursor-not-allowed" />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                         {editMode ? (
                            <input 
                                type="text" 
                                value={editForm.phone} 
                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                className="w-full p-2 border rounded" 
                            />
                        ) : (
                            <input type="text" disabled value={user.phone} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700" />
                        )}
                    </div>
                    <div className="pt-4">
                        {editMode ? (
                            <div className="flex gap-2">
                                <Button onClick={saveProfile}><Save size={16} className="mr-2"/> Save Changes</Button>
                                <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                            </div>
                        ) : (
                             <Button variant="outline" onClick={startEdit}>Edit Profile</Button>
                        )}
                    </div>
                </div>
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    <h4 className="font-bold">Privacy Note</h4>
                    <p>Your data is secured. We only use your phone number for order processing and M-Pesa transactions.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;