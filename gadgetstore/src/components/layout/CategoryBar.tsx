import { Link } from 'react-router-dom';
import { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { label: 'Laptops', slug: 'laptops' },
  { label: 'Mobile & Tablets', slug: 'phones' },
  { label: 'Computer Accessories', slug: 'accessories' },
  { label: 'Gaming Laptops', slug: 'laptops&brand=Gaming' },
  { label: 'Audio', slug: 'audio' },
  { label: 'Phone Accessories', slug: 'accessories' },
  { label: 'iPhones', slug: 'phones&brand=Apple' },
  { label: 'Samsung Phones', slug: 'phones&brand=Samsung' },
  { label: 'Bluetooth Speakers', slug: 'audio' },
  { label: 'Wearables', slug: 'watches' },
  { label: 'Apple', slug: 'phones&brand=Apple' },
  { label: 'Printers', slug: 'accessories' },
  { label: 'Tablets', slug: 'tablets' },
];

const CategoryBar = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  return (
    <div className="relative border-b border-border/50 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative">
          {canScrollLeft && (
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={`/products?category=${cat.slug}`}
                className="shrink-0 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors whitespace-nowrap"
              >
                {cat.label}
              </Link>
            ))}
          </div>
          {canScrollRight && (
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
