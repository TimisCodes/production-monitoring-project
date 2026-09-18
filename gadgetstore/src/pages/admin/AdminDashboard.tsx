import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllOrders, fetchAdminStats } from '@/lib/queries';
import { formatPrice } from '@/lib/formatPrice';
import { DollarSign, ShoppingBag, Package, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-purple-500/20 text-purple-500',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const AnimatedNumber = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return <>{prefix}{prefix === '₦' ? display.toLocaleString() : display}</>;
};

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(0);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAllOrders,
  });

  // Realtime subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast.success(`New order received — Order #${(payload.new as any).id?.slice(0, 8).toUpperCase()}`);
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['pending-order-count'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['pending-order-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filteredOrders = orders?.filter((o) => {
    if (dateFilter === 'all') return true;
    const d = new Date(o.created_at);
    const now = new Date();
    if (dateFilter === 'today') return d.toDateString() === now.toDateString();
    if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalPages = Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders?.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    toast.success('Dashboard refreshed');
  };

  const statCards = [
    { label: 'Total Revenue', value: stats?.totalRevenue || 0, icon: DollarSign, prefix: '₦', color: 'text-primary' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, prefix: '', color: 'text-primary' },
    { label: 'Products', value: stats?.totalProducts || 0, icon: Package, prefix: '', color: 'text-primary' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: TrendingUp, prefix: '', color: 'text-warning' },
    { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, prefix: '', color: 'text-primary' },
    { label: 'Revenue This Month', value: stats?.revenueThisMonth || 0, icon: DollarSign, prefix: '₦', color: 'text-success' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(0); }}>
            <SelectTrigger className="w-36 h-9 bg-secondary border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, prefix, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="font-display text-2xl font-bold text-foreground">
                <AnimatedNumber value={value} prefix={prefix} />
              </p>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg font-bold text-foreground mb-4">Recent Orders</h2>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Order ID</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Items</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedOrders && paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const items = (order.order_items as any[]) || [];
                  return (
                    <tr key={order.id}>
                      <td className="p-3 text-foreground font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3 text-foreground">{(order as any).customer_name || (order as any).profiles?.full_name || 'N/A'}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {items.slice(0, 2).map((it: any, i: number) => (
                          <span key={i}>{it.products?.name || 'Item'} x{it.quantity}{i < Math.min(items.length, 2) - 1 ? ', ' : ''}</span>
                        ))}
                        {items.length > 2 && <span> +{items.length - 2} more</span>}
                      </td>
                      <td className="p-3 text-foreground font-medium">{formatPrice(Number(order.total))}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded capitalize ${statusColors[order.status] || 'bg-secondary text-foreground'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No orders yet — orders will appear here once customers start buying.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
