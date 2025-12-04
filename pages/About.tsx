import React from 'react';
import { ShieldCheck, Truck, Users, Award } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">About Digiflow Store</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          We are Kenya's premier destination for cutting-edge technology and modern lifestyle accessories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <img 
            src="https://picsum.photos/800/600?random=100" 
            alt="About Us" 
            className="rounded-2xl shadow-xl w-full object-cover h-[400px]"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            At Digiflow, we believe that technology should enhance your life, not complicate it. 
            Founded in Nairobi, our mission is to provide high-quality, authentic gadgets and accessories 
            at accessible prices. We bridge the gap between global tech trends and the local market.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary-600" size={24} />
              <span className="font-medium">100% Authentic Products</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="text-primary-600" size={24} />
              <span className="font-medium">Fast Countrywide Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="text-primary-600" size={24} />
              <span className="font-medium">Customer-First Approach</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>
            <h3 className="font-bold text-xl mb-2">Quality Assured</h3>
            <p className="text-gray-500">Every product is tested and verified before it reaches your hands.</p>
          </div>
          <div className="p-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="font-bold text-xl mb-2">Secure Payments</h3>
            <p className="text-gray-500">Seamless integration with M-Pesa and Cards for safe transactions.</p>
          </div>
          <div className="p-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="font-bold text-xl mb-2">Expert Support</h3>
            <p className="text-gray-500">Our tech-savvy team is always ready to help you make the right choice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
