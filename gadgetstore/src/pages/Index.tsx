import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, Headphones, BadgePercent, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { fetchProducts } from '@/lib/queries';

import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import catLaptop from '@/assets/cat-laptop.jpg';
import catPhone from '@/assets/cat-phone.jpg';
import catTablet from '@/assets/cat-tablet.jpg';
import catAudio from '@/assets/cat-audio.jpg';
import catAccessories from '@/assets/cat-accessories.jpg';
import catWatch from '@/assets/cat-watch.jpg';
import catPrinter from '@/assets/cat-printer.jpg';
import catGaming from '@/assets/cat-gaming.jpg';
import promoWatch from '@/assets/promo-watch.jpg';
import promoHeadphones from '@/assets/promo-headphones.jpg';
import promoAudio from '@/assets/promo-audio.jpg';
import promoIphones from '@/assets/promo-iphones.jpg';

const heroSlides = [
  { headline: "Biggest Sale Ever — Don't Miss It", sub: 'Premium tech at unbeatable prices. Shop laptops, phones & more.', cta: 'Go to Store', link: '/products', img: hero1 },
  { headline: 'New Gaming Laptops Just Arrived', sub: 'ASUS ROG, HP Victus, Lenovo Legion — power up your gaming.', cta: 'Shop Gaming', link: '/products?category=laptops', img: hero2 },
  { headline: 'Latest iPhones in Stock', sub: 'iPhone 15 Pro Max & more. Original, sealed, with warranty.', cta: 'Shop iPhones', link: '/products?category=phones&brand=Apple', img: hero3 },
];

const trustIcons = [
  { icon: Truck, label: 'Delivery on All Orders' },
  { icon: Headphones, label: '24/7 Online Support' },
  { icon: BadgePercent, label: 'Big Weekend Savings' },
];

const shopByCategory = [
  { label: 'Laptop Shop', slug: 'laptops', img: catLaptop },
  { label: 'Apple iPhones', slug: 'phones&brand=Apple', img: catPhone },
  { label: 'Every Tablet', slug: 'tablets', img: catTablet },
  { label: 'Audio & Speakers', slug: 'audio', img: catAudio },
  { label: 'Mouse & Keyboard', slug: 'accessories', img: catAccessories },
  { label: 'Smart Wristwatch', slug: 'watches', img: catWatch },
  { label: 'Gaming Laptops', slug: 'laptops&brand=Gaming', img: catGaming },
  { label: 'Printers', slug: 'accessories', img: catPrinter },
];

const promoBanners = [
  { title: 'Health & Fit', sub: 'Smart Wristwatch', link: '/products?category=watches', img: promoWatch },
  { title: 'High Tech Product', sub: 'Monster Beats Headphones', link: '/products?category=audio', img: promoHeadphones },
  { title: 'Minimalism Design', sub: 'Music Makes Feel Better', link: '/products?category=audio', img: promoAudio },
  { title: 'Apple Devices', sub: 'Shop All Series of iPhones', link: '/products?category=phones&brand=Apple', img: promoIphones },
];

const testimonials = [
  { quote: "Got my first laptop from TechVault and they were really patient with me making my decision. Great service!", name: 'Emeka Chuks', role: 'Civil Servant', initials: 'EC' },
  { quote: "Very neat iPhones, with multiple options to select. Trustworthy and reliable.", name: 'Obicool Daniel', role: 'Merchant', initials: 'OD' },
  { quote: "I bought couples of stuffs for my office use and they all working very well till date. Highly recommended!", name: 'Rebecca Adeyemo', role: 'Customer', initials: 'RA' },
];

const brandLogos = ['Samsung', 'Windows', 'Dell', 'MSI', 'Apple', 'HP', 'Lenovo', 'ASUS', 'JBL'];

