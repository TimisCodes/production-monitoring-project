import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X, Heart, ArrowRightLeft, Package, Smartphone } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';
import CartDrawer from '@/components/CartDrawer';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, is_on_sale')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(6);
      setSearchResults(data || []);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setShowResults(false);
        setSearchQuery('');
      }
    },
    [searchQuery, navigate]
  );

  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);

  return (
    <nav className={`sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-12' : 'h-14'}`}>
          {/* Logo */}
          <Link to="/" className="flex flex-col shrink-0">
            <span className="text-lg font-bold tracking-tight text-foreground">TechVault</span>
            <span className="text-[9px] text-muted-foreground -mt-1 hidden sm:block">Your Trusted Tech Partner Since 2013</span>
          </Link>

          {/* Desktop search */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search laptops, phones, accessories..."
                  className="pl-9 h-9 text-sm rounded-full bg-secondary border-0 focus-visible:ring-1"
                />
              </div>
            </form>
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    onClick={() => { setShowResults(false); setSearchQuery(''); }}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate">{p.name}</span>
                    <span className="text-xs font-semibold text-primary shrink-0 ml-2">
                      ₦{(p.is_on_sale && p.sale_price ? p.sale_price : p.price).toLocaleString('en-NG')}
                    </span>
                  </Link>
                ))}
                <button
                  onClick={() => { navigate(`/products?search=${encodeURIComponent(searchQuery)}`); setShowResults(false); setSearchQuery(''); }}
                  className="w-full text-center text-xs text-primary py-2 hover:bg-secondary/30 border-t border-border"
                >
                  View all results →
                </button>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-semibold">{wishlistCount}</span>
                )}
              </Button>
            </Link>

            <CartDrawer />

            {user ? (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/sell">
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
                    <Smartphone className="h-3.5 w-3.5" /> Sell Device
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Package className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground text-[11px] h-8">Sign Out</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/sell">
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
                    <Smartphone className="h-3.5 w-3.5" /> Sell Device
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="text-[11px] h-8 rounded-full px-4">Sign In</Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground" onClick={toggleMobile}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-9 h-9 text-sm rounded-full bg-secondary border-0"
              />
            </div>
          </form>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border/50 pt-3 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link to="/products" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">Store</Link>
              <Link to="/products?sale=true" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">Deals</Link>
              <Link to="/blog" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">Blog</Link>
              <Link to="/swap" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5" /> Swap & Trade</Link>
              <Link to="/sell" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Sell My Device</Link>
              <Link to="/wishlist" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">Wishlist</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">Profile</Link>
                  <Link to="/orders" onClick={toggleMobile} className="text-muted-foreground hover:text-foreground text-sm">My Orders</Link>
                  <button onClick={() => { signOut(); toggleMobile(); }} className="text-left text-muted-foreground hover:text-foreground text-sm">Sign Out</button>
                </>
              ) : (
                <Link to="/auth" onClick={toggleMobile} className="text-primary text-sm font-medium">Sign In</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
