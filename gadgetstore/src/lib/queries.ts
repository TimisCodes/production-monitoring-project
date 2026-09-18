import { supabase } from '@/integrations/supabase/client';

// Products
export const fetchProducts = async (filters?: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  onSale?: boolean;
}) => {
  let query = supabase
    .from('products')
    .select('*, categories(name, slug), product_images(url, is_primary, sort_order)')
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('categories.slug', filters.category);
  if (filters?.brand) query = query.eq('brand', filters.brand);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
  if (filters?.featured) query = query.eq('is_featured', true);
  if (filters?.onSale) query = query.eq('is_on_sale', true);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const fetchProductBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_images(id, url, alt_text, is_primary, sort_order)')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
};

// Categories
export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const fetchCategoryProductCounts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('category_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  data?.forEach((p) => {
    if (p.category_id) {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    }
  });
  return counts;
};

// Orders
export const fetchUserOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, slug))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createOrder = async (order: {
  total: number;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_reference?: string;
  items: { product_id: string; quantity: number; price: number }[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total: order.total,
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_country: order.shipping_country,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      payment_reference: order.payment_reference || null,
      status: 'processing' as any,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = order.items.map((item) => ({
    order_id: orderData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  if (itemsError) throw itemsError;

  return orderData;
};

// Blog
export const fetchBlogPosts = async () => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchLatestBlogPosts = async (limit = 3) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const fetchBlogPostBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) throw error;
  return data;
};

// Admin queries
export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const userIds = Array.from(new Set((data || []).map((o: any) => o.user_id).filter(Boolean)));
  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);
    profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
  }
  return (data || []).map((o: any) => ({ ...o, profile: profileMap[o.user_id] || null }));
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ status: status as any })
    .eq('id', orderId);
  if (error) throw error;
};

export const fetchAllBlogPosts = async () => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Admin stats
export const fetchAdminStats = async () => {
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, total, status, created_at');
  if (ordersErr) throw ordersErr;

  const { count: productCount, error: prodErr } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  if (prodErr) throw prodErr;

  const { count: customerCount, error: custErr } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (custErr) throw custErr;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalRevenue = orders?.reduce((s, o) => s + Number(o.total), 0) || 0;
  const revenueThisMonth = orders
    ?.filter((o) => o.created_at >= startOfMonth)
    .reduce((s, o) => s + Number(o.total), 0) || 0;
  const totalOrders = orders?.length || 0;
  const ordersThisMonth = orders?.filter((o) => o.created_at >= startOfMonth).length || 0;
  const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;

  return {
    totalRevenue,
    revenueThisMonth,
    totalOrders,
    ordersThisMonth,
    totalProducts: productCount || 0,
    totalCustomers: customerCount || 0,
    pendingOrders,
    newCustomersThisMonth: 0,
  };
};

export const fetchPendingOrderCount = async () => {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count || 0;
};
