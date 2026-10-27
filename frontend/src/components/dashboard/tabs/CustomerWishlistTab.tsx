import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';

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
      <div className="flex justify-between items-baseline pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            My Curated Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your privately saved jewellery pieces and bridal trousseau selections
          </p>
        </div>
        <Link to="/jewellery" className="text-xs text-[var(--gold-primary)] font-bold hover:underline">
          + Add More Pieces
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-main)]">
              Your Private Curation is Empty
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed">
              Save bridal chokers, certified solitaire rings, and antique temple harams to review and compare at your leisure.
            </p>
          </div>
          <Link
            to="/jewellery"
            className="inline-block px-6 py-2.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 shadow-sm"
          >
            Explore Jewellery Boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlistProducts.map(product => (
            <div
              key={product.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:border-[var(--gold-primary)]/50 transition-all flex flex-col group shadow-xs"
            >
              <div className="relative aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden">
                <img
                  src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-rose-500 hover:bg-black/80 transition-colors cursor-pointer"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[var(--gold-primary)] tracking-wider">
                    {product.category} • {product.purity}
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-[var(--text-main)] line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <p className="text-sm font-bold text-gold-gradient mt-1">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-center text-[var(--text-main)] hover:border-[var(--gold-primary)]"
                  >
                    View Piece
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, product.weight, null, product.image_url || undefined, product.name)}
                    className="flex-1 py-2 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 cursor-pointer"
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
