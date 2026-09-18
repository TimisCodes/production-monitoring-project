import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, FileText, BarChart3, Zap, ArrowLeft, Smartphone } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPendingOrderCount } from '@/lib/queries';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminLayout = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-order-count'],
    queryFn: fetchPendingOrderCount,
  });

  // Realtime for pending count badge
  useEffect(() => {
    const channel = supabase
      .channel('admin-sidebar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pending-order-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', badge: 0 },
    { to: '/admin/products', icon: Package, label: 'Products', badge: 0 },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', badge: pendingCount || 0 },
    { to: '/admin/sell-requests', icon: Smartphone, label: 'Sell Requests', badge: 0 },
    { to: '/admin/blog', icon: FileText, label: 'Blog', badge: 0 },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', badge: 0 },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            TechVault Admin
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                (to === '/admin' ? location.pathname === to : location.pathname.startsWith(to))
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              {badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/admin" className="flex items-center gap-2 font-display text-sm font-bold">
            <Zap className="h-4 w-4 text-primary" /> Admin
          </Link>
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(({ to, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                className={`p-2 rounded relative ${
                  (to === '/admin' ? location.pathname === to : location.pathname.startsWith(to))
                    ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
