
-- Insert categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Phones', 'phones', 'Latest smartphones from top brands'),
  ('Watches', 'watches', 'Smartwatches and wearables'),
  ('Tablets', 'tablets', 'Tablets and e-readers'),
  ('Audio', 'audio', 'Headphones, earbuds and speakers'),
  ('Accessories', 'accessories', 'Cases, chargers and more')
ON CONFLICT DO NOTHING;

-- Insert products
INSERT INTO public.products (name, slug, description, price, sale_price, brand, stock, is_featured, is_on_sale, rating, rating_count, category_id, specs)
VALUES
  ('iPhone 17 Pro Max', 'iphone-17-pro-max', 'Latest Apple flagship, titanium finish, 6.9" display', 1199, NULL, 'Apple', 50, true, false, 4.9, 128,
    (SELECT id FROM public.categories WHERE slug = 'phones'),
    '{"display": "6.9\" Super Retina XDR", "chip": "A21 Pro", "camera": "48MP Triple Camera", "battery": "All-day battery", "storage": "256GB / 512GB / 1TB"}'::jsonb),

  ('iPhone 15 Pro', 'iphone-15-pro', 'A17 Pro chip, Action Button, USB-C', 999, NULL, 'Apple', 35, true, false, 4.7, 342,
    (SELECT id FROM public.categories WHERE slug = 'phones'),
    '{"display": "6.1\" Super Retina XDR", "chip": "A17 Pro", "camera": "48MP Main Camera", "battery": "All-day battery", "storage": "128GB / 256GB / 512GB / 1TB"}'::jsonb),

  ('iPhone 11', 'iphone-11', 'A13 Bionic, dual camera, available in Purple/Black/White', 499, 399, 'Apple', 20, false, true, 4.3, 1024,
    (SELECT id FROM public.categories WHERE slug = 'phones'),
    '{"display": "6.1\" Liquid Retina HD", "chip": "A13 Bionic", "camera": "12MP Dual Camera", "battery": "Up to 17h video", "storage": "64GB / 128GB / 256GB"}'::jsonb),

  ('Samsung Galaxy S25 Ultra', 'samsung-galaxy-s25-ultra', '200MP camera, built-in S Pen, AI features', 1299, NULL, 'Samsung', 40, true, false, 4.8, 215,
    (SELECT id FROM public.categories WHERE slug = 'phones'),
    '{"display": "6.8\" Dynamic AMOLED 2X", "chip": "Snapdragon 8 Elite", "camera": "200MP Main Camera", "battery": "5000mAh", "storage": "256GB / 512GB / 1TB"}'::jsonb),

  ('Apple Watch Series 10', 'apple-watch-series-10', 'Thinnest Apple Watch, sleep apnea detection, large display', 429, NULL, 'Apple', 60, true, false, 4.6, 89,
    (SELECT id FROM public.categories WHERE slug = 'watches'),
    '{"display": "Always-On Retina LTPO3", "chip": "S10 SiP", "health": "Sleep apnea detection, ECG, Blood Oxygen", "battery": "Up to 18h", "water": "50m water resistant"}'::jsonb),

  ('Apple Watch Ultra 2', 'apple-watch-ultra-2', 'Titanium case, precision GPS, 60hr battery', 799, NULL, 'Apple', 25, true, false, 4.8, 156,
    (SELECT id FROM public.categories WHERE slug = 'watches'),
    '{"display": "49mm Always-On Retina", "chip": "S9 SiP", "health": "ECG, Blood Oxygen, Temperature", "battery": "Up to 60h", "case": "Titanium"}'::jsonb),

  ('Samsung Galaxy Watch 7', 'samsung-galaxy-watch-7', 'Advanced health tracking, circular display', 299, NULL, 'Samsung', 45, false, false, 4.4, 178,
    (SELECT id FROM public.categories WHERE slug = 'watches'),
    '{"display": "1.3\" Super AMOLED", "chip": "Exynos W1000", "health": "BioActive Sensor, Body Composition", "battery": "Up to 40h", "os": "Wear OS 5"}'::jsonb),

  ('iPad Pro M4', 'ipad-pro-m4', 'Ultra Retina XDR display, M4 chip, thinnest Apple product ever', 1099, NULL, 'Apple', 30, true, false, 4.9, 203,
    (SELECT id FROM public.categories WHERE slug = 'tablets'),
    '{"display": "11\" Ultra Retina XDR", "chip": "M4", "camera": "12MP Wide + 10MP Ultra Wide", "battery": "Up to 10h", "storage": "256GB / 512GB / 1TB / 2TB"}'::jsonb),

  ('AirPods Pro 2', 'airpods-pro-2', 'Active noise cancellation, transparency mode, USB-C charging', 249, NULL, 'Apple', 100, false, false, 4.7, 512,
    (SELECT id FROM public.categories WHERE slug = 'audio'),
    '{"driver": "Apple H2 chip", "anc": "Active Noise Cancellation", "battery": "Up to 6h (30h with case)", "connectivity": "Bluetooth 5.3", "charging": "USB-C / MagSafe"}'::jsonb),

  ('Samsung Galaxy Tab S10', 'samsung-galaxy-tab-s10', '11" AMOLED display, DeX mode, S Pen included', 799, NULL, 'Samsung', 35, false, false, 4.5, 134,
    (SELECT id FROM public.categories WHERE slug = 'tablets'),
    '{"display": "11\" AMOLED 120Hz", "chip": "MediaTek Dimensity 9300+", "camera": "13MP + 8MP", "battery": "8400mAh", "storage": "128GB / 256GB"}'::jsonb);

-- Insert product images using Unsplash
INSERT INTO public.product_images (product_id, url, alt_text, is_primary, sort_order)
VALUES
  ((SELECT id FROM public.products WHERE slug = 'iphone-17-pro-max'), 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', 'iPhone 17 Pro Max', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'iphone-15-pro'), 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', 'iPhone 15 Pro', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'iphone-11'), 'https://images.unsplash.com/photo-1591337676887-a217a6c5e926?w=800&q=80', 'iPhone 11', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'samsung-galaxy-s25-ultra'), 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80', 'Samsung Galaxy S25 Ultra', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'apple-watch-series-10'), 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=80', 'Apple Watch Series 10', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'apple-watch-ultra-2'), 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80', 'Apple Watch Ultra 2', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'samsung-galaxy-watch-7'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'Samsung Galaxy Watch 7', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'ipad-pro-m4'), 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', 'iPad Pro M4', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'airpods-pro-2'), 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80', 'AirPods Pro 2', true, 0),
  ((SELECT id FROM public.products WHERE slug = 'samsung-galaxy-tab-s10'), 'https://images.unsplash.com/photo-1561154464-82e9aab32f4d?w=800&q=80', 'Samsung Galaxy Tab S10', true, 0);
