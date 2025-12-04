import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, Shield, Share2, Heart, MessageSquare, Sparkles, CheckCircle } from 'lucide-react';
import { useData, useCart, useAuth } from '../services/store';
import { Button, StarRating, ImageMagnifier, Skeleton } from '../components/UI';
import { summarizeReviews } from '../services/geminiService';
import { Review } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, toggleWishlist, addReview } = useData();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Scroll to top when product ID changes (Related Items click)
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImg(0);
    setAiSummary(null);
    setImageLoaded(false);
  }, [id]);

  const product = products.find(p => p.id === id);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  if (!product) {
    return <div className="p-20 text-center">Product not found</div>;
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to review');
    
    const newReview: Review = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.fullName,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: new Date().toISOString()
    };
    
    addReview(product.id, newReview);
    setReviewForm({ rating: 5, comment: '' });
  };

  const handleSummarizeReviews = async () => {
    setIsSummarizing(true);
    const summary = await summarizeReviews(product.reviews, product.name);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const stockPercentage = Math.min(100, (product.stock / 50) * 100);
  const stockColor = product.stock < 10 ? 'bg-red-500' : product.stock < 25 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center border dark:border-gray-700 relative">
             {/* Loading Skeleton */}
             {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
             
             {/* Hidden image to track loading */}
             <img 
               src={product.images[activeImg]} 
               onLoad={() => setImageLoaded(true)}
               className="hidden" 
               alt=""
             />

             {/* Magnifier Component (only show when loaded) */}
             {imageLoaded && (
               <ImageMagnifier src={product.images[activeImg]} alt={product.name} />
             )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setActiveImg(idx);
                  setImageLoaded(false); // Reset loading for main image switch
                }}
                className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-white dark:bg-gray-800 transition-all ${
                  activeImg === idx ? 'border-primary-600 scale-95 ring-2 ring-primary-100' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={img} className="w-full h-full object-contain" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                 <StarRating rating={product.rating} />
                 <span className="text-gray-900 dark:text-white font-medium">({product.reviews.length} reviews)</span>
              </div>
              <span>|</span>
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="text-4xl font-bold text-primary-600 mb-6">
            KES {product.price.toLocaleString()}
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
               <span>Availability</span>
               <span className={product.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                 {product.stock} items left
               </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${stockColor}`} style={{ width: `${stockPercentage}%` }}></div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="flex gap-4 mb-8">
            <Button size="lg" className="flex-1" onClick={() => addToCart(product)} disabled={product.stock === 0}>
               {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => toggleWishlist(product.id)} 
              className={user?.wishlist?.includes(product.id) ? 'text-red-500 border-red-200 bg-red-50' : ''}
              title="Add to Wishlist"
            >
              <Heart size={20} fill={user?.wishlist?.includes(product.id) ? "currentColor" : "none"} />
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="lg" onClick={handleShare} title="Share Product">
                <Share2 size={20} />
              </Button>
              {showShareTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap">
                  Link Copied!
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-6">
             <div className="flex items-center gap-3">
               <Truck className="text-gray-400" />
               <span className="text-sm">Fast delivery available</span>
             </div>
             <div className="flex items-center gap-3">
               <Shield className="text-gray-400" />
               <span className="text-sm">1 Year Warranty</span>
             </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-6 md:p-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <MessageSquare className="text-primary-600" /> Customer Reviews
           </h2>
           {product.reviews.length > 0 && (
             <Button variant="secondary" size="sm" onClick={handleSummarizeReviews} isLoading={isSummarizing}>
               <Sparkles size={16} className="mr-2 text-purple-600" /> 
               Summarize with AI
             </Button>
           )}
        </div>

        {aiSummary && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Sparkles size={16} /> AI Summary
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 italic">"{aiSummary}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {product.reviews.length === 0 ? (
              <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
            ) : (
              product.reviews.map(review => (
                <div key={review.id} className="border-b dark:border-gray-700 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold block">{review.userName}</span>
                      <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Write Review */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl h-fit">
            <h3 className="font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Rating</label>
                <StarRating 
                  rating={reviewForm.rating} 
                  editable 
                  onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} 
                  size={24}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea 
                  className="w-full p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">Submit Review</Button>
            </form>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(rp => (
              <Link key={rp.id} to={`/product/${rp.id}`} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700 hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 dark:bg-gray-700 p-4 flex items-center justify-center">
                  <img src={rp.images[0]} alt={rp.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 truncate">{rp.name}</h3>
                  <p className="font-bold text-primary-600">KES {rp.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;