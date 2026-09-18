import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { fetchProducts, fetchCategories } from '@/lib/queries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const PRODUCTS_PER_PAGE = 12;

const Products = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const isFeatured = searchParams.get('featured') === 'true';
  const isSale = searchParams.get('sale') === 'true';

  const [priceRange, setPriceRange] = useState<[string, string]>(['', '']);
  const [brandFilter, setBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    featured: isFeatured || undefined,
    onSale: isSale || undefined,
    minPrice: priceRange[0] ? Number(priceRange[0]) : undefined,
    maxPrice: priceRange[1] ? Number(priceRange[1]) : undefined,
  }), [searchQuery, isFeatured, isSale, priceRange]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];
    if (categorySlug) result = result.filter((p: any) => p.categories?.slug === categorySlug);
    if (brandFilter) result = result.filter((p) => p.brand === brandFilter);
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    return result;
  }, [products, categorySlug, brandFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useMemo(() => { setCurrentPage(1); }, [categorySlug, searchQuery, isFeatured, isSale, brandFilter, sortBy, priceRange]);

  const brands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))];
  }, [products]);

  const getProductImage = (product: any) => {
    const images = product.product_images;
    if (!images || images.length === 0) return undefined;
    const primary = images.find((i: any) => i.is_primary);
    return primary?.url || images[0]?.url;
  };

  const pageTitle = isFeatured ? 'Best Sellers' : isSale ? 'Deals' : searchQuery ? `"${searchQuery}"` : categorySlug ? categories?.find(c => c.slug === categorySlug)?.name || 'Products' : 'All Products';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredProducts.length} products</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters sidebar */}
          <div className="lg:col-span-1 space-y-5">
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-5">
              <h3 className="font-medium text-foreground text-sm">Filters</h3>

              {categories && categories.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={categorySlug || 'all'} onValueChange={(v) => {
                    const url = new URL(window.location.href);
                    if (v === 'all') url.searchParams.delete('category');
                    else url.searchParams.set('category', v);
                    window.history.pushState({}, '', url.toString());
                    window.location.reload();
                  }}>
                    <SelectTrigger className="mt-1.5 bg-background border-border rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {brands.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <Select value={brandFilter || 'all'} onValueChange={(v) => setBrandFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="mt-1.5 bg-background border-border rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map((b) => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Price Range (₦)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input placeholder="Min" type="number" value={priceRange[0]} onChange={(e) => setPriceRange([e.target.value, priceRange[1]])} className="bg-background border-border rounded-lg" />
                  <Input placeholder="Max" type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], e.target.value])} className="bg-background border-border rounded-lg" />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1.5 bg-background border-border rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/50 animate-pulse">
                    <div className="aspect-square bg-secondary/50 rounded-t-2xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                      <div className="h-8 bg-secondary rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-sm">No products found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {paginatedProducts.map((p) => (
                    <ProductCard
                      key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                      sale_price={p.sale_price} is_on_sale={p.is_on_sale}
                      rating={p.rating} rating_count={p.rating_count} brand={p.brand}
                      image_url={getProductImage(p)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full text-xs h-8 w-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
