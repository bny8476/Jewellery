import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';

export interface CustomerWishlistTabProps {
  wishlist: string[];
  wishlistProducts: any[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (id: string, weight?: number, purity?: any, image?: string, name?: string) => void;
  formatCurrencyINR: (amt: number) => string;
}

export const CustomerWishlistTab: React.FC<CustomerWishlistTabProps> = ({
  wishlist,
  wishlistProducts,
  onToggleWishlist,
  onAddToCart,
  formatCurrencyINR
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D]">
            Saved Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-[#8792A2] mt-0.5">
            Your saved jewellery pieces and bridal selections
          </p>
        </div>
        <Link to="/jewellery" className="text-xs text-[#25282D] font-semibold hover:underline">
          + Explore More Pieces
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-4 p-8">
          <div className="w-14 h-14 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#8792A2] mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-inter text-lg font-bold text-[#25282D]">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-[#8792A2] max-w-sm mx-auto mt-1 leading-relaxed">
              Save bridal chokers, certified solitaire rings, and temple jewellery to compare and review anytime.
            </p>
          </div>
          <Link
            to="/jewellery"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Boutique</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlistProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#25282D] transition-all flex flex-col group shadow-xs"
            >
              <div className="relative aspect-[3/4] bg-[#F3F4F6] overflow-hidden">
                <img
                  src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-white transition-colors cursor-pointer shadow-xs"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#8792A2] tracking-wider">
                    {product.category} • {product.purity}
                  </span>
                  <h4 className="font-inter text-sm font-semibold text-[#25282D] line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <p className="text-sm font-bold text-[#25282D] font-mono mt-1">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-center text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors"
                  >
                    View Piece
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, product.weight, null, product.image_url || undefined, product.name)}
                    className="flex-1 py-2 rounded-lg bg-[#25282D] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerWishlistTab;
