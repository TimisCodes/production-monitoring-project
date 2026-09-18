import { useQuery } from '@tanstack/react-query';
import { fetchAllOrders, fetchCategories } from '@/lib/queries';
import { formatPrice } from '@/lib/formatPrice';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 67%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(190, 80%, 45%)',
];

const AdminAnalytics = () => {
  const { data: orders, isLoading: ordersLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchAllOrders });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  // Fetch profiles for new customers chart
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, created_at');
      if (error) throw error;
      return data;
    },
  });

  const monthlyData = useMemo(() => {
    if (!orders) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthOrders = orders.filter((o) =>
        isWithinInterval(new Date(o.created_at), { start, end })
      );
      return {
        month: format(date, 'MMM'),
        revenue: monthOrders.reduce((sum, o) => sum + Number(o.total), 0),
        orders: monthOrders.length,
      };
    });
  }, [orders]);

  const newCustomersData = useMemo(() => {
    if (!profiles) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = profiles.filter((p) =>
        isWithinInterval(new Date(p.created_at), { start, end })
      ).length;
      return { month: format(date, 'MMM'), customers: count };
    });
  }, [profiles]);

  const categorySales = useMemo(() => {
    if (!orders || !categories) return [];
    const catMap: Record<string, { name: string; revenue: number }> = {};
    categories.forEach((c) => { catMap[c.id] = { name: c.name, revenue: 0 }; });

    orders.forEach((order) => {
      (order.order_items as any[])?.forEach((item: any) => {
        // We need product's category_id — it's not in the join. We'll map from item.products
        // Since we only have product name in the join, we'll accumulate by order total / items as approximation
        // Better: let's use a separate query. For now, distribute evenly across items
      });
    });

    // More accurate: query products with categories
    return [];
  }, [orders, categories]);

  // Better category sales query
  const { data: categorySalesData } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('quantity, price, products(name, category_id, categories(name))');
      if (error) throw error;
      const catMap: Record<string, { name: string; revenue: number }> = {};
      data?.forEach((item: any) => {
        const catName = item.products?.categories?.name || 'Uncategorized';
        if (!catMap[catName]) catMap[catName] = { name: catName, revenue: 0 };
        catMap[catName].revenue += Number(item.price) * item.quantity;
      });
      return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
    },
  });

  const bestSellers = useMemo(() => {
    if (!orders) return [];
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((order) => {
      (order.order_items as any[])?.forEach((item: any) => {
        const name = item.products?.name || 'Unknown';
        if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 };
        productMap[name].count += item.quantity;
        productMap[name].revenue += Number(item.price) * item.quantity;
      });
    });
    return Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  const hasNoData = !orders || orders.length === 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Sales Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Monthly Revenue</h3>
          {ordersLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : hasNoData ? (
            <p className="text-muted-foreground text-sm py-16 text-center">No sales data yet — orders will appear here once customers start buying.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="fill-muted-foreground" fontSize={12} />
                <YAxis className="fill-muted-foreground" fontSize={12} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Sales Donut */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Sales by Category</h3>
          {!categorySalesData || categorySalesData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">No category data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {categorySalesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* New Customers */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">New Customers</h3>
          {!profiles ? (
            <Skeleton className="h-[200px] w-full" />
          ) : newCustomersData.every(d => d.customers === 0) ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No customer data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={newCustomersData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="fill-muted-foreground" fontSize={12} />
                <YAxis className="fill-muted-foreground" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="customers" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Over Time */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Orders Over Time</h3>
          {ordersLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : hasNoData ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="fill-muted-foreground" fontSize={12} />
                <YAxis className="fill-muted-foreground" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Best Sellers */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Top 5 Best-Selling Products</h3>
        {bestSellers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sales data yet — orders will appear here once customers start buying.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Product</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Units Sold</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((p, i) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 text-foreground">{p.name}</td>
                    <td className="p-2 text-right text-foreground">{p.count}</td>
                    <td className="p-2 text-right font-display font-bold text-primary">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
