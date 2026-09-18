
-- Add category_tag and read_time_minutes to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS category_tag text DEFAULT NULL;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS read_time_minutes integer DEFAULT 5;

-- Add 'Laptops' category
INSERT INTO public.categories (name, slug, description) VALUES ('Laptops', 'laptops', 'Laptops and notebooks for work and play') ON CONFLICT (slug) DO NOTHING;

-- Rename 'Audio' to 'Audio & Earbuds'
UPDATE public.categories SET name = 'Audio & Earbuds' WHERE slug = 'audio';

-- Convert existing USD product prices to Naira (approx 1 USD = 1,500 NGN using realistic Nigerian market prices)
UPDATE public.products SET price = 1799000, sale_price = NULL WHERE slug = 'iphone-17-pro-max';
UPDATE public.products SET price = 1499000 WHERE slug = 'iphone-15-pro';
UPDATE public.products SET price = 749000, sale_price = 499000, is_on_sale = true WHERE slug = 'iphone-11';
UPDATE public.products SET price = 1949000 WHERE slug = 'samsung-galaxy-s25-ultra';
UPDATE public.products SET price = 644000 WHERE slug = 'apple-watch-series-10';
UPDATE public.products SET price = 1199000 WHERE slug = 'apple-watch-ultra-2';
UPDATE public.products SET price = 449000 WHERE slug = 'samsung-galaxy-watch-7';
UPDATE public.products SET price = 1649000 WHERE slug = 'ipad-pro-m4';
UPDATE public.products SET price = 374000 WHERE slug = 'airpods-pro-2';
UPDATE public.products SET price = 1199000 WHERE slug = 'samsung-galaxy-tab-s10';
