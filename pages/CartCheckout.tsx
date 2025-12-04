import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, CreditCard, CheckCircle, AlertCircle, Smartphone, RefreshCw, ArrowRight, MapPin, Home } from 'lucide-react';
import { useCart, useAuth, useData } from '../services/store';
import { Button, Modal } from '../components/UI';
import { initiateSTKPush } from '../services/mpesaService';
import { MPESA_TILL_NUMBER } from '../constants';
import { Address } from '../types';

// Mock Regions and Cities for Kenya
const KENYA_REGIONS: Record<string, string[]> = {
  'Nairobi': ['CBD', 'Westlands', 'Kilimani', 'Karen', 'Langata', 'Kasarani', 'Embakasi', 'Roysambu'],
  'Mombasa': ['Mombasa Island', 'Nyali', 'Bamburi', 'Likoni', 'Changamwe'],
  'Kisumu': ['Kisumu CBD', 'Milimani', 'Kondele', 'Nyamasaria'],
  'Nakuru': ['Nakuru Town', 'Njoro', 'Naivasha', 'Gilgil'],
  'Kiambu': ['Thika', 'Ruiral', 'Kiambu Town', 'Kikuyu'],
  'Eldoret': ['Eldoret Town', 'Langas', 'Kapsoya'],
};

const CartCheckout: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, openAuthModal, updateUser } = useAuth();
  const { addOrder } = useData();
  
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'waiting_confirmation'>('cart');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Detailed New Address Form State
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    firstName: '',
    lastName: '',
    phone: '',
    phonePrefix: '+254',
    additionalPhone: '',
    street: '', // Address / Building
    additionalInfo: '',
    region: 'Nairobi',
    city: '',
    isDefault: false
  });

  // Set default address and phone when entering shipping step
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
        // If a default exists, select it, otherwise select the first one
        const defaultAddr = user.addresses.find(a => a.isDefault);
        if (defaultAddr && !selectedAddressId) {
            setSelectedAddressId(defaultAddr.id);
        } else if (!selectedAddressId) {
            setSelectedAddressId(user.addresses[0].id);
        }
    }
  }, [user, step]);

  const handleCheckoutClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setStep('shipping');
  };

  const handleAddAddress = async () => {
    if (!newAddress.firstName || !newAddress.lastName || !newAddress.phone || !newAddress.street || !newAddress.city) {
        alert("Please fill in all required fields (Name, Phone, Address, City).");
        return;
    }

    const address: Address = {
        id: Date.now().toString(),
        firstName: newAddress.firstName!,
        lastName: newAddress.lastName!,
        phone: newAddress.phone!,
        phonePrefix: newAddress.phonePrefix || '+254',
        additionalPhone: newAddress.additionalPhone,
        street: newAddress.street!, // "Address" in form
        additionalInfo: newAddress.additionalInfo,
        region: newAddress.region || 'Nairobi',
        city: newAddress.city!,
        isDefault: newAddress.isDefault
    };

    let updatedAddresses = [...(user?.addresses || [])];
    
    if (address.isDefault) {
        // If new is default, remove default flag from others and put new at top
        updatedAddresses = updatedAddresses.map(a => ({...a, isDefault: false}));
        updatedAddresses.unshift(address);
    } else {
        updatedAddresses.push(address);
    }

    await updateUser({ addresses: updatedAddresses });
    
    // Auto select the new address
    setSelectedAddressId(address.id);
    setIsAddressModalOpen(false);
    
    // Reset form
    setNewAddress({
        firstName: '', lastName: '', phone: '', phonePrefix: '+254', 
        additionalPhone: '', street: '', additionalInfo: '', 
        region: 'Nairobi', city: '', isDefault: false 
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
        alert("Please select a shipping address.");
        return;
    }
    setStep('payment');
  };

  const handleMpesaPayment = async () => {
    if (!user) return alert("Session expired. Please login again.");
    
    const selectedAddress = user.addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return alert("Please select a shipping address.");
    
    const phoneToUse = `254${selectedAddress.phone.replace(/^0+/, '')}`; // Ensure 254 format

    setProcessing(true);
    setPaymentStatus('Initiating STK Push...');

    try {
      const orderId = `ORD-${Date.now()}`;
      
      const response = await initiateSTKPush({
        phoneNumber: phoneToUse,
        amount: cartTotal,
        accountReference: orderId
      });

      if (response.success) {
        setPaymentStatus(response.message);
        setCheckoutRequestId(response.checkoutRequestID || '');
        setStep('waiting_confirmation'); 
        setProcessing(false);
      } else {
        // Show detailed error
        setPaymentStatus(`Failed: ${response.message}`);
        setProcessing(false);
      }
    } catch (e) {
      console.error(e);
      setPaymentStatus('System error. Please try again.');
      setProcessing(false);
    }
  };

  const confirmPaymentManually = () => {
    if (!user) return;
    
    const selectedAddress = user.addresses.find(a => a.id === selectedAddressId) || user.addresses[0];

    const orderId = `ORD-${Date.now()}`;
    
    addOrder({
      id: orderId,
      userId: user.id,
      items: [...cart],
      total: cartTotal,
      status: 'paid',
      date: new Date().toISOString(),
      paymentMethod: 'mpesa',
      shippingAddress: selectedAddress!
    });
    
    setSuccessModal(true);
    clearCart();
  };

  const activeAddress = user?.addresses.find(a => a.id === selectedAddressId);

  if (cart.length === 0 && !successModal) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mb-6 inline-flex p-6 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
           <CreditCard size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={() => window.location.hash = '#/shop'}>Start Shopping</Button>
      </div>
    );
  }

  // Helper to render Breadcrumbs
  const Breadcrumb = () => (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span className={step === 'cart' ? 'font-bold text-primary-600' : ''}>Cart</span>
          <ArrowRight size={14} />
          <span className={step === 'shipping' ? 'font-bold text-primary-600' : ''}>Shipping</span>
          <ArrowRight size={14} />
          <span className={(step === 'payment' || step === 'waiting_confirmation') ? 'font-bold text-primary-600' : ''}>Payment</span>
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold mb-8">
        {step === 'cart' ? 'Shopping Cart' : step === 'shipping' ? 'Shipping Details' : 'Payment'}
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content Area */}
        <div className="flex-grow space-y-6">
          
          {/* STEP 1: CART ITEMS */}
          {step === 'cart' && cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
              <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-grow">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">KES {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded"><Minus size={16} /></button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded"><Plus size={16} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
            </div>
          ))}

          {/* STEP 2: SHIPPING ADDRESS */}
          {step === 'shipping' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2"><MapPin size={20}/> Customer Address</h3>
                        <Button size="sm" variant="outline" onClick={() => setIsAddressModalOpen(true)}><Plus size={16} className="mr-1"/> Add New Address</Button>
                    </div>

                    {(!user?.addresses || user.addresses.length === 0) ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200">
                            <MapPin size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>No addresses found.</p>
                            <button onClick={() => setIsAddressModalOpen(true)} className="text-primary-600 font-bold text-sm mt-2 hover:underline">Add your first address</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.addresses.map(addr => (
                                <div 
                                    key={addr.id}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all relative ${
                                        selectedAddressId === addr.id 
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                                        : 'border-transparent bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {selectedAddressId === addr.id && (
                                        <div className="absolute top-2 right-2 text-primary-600">
                                            <CheckCircle size={18} fill="currentColor" className="text-white" />
                                        </div>
                                    )}
                                    {addr.isDefault && (
                                        <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mb-1 inline-block">Default</span>
                                    )}
                                    <div className="font-bold text-sm mb-1">{addr.firstName} {addr.lastName}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {addr.street}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {addr.city}, {addr.region}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <Smartphone size={12}/> +254 {addr.phone}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Items Summary (Compact) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Order Items ({cart.reduce((a,c)=>a+c.quantity,0)})</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {cart.map(item => (
                             <img key={item.id} src={item.images[0]} className="w-16 h-16 rounded object-cover border" title={item.name} />
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {(step === 'payment' || step === 'waiting_confirmation') && (
              <div className="space-y-6">
                  {/* Address Recap */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center">
                      <div>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Shipping To</p>
                          <p className="font-bold text-sm">{activeAddress?.firstName} {activeAddress?.lastName}</p>
                          <p className="text-sm text-gray-600">{activeAddress?.city}, {activeAddress?.region}</p>
                      </div>
                      <button onClick={() => setStep('shipping')} className="text-primary-600 text-sm font-medium hover:underline">Change</button>
                  </div>

                   {step === 'payment' ? (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6 p-4 border rounded-lg bg-green-50 dark:bg-green-900/10 border-green-200">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                MP
                            </div>
                            <div>
                                <h3 className="font-bold text-green-800 dark:text-green-300">M-PESA</h3>
                                <p className="text-sm text-green-700 dark:text-green-400">Fast, secure mobile payment</p>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="mb-2">A payment request will be sent to:</p>
                            <p className="text-xl font-bold font-mono mb-6">+254 {activeAddress?.phone}</p>
                            
                            {paymentStatus && !paymentStatus.includes('success') && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm flex items-center justify-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{paymentStatus}</span>
                                </div>
                            )}

                            <Button 
                                onClick={handleMpesaPayment} 
                                className="w-full bg-[#4CAF50] hover:bg-[#43a047] text-white py-4 text-lg h-auto" 
                                isLoading={processing}
                            >
                                {processing ? 'Sending Request...' : `Pay KES ${cartTotal.toLocaleString()}`}
                            </Button>
                        </div>
                      </div>
                   ) : (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border dark:border-gray-700 text-center">
                         <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Smartphone size={40} />
                         </div>
                         <h3 className="font-bold text-xl mb-2">Check your phone</h3>
                         <p className="text-gray-600 dark:text-gray-300 mb-6">
                           We've sent an M-Pesa prompt to <strong>+254 {activeAddress?.phone}</strong>.<br/>
                           Please enter your PIN to authorize the payment of <strong>KES {cartTotal.toLocaleString()}</strong>.
                         </p>
                         
                         <div className="flex flex-col gap-3 max-w-xs mx-auto">
                             <Button onClick={confirmPaymentManually} className="w-full">
                               I Have Completed Payment
                             </Button>
                             <Button variant="ghost" onClick={() => setStep('payment')} className="w-full text-sm">
                               <RefreshCw size={14} className="mr-2"/> Retry Payment
                             </Button>
                         </div>
                      </div>
                   )}
              </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 sticky top-24">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KES {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-4 mb-6 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>KES {cartTotal.toLocaleString()}</span>
            </div>

            {step === 'cart' && (
              <>
                {!user && (
                    <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded flex items-center gap-2">
                        <AlertCircle size={16} /> Login required to checkout
                    </div>
                )}
                <Button onClick={handleCheckoutClick} className="w-full" size="lg">Proceed to Checkout</Button>
              </>
            )}

            {step === 'shipping' && (
                <Button onClick={handleProceedToPayment} className="w-full" size="lg" disabled={!selectedAddressId}>Proceed to Payment</Button>
            )}

            {(step === 'payment' || step === 'waiting_confirmation') && (
                <Button variant="ghost" onClick={() => setStep('shipping')} className="w-full" disabled={processing}>Back to Shipping</Button>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal - Redesigned */}
      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Add New Address" size="lg">
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.firstName}
                        onChange={e => setNewAddress({...newAddress, firstName: e.target.value})}
                        placeholder="e.g. Ian"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.lastName}
                        onChange={e => setNewAddress({...newAddress, lastName: e.target.value})}
                        placeholder="e.g. Wanjohi"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        disabled 
                        value="+254" 
                        className="w-20 p-2.5 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-center text-gray-500"
                      />
                      <input 
                        type="tel" 
                        className="flex-grow p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.phone}
                        onChange={e => setNewAddress({...newAddress, phone: e.target.value.replace(/\D/g,'')})} // Only numbers
                        placeholder="712345678"
                        maxLength={9}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1">Additional Phone Number (Optional)</label>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        disabled 
                        value="+254" 
                        className="w-20 p-2.5 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-center text-gray-500"
                      />
                      <input 
                        type="tel" 
                        className="flex-grow p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.additionalPhone}
                        onChange={e => setNewAddress({...newAddress, additionalPhone: e.target.value.replace(/\D/g,'')})}
                        placeholder="712..."
                        maxLength={9}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1">Address / Building / Street</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                    value={newAddress.street}
                    onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                    placeholder="e.g. Digiflow Towers, Moi Avenue"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium mb-1">Additional Information (Optional)</label>
                  <textarea 
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                    value={newAddress.additionalInfo}
                    onChange={e => setNewAddress({...newAddress, additionalInfo: e.target.value})}
                    placeholder="e.g. House No. B4, leave at reception"
                    rows={2}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Region</label>
                    <select 
                        className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.region}
                        onChange={e => setNewAddress({...newAddress, region: e.target.value, city: ''})} // Reset city on region change
                    >
                        {Object.keys(KENYA_REGIONS).map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <select 
                        className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        value={newAddress.city}
                        onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                        disabled={!newAddress.region}
                    >
                        <option value="">Please select</option>
                        {newAddress.region && KENYA_REGIONS[newAddress.region].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                 </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="defaultAddr"
                    checked={newAddress.isDefault}
                    onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="defaultAddr" className="text-sm font-medium cursor-pointer">Set as Default Address</label>
              </div>
              
              <Button onClick={handleAddAddress} className="w-full py-3 text-base">Save Address</Button>
          </div>
      </Modal>

      <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Payment Successful">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your order has been successfully placed. We will notify you once it ships.</p>
          <Button onClick={() => window.location.hash = '#/profile'}>
            View Order <ArrowRight size={16} className="ml-2 inline" />
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CartCheckout;