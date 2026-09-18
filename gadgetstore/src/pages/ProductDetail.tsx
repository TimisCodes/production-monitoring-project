import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import ProductReviews from '@/components/ProductReviews';
import { fetchProductBySlug } from '@/lib/queries';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Minus, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatPrice';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
  });

  // Fetch variants
  const { data: variants } = useQuery({
    queryKey: ['product-variants', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product!.id)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
  });

  const colorVariants = useMemo(() => variants?.filter(v => v.variant_type === 'color') || [], [variants]);
  const storageVariants = useMemo(() => variants?.filter(v => v.variant_type === 'storage') || [], [variants]);

  const priceModifier = useMemo(() => {
    let mod = 0;
    if (selectedColor) {
      const cv = colorVariants.find(v => v.id === selectedColor);
      if (cv) mod += Number(cv.price_modifier);
    }
    if (selectedStorage) {
      const sv = storageVariants.find(v => v.id === selectedStorage);
      if (sv) mod += Number(sv.price_modifier);
    }
    return mod;
  }, [selectedColor, selectedStorage, colorVariants, storageVariants]);

  // Fetch reviews for aggregate rating
  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
  });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : product?.rating ? Number(product.rating) : 0;
  const reviewCount = reviews?.length || product?.rating_count || 0;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const images = product.product_images || [];
    const primaryImg = images.find((i: any) => i.is_primary) || images[0];
    const finalPrice = (product.is_on_sale && product.sale_price ? Number(product.sale_price) : Number(product.price)) + priceModifier;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: finalPrice,
        sale_price: null,
        image_url: primaryImg?.url,
      });
    }
    toast.success(`Added ${quantity}× ${product.name} to cart`);
  }, [product, quantity, addItem, priceModifier]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-secondary rounded-3xl" />
            <div className="space-y-4 pt-4">
              <div className="h-4 bg-secondary rounded w-1/4" />
              <div className="h-8 bg-secondary rounded w-3/4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-10 bg-secondary rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </Layout>
    );
  }

  const images = product.product_images || [];
  const sortedImages = [...images].sort((a: any, b: any) => a.sort_order - b.sort_order);
  const currentImage = sortedImages[selectedImage]?.url;
  const specs = product.specs as Record<string, string> | null;
  const basePrice = product.is_on_sale && product.sale_price ? Number(product.sale_price) : Number(product.price);
  const displayPrice = basePrice + priceModifier;

  const colorMap: Record<string, string> = {
    'Space Black': '#1d1d1f',
    'Silver': '#e3e4e5',
    'Midnight': '#2d3142',
    'Starlight': '#f0e6d3',
    'Blue': '#a1b9ce',
    'Purple': '#c5b4cc',
    'Red': '#c12e2e',
    'Green': '#4a6741',
    'Gold': '#dfc8a2',
    'Pink': '#f2c4ce',
    'White': '#ffffff',
    'Black': '#1d1d1f',
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-secondary/20 rounded-3xl overflow-hidden mb-4">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 opacity-20" />
                </div>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedImages.map((img: any, idx: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-16 w-16 rounded-xl shrink-0 overflow-hidden border-2 transition-all ${idx === selectedImage ? 'border-primary' : 'border-transparent hover:border-border'}`}
                  >
                    <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="pt-2">
            {product.brand && <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{product.brand}</p>}
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 tracking-tight leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-warning fill-warning' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {avgRating > 0 ? `${avgRating.toFixed(1)} (${reviewCount} reviews)` : 'No reviews yet'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-semibold text-foreground">{formatPrice(displayPrice)}</span>
              {product.is_on_sale && product.sale_price && priceModifier === 0 && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(product.price))}</span>
              )}
            </div>

            {/* Color Variants */}
            {colorVariants.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2.5">Color — {colorVariants.find(v => v.id === selectedColor)?.label || 'Select'}</p>
                <div className="flex gap-2.5">
                  {colorVariants.map((v) => {
                    const hex = colorMap[v.label] || v.value || '#888';
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedColor(v.id === selectedColor ? null : v.id)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${v.id === selectedColor ? 'border-primary scale-110' : 'border-border hover:border-muted-foreground'}`}
                        style={{ backgroundColor: hex }}
                        title={v.label}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Variants */}
            {storageVariants.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2.5">Storage</p>
                <div className="flex flex-wrap gap-2">
                  {storageVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedStorage(v.id === selectedStorage ? null : v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        v.id === selectedStorage
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {v.label}
                      {Number(v.price_modifier) > 0 && (
                        <span className="text-xs ml-1 opacity-70">+{formatPrice(Number(v.price_modifier))}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {product.stock > 0 ? (
                <><Check className="h-4 w-4 text-success" /><span className="text-sm text-success">In Stock</span></>
              ) : (
                <><X className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive">Out of Stock</span></>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-border rounded-full">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button onClick={handleAddToCart} disabled={product.stock <= 0} className="flex-1 rounded-full text-sm font-medium" size="lg">
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart — {formatPrice(displayPrice * quantity)}
              </Button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h3 className="font-medium text-foreground mb-2 text-sm">About this product</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Specs */}
            {specs && Object.keys(specs).length > 0 && (
              <div>
                <h3 className="font-medium text-foreground mb-3 text-sm">Specifications</h3>
                <div className="rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground text-sm">{key}</span>
                      <span className="text-foreground text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews productId={product.id} />
      </div>
    </Layout>
  );
};

export default ProductDetail;
