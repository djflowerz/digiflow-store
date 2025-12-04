import React from 'react';
import { Shield, Lock, Eye, Database } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last Updated: {new Date().getFullYear()}</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="text-primary-600" /> 1. Data Protection
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            At Digiflow Store, we take your security seriously. All personal data, including names, 
            phone numbers, and shipping addresses, is encrypted and stored securely using 
            Supabase's enterprise-grade database infrastructure. We do not sell your data to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="text-primary-600" /> 2. Payment Security
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We integrate directly with M-Pesa Daraja API for payments. When you transact:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Your PIN is never visible to us. It is entered securely on your device.</li>
            <li>We do not store your M-Pesa PIN or banking credentials.</li>
            <li>All transaction requests are processed via encrypted HTTPS channels.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eye className="text-primary-600" /> 3. Data Collection
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">We collect the following to fulfill your orders:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
             <li><strong>Account Info:</strong> Email address and password (hashed).</li>
             <li><strong>Shipping Info:</strong> Name, Phone Number, and Delivery Address.</li>
             <li><strong>Usage Data:</strong> Order history and Wishlist items to improve recommendations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="text-primary-600" /> 4. Your Rights
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
             You have the right to access, update, or delete your personal data at any time. 
             You can manage your profile directly from the User Dashboard. If you wish to delete 
             your account permanently, please contact support.
          </p>
        </section>

        <div className="border-t dark:border-gray-700 pt-6 mt-8">
          <p className="text-sm text-gray-500 text-center">
            For security inquiries, contact us at <a href="mailto:security@digiflow.store" className="text-primary-600 hover:underline">security@digiflow.store</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;