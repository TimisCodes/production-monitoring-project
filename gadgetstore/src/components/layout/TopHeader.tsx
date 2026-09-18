import { Mail, Phone } from 'lucide-react';

const TopHeader = () => (
  <div className="bg-foreground text-background text-[11px] py-1.5 hidden md:block">
    <div className="container mx-auto px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <a href="mailto:info@techvault.ng" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Mail className="h-3 w-3" /> info@techvault.ng
        </a>
        <a href="tel:+2348012345678" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Phone className="h-3 w-3" /> +234 801 234 5678
        </a>
        <a href="tel:+2349098765432" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Phone className="h-3 w-3" /> +234 909 876 5432
        </a>
      </div>
      <div className="text-background/70">
        🚚 Free delivery on orders above ₦50,000 &nbsp;·&nbsp; 📦 Same-day delivery in Lagos
      </div>
    </div>
  </div>
);

export default TopHeader;
