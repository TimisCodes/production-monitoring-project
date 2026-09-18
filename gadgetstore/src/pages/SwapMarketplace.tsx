import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { fetchSwapListings } from '@/lib/swapQueries';
import SwapAIChat from '@/components/SwapAIChat';
import { formatPrice } from '@/lib/formatPrice';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, Plus, SlidersHorizontal, ArrowRightLeft, DollarSign } from 'lucide-react';

const CATEGORIES = ['phones', 'laptops', 'tablets', 'consoles', 'cameras', 'wearables', 'accessories'];
const CONDITIONS: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];
const SWAP_TYPES = [
  { value: 'swap_only', label: 'Swap Only' },
  { value: 'swap_and_cash', label: 'Swap + Cash' },
  { value: 'will_also_sell', label: 'Trade for Value' },
];

const conditionColors: Record<string, string> = {
  new: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  like_new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  good: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  fair: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const SwapMarketplace = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [swapType, setSwapType] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => ({
    category: category || undefined,
    condition: condition || undefined,
    swapType: swapType || undefined,
    minValue: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxValue: priceRange[1] < 2000000 ? priceRange[1] : undefined,
    search: search || undefined,
  }), [category, condition, swapType, priceRange, search]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['swapListings', filters],
    queryFn: () => fetchSwapListings(filters),
  });

  const sortedListings = useMemo(() => {
    if (!listings) return [];
    const sorted = [...listings];
    switch (sortBy) {
      case 'value-high': sorted.sort((a, b) => b.estimated_value - a.estimated_value); break;
      case 'value-low': sorted.sort((a, b) => a.estimated_value - b.estimated_value); break;
      default: break; // already sorted by newest from query
    }
    return sorted;
  }, [listings, sortBy]);

  const getListingImage = (listing: any) => {
    const imgs = listing.swap_listing_images;
    if (!imgs || imgs.length === 0) return '/placeholder.svg';
    const primary = imgs.find((i: any) => i.is_primary);
    return primary?.url || imgs[0]?.url || '/placeholder.svg';
  };

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ArrowRightLeft className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Swap & Trade</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Trade your gadgets. Get what you need.
          </p>
          <div className="flex items-center justify-center gap-3">
            {user ? (
              <>
                <Link to="/swap/list">
                  <Button size="lg" className="rounded-full gap-2">
                    <Plus className="h-4 w-4" /> List a Gadget
                  </Button>
                </Link>
                <Link to="/swap/dashboard">
                  <Button size="lg" variant="outline" className="rounded-full">My Dashboard</Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="rounded-full">Sign In to Start Swapping</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Sort Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by device name, brand, or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="value-high">Value: High to Low</SelectItem>
              <SelectItem value="value-low">Value: Low to High</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-full md:hidden gap-2" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className={`lg:col-span-1 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground text-sm">Filters</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setCategory(''); setCondition(''); setSwapType(''); setPriceRange([0, 2000000]); }}>
                  Clear
                </Button>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
                  <SelectTrigger className="mt-1.5 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Condition</Label>
                <Select value={condition || 'all'} onValueChange={(v) => setCondition(v === 'all' ? '' : v)}>
                  <SelectTrigger className="mt-1.5 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Swap Type</Label>
                <Select value={swapType || 'all'} onValueChange={(v) => setSwapType(v === 'all' ? '' : v)}>
                  <SelectTrigger className="mt-1.5 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {SWAP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Value Range</Label>
                <div className="mt-3 px-1">
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    min={0}
                    max={2000000}
                    step={10000}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listing Grid */}
          <div className="lg:col-span-3">
            <p className="text-sm text-muted-foreground mb-4">{sortedListings.length} listings</p>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/50 animate-pulse">
                    <div className="aspect-square bg-secondary/50 rounded-t-2xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedListings.length === 0 ? (
              <div className="text-center py-20">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No swap listings found.</p>
                {user && (
                  <Link to="/swap/list">
                    <Button className="mt-4 rounded-full gap-2"><Plus className="h-4 w-4" /> Be the first to list</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedListings.map((listing) => (
                  <Link key={listing.id} to={`/swap/${listing.id}`} className="group">
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                      <div className="aspect-square overflow-hidden bg-secondary/20">
                        <img
                          src={getListingImage(listing)}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{listing.title}</h3>
                          <Badge variant="secondary" className={`text-[10px] shrink-0 ${conditionColors[listing.condition]}`}>
                            {CONDITIONS.find(c => c.value === listing.condition)?.label}
                          </Badge>
                        </div>
                        {listing.brand && <p className="text-xs text-muted-foreground">{listing.brand} {listing.model}</p>}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{formatPrice(listing.estimated_value)}</span>
                          {listing.open_to_cash_topup && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <DollarSign className="h-3 w-3" /> Cash OK
                            </Badge>
                          )}
                        </div>
                        {listing.location_city && (
                          <p className="text-[11px] text-muted-foreground">📍 {listing.location_city}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SwapAIChat />
    </Layout>
  );
};

export default SwapMarketplace;
