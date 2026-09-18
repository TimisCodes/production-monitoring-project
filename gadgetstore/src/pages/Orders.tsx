import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { fetchUserOrders } from '@/lib/queries';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/formatPrice';
import { Package, ChevronDown, ChevronUp, Printer, CheckCircle, XCircle, Clock, Truck, MapPin, Check, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-primary/10 text-primary',
  shipped: 'bg-purple-500/10 text-purple-500',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const stepIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  processing: <Package className="h-3.5 w-3.5" />,
  shipped: <Truck className="h-3.5 w-3.5" />,
  delivered: <Check className="h-3.5 w-3.5" />,
};

const OrderTimeline = ({ status }: { status: string }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        <XCircle className="h-4 w-4" />
        <span>Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = statusSteps.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full">
      {statusSteps.map((step, i) => {
        const isComplete = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all ${
                isComplete ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''}`}>
                {stepIcons[step]}
              </div>
              <span className={`text-[10px] mt-1.5 capitalize ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step}
              </span>
            </div>
            {i < statusSteps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${
                i < currentIdx ? 'bg-primary' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const printReceipt = (order: any) => {
  const items = (order.order_items as any[]) || [];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const itemsHtml = items.map((it: any) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333">${it.products?.name || 'Product'}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#666">${it.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;font-weight:500">₦${(Number(it.price) * it.quantity).toLocaleString()}</td>
    </tr>`
  ).join('');

  printWindow.document.write(`
    <html><head><title>TechVault Receipt</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; padding: 48px; max-width: 640px; margin: 0 auto; color: #111; -webkit-font-smoothing: antialiased; }
      .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #000; }
      .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
      .receipt-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-top: 8px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
      .meta-item { font-size: 13px; color: #666; } .meta-item strong { color: #111; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; padding: 20px; background: #fafafa; border-radius: 12px; }
      .info-item { font-size: 13px; } .info-label { color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead th { text-align: left; padding: 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 2px solid #eee; }
      thead th:last-child { text-align: right; } thead th:nth-child(2) { text-align: center; }
      .total-row td { padding: 16px 0; border-top: 2px solid #111; font-size: 18px; font-weight: 700; }
      .total-row td:last-child { text-align: right; }
      .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .paid { background: #e8f5e9; color: #2e7d32; } .unpaid { background: #fce4ec; color: #c62828; }
      .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
      @media print { body { padding: 24px; } }
    </style></head><body>
    <div class="header">
      <div class="logo">TechVault</div>
      <div class="receipt-label">Order Receipt</div>
    </div>
    <div class="meta">
      <div class="meta-item"><strong>Order #${order.id.slice(0, 8).toUpperCase()}</strong></div>
      <div class="meta-item">${format(new Date(order.created_at), 'MMMM d, yyyy')}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Customer</div>${(order as any).customer_name || 'N/A'}</div>
      <div class="info-item"><div class="info-label">Email</div>${(order as any).customer_email || '—'}</div>
      <div class="info-item"><div class="info-label">Phone</div>${(order as any).customer_phone || '—'}</div>
      <div class="info-item"><div class="info-label">Delivery Address</div>${[order.shipping_address, order.shipping_city, order.shipping_country].filter(Boolean).join(', ') || '—'}</div>
    </div>
    <div style="margin-bottom:8px"><span class="payment-badge ${(order as any).payment_reference ? 'paid' : 'unpaid'}">${(order as any).payment_reference ? '✓ Payment Received' : '✗ Payment Pending'}</span></div>
    ${(order as any).payment_reference ? `<div style="font-size:12px;color:#666;margin-bottom:24px">Ref: ${(order as any).payment_reference}</div>` : ''}
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr class="total-row"><td colspan="2">Total</td><td>₦${Number(order.total).toLocaleString()}</td></tr></tfoot>
    </table>
    <div class="footer">
      Thank you for shopping with TechVault!<br/>
      <span style="font-size:11px">support@techvault.ng · 0800-GADGETS</span>
    </div>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const downloadReceipt = (order: any) => {
  const items = (order.order_items as any[]) || [];
  const itemsHtml = items.map((it: any) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333">${it.products?.name || 'Product'}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#666">${it.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;font-weight:500">₦${(Number(it.price) * it.quantity).toLocaleString()}</td>
    </tr>`
  ).join('');

  const html = `<html><head><title>TechVault Receipt</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; padding: 48px; max-width: 640px; margin: 0 auto; color: #111; }
      .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #000; }
      .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
      .receipt-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-top: 8px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
      .meta-item { font-size: 13px; color: #666; } .meta-item strong { color: #111; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; padding: 20px; background: #fafafa; border-radius: 12px; }
      .info-item { font-size: 13px; } .info-label { color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead th { text-align: left; padding: 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 2px solid #eee; }
      thead th:last-child { text-align: right; } thead th:nth-child(2) { text-align: center; }
      .total-row td { padding: 16px 0; border-top: 2px solid #111; font-size: 18px; font-weight: 700; }
      .total-row td:last-child { text-align: right; }
      .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .paid { background: #e8f5e9; color: #2e7d32; } .unpaid { background: #fce4ec; color: #c62828; }
      .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    </style></head><body>
    <div class="header">
      <div class="logo">TechVault</div>
      <div class="receipt-label">Order Receipt</div>
    </div>
    <div class="meta">
      <div class="meta-item"><strong>Order #${order.id.slice(0, 8).toUpperCase()}</strong></div>
      <div class="meta-item">${format(new Date(order.created_at), 'MMMM d, yyyy')}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Customer</div>${order.customer_name || 'N/A'}</div>
      <div class="info-item"><div class="info-label">Email</div>${order.customer_email || '—'}</div>
      <div class="info-item"><div class="info-label">Phone</div>${order.customer_phone || '—'}</div>
      <div class="info-item"><div class="info-label">Delivery Address</div>${[order.shipping_address, order.shipping_city, order.shipping_country].filter(Boolean).join(', ') || '—'}</div>
    </div>
    <div style="margin-bottom:8px"><span class="payment-badge ${order.payment_reference ? 'paid' : 'unpaid'}">${order.payment_reference ? '✓ Payment Received' : '✗ Payment Pending'}</span></div>
    ${order.payment_reference ? `<div style="font-size:12px;color:#666;margin-bottom:24px">Ref: ${order.payment_reference}</div>` : ''}
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr class="total-row"><td colspan="2">Total</td><td>₦${Number(order.total).toLocaleString()}</td></tr></tfoot>
    </table>
    <div class="footer">
      Thank you for shopping with TechVault!<br/>
      <span style="font-size:11px">support@techvault.ng · 0800-GADGETS</span>
    </div>
    </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TechVault-Receipt-${order.id.slice(0, 8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Orders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: fetchUserOrders,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const newOrderId = searchParams.get('new');

  useEffect(() => {
    if (newOrderId && orders) {
      const order = orders.find((o) => o.id === newOrderId);
      if (order) {
        setExpandedId(newOrderId);
        toast.success('Payment successful! Your receipt is ready to download.', { duration: 5000 });
        setSearchParams({}, { replace: true });
      }
    }
  }, [newOrderId, orders]);
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">Purchase History</h1>
        <p className="text-muted-foreground text-sm mb-8">Track your orders and view receipts.</p>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">No orders yet. Start shopping to see your purchase history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = (order.order_items as any[]) || [];
              const isExpanded = expandedId === order.id;
              const hasPaid = !!(order as any).payment_reference;
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-shadow hover:shadow-sm">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[order.status] || ''}`}>
                          {order.status}
                        </span>
                        {hasPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                            <CheckCircle className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                            <XCircle className="h-3 w-3" /> Unpaid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-foreground">{formatPrice(Number(order.total))}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</span>
                        <span className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4 animate-in fade-in duration-200">
                      {/* Order Timeline */}
                      <div className="py-3">
                        <OrderTimeline status={order.status} />
                      </div>

                      <div className="space-y-2">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>
                              <span className="text-foreground">{item.products?.name || 'Product'}</span>
                              <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                            </div>
                            <span className="text-foreground font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      {(order.shipping_address || order.shipping_city) && (
                        <div className="text-xs text-muted-foreground pt-2 border-t border-border/30 flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          {[order.shipping_address, order.shipping_city, order.shipping_country].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {(order as any).payment_reference && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Payment Ref: </span>
                          {(order as any).payment_reference}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => downloadReceipt(order)}>
                          <Download className="h-3 w-3" /> Download Receipt
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => printReceipt(order)}>
                          <Printer className="h-3 w-3" /> Print Receipt
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
