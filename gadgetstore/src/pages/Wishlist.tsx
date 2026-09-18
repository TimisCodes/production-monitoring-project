import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const fetchWishlistProducts = async (productIds: string[]) => {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(url, is_primary, sort_order)')
    .in('id', productIds);
  if (error) throw error;
  return data;
};

const Wishlist = () => {
  const { user } = useAuthStore();
  const { items } = useWishlistStore();

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist-products', items],
    queryFn: () => fetchWishlistProducts(items),
    enabled: items.length > 0,
  });

  const getProductImage = (product: any) => {
    const images = product.product_images;
    if (!images || images.length === 0) return undefined;
    const primary = images.find((i: any) => i.is_primary);
    return primary?.url || images[0]?.url;
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Sign in to save your favourite gadgets.</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Wishlist</h1>
        <p className="text-muted-foreground text-sm mb-8">{items.length} saved items</p>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No saved items yet.</p>
            <Link to="/products"><Button>Browse Products</Button></Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: items.length }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border animate-pulse">
                <div className="aspect-[3/4] bg-secondary/50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products?.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.price}
                sale_price={p.sale_price}
                is_on_sale={p.is_on_sale}
                is_featured={p.is_featured}
                rating={p.rating}
                rating_count={p.rating_count}
                brand={p.brand}
                image_url={getProductImage(p)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
