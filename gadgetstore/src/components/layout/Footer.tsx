import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("You're in! We'll send you the best deals.");
      setEmail('');
    }
  }, [email]);

  return (
    <footer className="border-t border-border bg-secondary/30 mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: About */}
          <div>
            <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
              TechVault
            </Link>
            <p className="text-muted-foreground text-xs mt-1 mb-3">Your Trusted Tech Partner Since 2013</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We are specialized in providing reliable and affordable computing devices, mobile gadgets, and accessories across Nigeria.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-xs tracking-widest uppercase">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Home</Link>
              <Link to="/products" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Shop</Link>
              <Link to="/wishlist" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Wishlist</Link>
              <Link to="/blog" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Blog</Link>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground text-sm transition-colors">My Account</Link>
              <Link to="/swap" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Swap & Trade</Link>
            </div>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-xs tracking-widest uppercase">Categories</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/products?category=laptops" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Laptops</Link>
              <Link to="/products?category=phones" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Phones</Link>
              <Link to="/products?category=tablets" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Tablets</Link>
              <Link to="/products?category=audio" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Audio</Link>
              <Link to="/products?category=watches" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Wearables</Link>
              <Link to="/products?category=accessories" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Accessories</Link>
            </div>
          </div>

          {/* Column 4: Newsletter & Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-xs tracking-widest uppercase">Follow Us</h4>
            <div className="flex items-center gap-3 mb-6">
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
            <p className="text-muted-foreground text-xs mb-3">Get every latest product update delivered to your inbox.</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" className="text-sm h-9 rounded-full border-border bg-background" />
              <Button type="submit" size="sm" className="h-9 rounded-full text-xs px-4 shrink-0">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground text-xs">
          <span>© {new Date().getFullYear()} TechVault. All rights reserved.</span>
          <span>Built with ❤️ in Nigeria</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