const Index = () => {
  const { data: allProducts } = useQuery({ queryKey: ['products', 'all-home'], queryFn: () => fetchProducts({}) });

  const getProductImage = (product: any) => {
    const images = product.product_images;
    if (!images || images.length === 0) return undefined;
    const primary = images.find((i: any) => i.is_primary);
    return primary?.url || images[0]?.url;
  };

  const featuredProducts = allProducts?.filter((p) => p.is_featured).slice(0, 8) || [];
  const saleProducts = allProducts?.filter((p) => p.is_on_sale).slice(0, 18) || [];
  const laptopTablets = allProducts?.filter((p) => {
    const cat = (p as any).categories;
    return cat?.slug === 'laptops' || cat?.slug === 'tablets';
  }).slice(0, 4) || [];
  const allDisplay = allProducts?.slice(0, 16) || [];

  return (
    <Layout>
      <HeroBanner />

      {/* Trust Icons */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {trustIcons.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shopByCategory.map((cat) => (
            <Link
              key={cat.label}
              to={`/products?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden">
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm">{cat.label}</h3>
                <span className="text-white/80 text-xs flex items-center gap-1 mt-1">Shop <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground text-sm mt-1">Handpicked for you</p>
            </div>
            <Link to="/products?featured=true" className="text-primary text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                sale_price={p.sale_price} is_on_sale={p.is_on_sale} is_featured={p.is_featured}
                rating={p.rating} rating_count={p.rating_count} brand={p.brand}
                image_url={getProductImage(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Promo Banners Row 1 */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promoBanners.slice(0, 2).map((b) => (
            <Link key={b.title} to={b.link} className="relative rounded-2xl overflow-hidden group h-56 md:h-64">
              <img src={b.img} alt={b.sub} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{b.title}</p>
                <h3 className="text-white text-xl font-bold mt-1 mb-3">{b.sub}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-white border border-white/40 rounded-full px-4 py-1.5 w-fit group-hover:bg-white group-hover:text-foreground transition-all">
                  Shop Now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Laptops & Tablets / All Products */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Laptops & Tablets</h2>
            <p className="text-muted-foreground text-sm mt-1">Browse our collection</p>
          </div>
          <Link to="/products?category=laptops" className="text-primary text-sm hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(laptopTablets.length > 0 ? laptopTablets : allDisplay.slice(0, 4)).map((p) => (
            <ProductCard
              key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
              sale_price={p.sale_price} is_on_sale={p.is_on_sale}
              rating={p.rating} rating_count={p.rating_count} brand={p.brand}
              image_url={getProductImage(p)}
            />
          ))}
        </div>
      </section>

      {/* Featured Offers */}
      {saleProducts.length > 0 && (
        <section className="bg-secondary/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Our Featured Offers</h2>
                <p className="text-muted-foreground text-sm mt-1">Limited time deals</p>
              </div>
              <Link to="/products?sale=true" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {saleProducts.map((p) => (
                <ProductCard
                  key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                  sale_price={p.sale_price} is_on_sale={p.is_on_sale}
                  rating={p.rating} rating_count={p.rating_count} brand={p.brand}
                  image_url={getProductImage(p)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Banners Row 2 */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promoBanners.slice(2, 4).map((b) => (
            <Link key={b.title} to={b.link} className="relative rounded-2xl overflow-hidden group h-56 md:h-64">
              <img src={b.img} alt={b.sub} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{b.title}</p>
                <h3 className="text-white text-xl font-bold mt-1 mb-3">{b.sub}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-white border border-white/40 rounded-full px-4 py-1.5 w-fit group-hover:bg-white group-hover:text-foreground transition-all">
                  Shop Now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Products grid */}
      {allDisplay.length > 4 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground text-sm mt-1">Top picks across all categories</p>
            </div>
            <Link to="/products" className="text-primary text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {allDisplay.slice(4, 12).map((p) => (
              <ProductCard
                key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price}
                sale_price={p.sale_price} is_on_sale={p.is_on_sale}
                rating={p.rating} rating_count={p.rating_count} brand={p.brand}
                image_url={getProductImage(p)}
              />
            ))}
          </div>
        </section>
      )}

      <TestimonialsSection />

      {/* Brand Logos */}
      <section className="container mx-auto px-4 py-10 border-t border-border/50">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {brandLogos.map((brand) => (
            <span key={brand} className="text-lg font-bold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-default select-none">
              {brand}
            </span>
          ))}
        </div>
      </section>
    </Layout>
  );
};

/* ── Hero Banner ─────────────── */

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % heroSlides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[340px] sm:h-[420px] md:h-[480px]">
        {heroSlides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            <img src={s.img} alt={s.headline} className="w-full h-full object-cover" width={1920} height={800} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-lg">
              <h1 key={current} className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 leading-tight tracking-tight animate-fade-in">
                {slide.headline}
              </h1>
              <p className="text-white/80 text-sm md:text-base mb-6 max-w-md leading-relaxed">
                {slide.sub}
              </p>
              <Link to={slide.link}>
                <Button size="lg" className="rounded-full px-8 text-sm font-semibold">
                  {slide.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        <button onClick={() => setCurrent((p) => (p - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setCurrent((p) => (p + 1) % heroSlides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
};

/* ── Testimonials ─────────────── */

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-secondary/20 py-14">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight text-center mb-10">What Our Customers Say</h2>
        <div className="max-w-2xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className={`transition-all duration-500 ${i === current ? 'block' : 'hidden'}`}>
              <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
                <div className="flex items-center justify-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground text-base leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Index;
