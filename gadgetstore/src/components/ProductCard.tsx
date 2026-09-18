import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useCallback } from 'react';
import { formatPrice } from '@/lib/formatPrice';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number | null;
  is_on_sale?: boolean;
  is_featured?: boolean;
  rating?: number | null;
  rating_count?: number | null;
  image_url?: string;
  brand?: string | null;
  description?: string | null;
}

const ProductCard = ({ id, name, slug, price, sale_price, is_on_sale, is_featured, rating, rating_count, image_url, brand }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(id));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({ id, name, price, sale_price, image_url });
      toast.success(`${name} added to cart`);
    },
    [id, name, price, sale_price, image_url, addItem]
  );

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        toast.error('Sign in to save items');
        return;
      }
      toggleWishlist(id);
    },
    [id, user, toggleWishlist]
  );

  const discount = is_on_sale && sale_price ? Math.round((1 - Number(sale_price) / Number(price)) * 100) : 0;

  return (
    <Link to={`/products/${slug}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden card-hover flex flex-col h-full border border-border/50">
        {/* Image */}
        <div className="aspect-square bg-secondary/30 relative overflow-hidden">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-30" />
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            </div>
          )}
          <button onClick={handleWishlist} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all opacity-0 group-hover:opacity-100">
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {brand && <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide">{brand}</p>}
          <h3 className="font-medium text-foreground text-sm mb-1.5 line-clamp-2 leading-snug">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {rating && Number(rating) > 0 ? (
              <>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= Math.round(Number(rating)) ? 'text-warning fill-warning' : 'text-border'}`} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground ml-0.5">({rating_count})</span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">No reviews</span>
            )}
          </div>

          {/* Price + CTA - pushed to bottom */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              {is_on_sale && sale_price ? (
                <>
                  <span className="font-semibold text-foreground text-base">{formatPrice(Number(sale_price))}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(Number(price))}</span>
                </>
              ) : (
                <span className="font-semibold text-foreground text-base">{formatPrice(Number(price))}</span>
              )}
            </div>
            <Button size="sm" variant="outline" className="w-full h-9 text-xs rounded-full border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all" onClick={handleAdd}>
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
