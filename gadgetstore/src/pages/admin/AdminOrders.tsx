import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllOrders, updateOrderStatus } from '@/lib/queries';
import { formatPrice } from '@/lib/formatPrice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye, Printer, Download, Zap } from 'lucide-react';
import jsPDF from 'jspdf';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-purple-500/20 text-purple-500',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { data: orders, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchAllOrders });

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['pending-order-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-order-count'] });
      toast.success('Order status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalPages = Math.ceil((orders?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrders = orders?.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const receiptNumber = (id: string) => 'TV-' + id.slice(0, 8).toUpperCase();

  const handlePrintReceipt = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 720px; margin: 0 auto; color: #111; }
        .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 22px; font-weight: 700; }
        .tagline { font-size: 11px; color: #666; }
        .meta { text-align: right; font-size: 12px; color: #444; }
        .meta strong { display: block; font-size: 14px; color: #111; margin-bottom: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 13px; }
        .grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 0 0 6px; font-weight: 600; }
        .grid p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { text-align: left; padding: 10px 8px; font-size: 13px; }
        th { background: #f5f5f5; color: #444; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        tbody tr { border-bottom: 1px solid #eee; }
        .num { text-align: right; }
        .center { text-align: center; }
        .totals { margin-left: auto; width: 280px; font-size: 13px; }
        .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
        .totals .grand { border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; }
        .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 11px; line-height: 1.6; }
        .thanks { font-size: 14px; color: #111; font-weight: 600; margin-bottom: 4px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownloadPDF = () => {
    if (!receiptOrder) return;
    const o = receiptOrder;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 50;

    // Header
    doc.setFontSize(20).setFont('helvetica', 'bold').text('TechVault', 40, y);
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(110).text('Your Trusted Tech Partner Since 2013', 40, y + 13);
    doc.setTextColor(0).setFontSize(11).setFont('helvetica', 'bold').text('RECEIPT', W - 40, y, { align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110)
      .text(`No: ${receiptNumber(o.id)}`, W - 40, y + 13, { align: 'right' })
      .text(`Date: ${format(new Date(o.created_at), 'PPP p')}`, W - 40, y + 25, { align: 'right' });
    y += 50;
    doc.setDrawColor(0).setLineWidth(1.5).line(40, y, W - 40, y);
    y += 20;

    // Bill to / Ship to
    doc.setTextColor(110).setFontSize(9).setFont('helvetica', 'bold').text('BILL TO', 40, y);
    doc.text('SHIP TO', W / 2, y);
    doc.setTextColor(0).setFontSize(11).setFont('helvetica', 'normal');
    const name = o.customer_name || (o as any).profile?.full_name || 'Customer';
    doc.text(name, 40, y + 14);
    doc.text(o.customer_email || '', 40, y + 28);
    doc.text(o.customer_phone || '', 40, y + 42);
    const addr = [o.shipping_address, o.shipping_city, o.shipping_country].filter(Boolean).join(', ');
    const addrLines = doc.splitTextToSize(addr || '—', W / 2 - 60);
    doc.text(addrLines, W / 2, y + 14);
    y += 70;

    // Items table
    doc.setFillColor(245, 245, 245).rect(40, y, W - 80, 22, 'F');
    doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(80)
      .text('ITEM', 48, y + 14)
      .text('QTY', W - 220, y + 14, { align: 'center' })
      .text('UNIT PRICE', W - 150, y + 14, { align: 'right' })
      .text('SUBTOTAL', W - 48, y + 14, { align: 'right' });
    y += 22;
    doc.setTextColor(0).setFont('helvetica', 'normal').setFontSize(10);
    let subtotal = 0;
    ((o.order_items as any[]) || []).forEach((it: any) => {
      const line = Number(it.price) * it.quantity;
      subtotal += line;
      const wrapped = doc.splitTextToSize(it.products?.name || 'Product', W - 290);
      doc.text(wrapped, 48, y + 14);
      doc.text(String(it.quantity), W - 220, y + 14, { align: 'center' });
      doc.text(formatPrice(Number(it.price)), W - 150, y + 14, { align: 'right' });
      doc.text(formatPrice(line), W - 48, y + 14, { align: 'right' });
      y += Math.max(22, wrapped.length * 14);
      doc.setDrawColor(230).setLineWidth(0.5).line(40, y, W - 40, y);
    });
    y += 16;

    // Totals
    const total = Number(o.total);
    const right = W - 48;
    const left = W - 220;
    doc.setFontSize(10).setTextColor(110);
    doc.text('Subtotal', left, y); doc.setTextColor(0).text(formatPrice(subtotal), right, y, { align: 'right' });
    y += 16;
    if (Math.abs(total - subtotal) > 0.5) {
      doc.setTextColor(110).text('Adjustments', left, y); doc.setTextColor(0).text(formatPrice(total - subtotal), right, y, { align: 'right' });
      y += 16;
    }
    doc.setDrawColor(0).setLineWidth(1).line(left, y, right, y);
    y += 14;
    doc.setFontSize(13).setFont('helvetica', 'bold').text('TOTAL', left, y);
    doc.text(formatPrice(total), right, y, { align: 'right' });
    y += 24;
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(110)
      .text(`Payment Method: ${(o as any).payment_reference ? 'Paystack' : 'Pending'}`, 40, y)
      .text(`Payment Ref: ${(o as any).payment_reference || '—'}`, 40, y + 14)
      .text(`Status: ${(o as any).payment_reference ? 'Paid' : 'Pending'}`, 40, y + 28);
    y += 60;

    // Footer
    doc.setDrawColor(220).setLineWidth(0.5).line(40, y, W - 40, y);
    y += 18;
    doc.setFontSize(11).setTextColor(0).setFont('helvetica', 'bold').text('Thank you for your purchase!', W / 2, y, { align: 'center' });
    y += 14;
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(110)
      .text('Returns accepted within 7 days of delivery in original condition.', W / 2, y, { align: 'center' })
      .text('Questions? Contact support@techvault.ng — we are happy to help.', W / 2, y + 12, { align: 'center' });

    doc.save(`receipt-${receiptNumber(o.id)}.pdf`);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Orders</h1>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Order</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Phone</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Total</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Payment</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedOrders && paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const profile = (order as any).profile;
                  const customerName = (order as any).customer_name || profile?.full_name || 'N/A';
                  const avatar = profile?.avatar_url;
                  const customerEmail = (order as any).customer_email || '—';
                  const customerPhone = (order as any).customer_phone || '—';
                  const paymentRef = (order as any).payment_reference;
                  const hasPaid = !!paymentRef;
                  return (
                    <tr key={order.id}>
                      <td className="p-3 text-foreground font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3 text-foreground text-xs">
                        <div className="flex items-center gap-2">
                          {avatar ? (
                            <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold">
                              {customerName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span>{customerName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{customerEmail}</td>
                      <td className="p-3 text-muted-foreground text-xs">{customerPhone}</td>
                      <td className="p-3 text-foreground font-medium text-xs">{formatPrice(Number(order.total))}</td>
                      <td className="p-3">
                        {hasPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                            <CheckCircle className="h-3 w-3" /> Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                            <XCircle className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                      <td className="p-3">
                        <Select value={order.status} onValueChange={(v) => statusMutation.mutate({ id: order.id, status: v })}>
                          <SelectTrigger className={`w-28 h-7 text-xs border-0 ${statusColors[order.status] || ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReceiptOrder(order)} title="View Receipt">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No orders yet.</td></tr>
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

      {/* Receipt Dialog */}
      <Dialog open={!!receiptOrder} onOpenChange={() => setReceiptOrder(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center justify-between gap-3">
              <span>Order Receipt</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handlePrintReceipt}>
                  <Printer className="h-3 w-3" /> Print
                </Button>
                <Button size="sm" className="text-xs gap-1" onClick={handleDownloadPDF}>
                  <Download className="h-3 w-3" /> Download PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {receiptOrder && (
            <div ref={receiptRef} className="bg-white text-black p-6 rounded-lg">
              <div className="hdr flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                  <div className="brand text-2xl font-bold flex items-center gap-2"><Zap className="h-5 w-5" /> TechVault</div>
                  <div className="tagline text-[11px] text-gray-600">Your Trusted Tech Partner Since 2013</div>
                </div>
                <div className="meta text-right text-xs text-gray-700">
                  <strong className="block text-sm text-black mb-0.5">RECEIPT</strong>
                  No: {receiptNumber(receiptOrder.id)}<br />
                  Date: {format(new Date(receiptOrder.created_at), 'PPP p')}
                </div>
              </div>
              <div className="grid grid grid-cols-2 gap-6 mb-6 text-[13px]">
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Bill To</h3>
                  <p className="font-medium">{receiptOrder.customer_name || (receiptOrder as any).profile?.full_name || 'Customer'}</p>
                  <p>{receiptOrder.customer_email || '—'}</p>
                  <p>{receiptOrder.customer_phone || '—'}</p>
                </div>
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">Ship To</h3>
                  <p>{[receiptOrder.shipping_address, receiptOrder.shipping_city, receiptOrder.shipping_country].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2.5 text-[11px] uppercase tracking-wider text-gray-600 font-semibold">Item</th>
                    <th className="center text-center p-2.5 text-[11px] uppercase tracking-wider text-gray-600 font-semibold">Qty</th>
                    <th className="num text-right p-2.5 text-[11px] uppercase tracking-wider text-gray-600 font-semibold">Unit</th>
                    <th className="num text-right p-2.5 text-[11px] uppercase tracking-wider text-gray-600 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {((receiptOrder.order_items as any[]) || []).map((it: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-2.5">{it.products?.name || 'Product'}</td>
                      <td className="center text-center p-2.5">{it.quantity}</td>
                      <td className="num text-right p-2.5">{formatPrice(Number(it.price))}</td>
                      <td className="num text-right p-2.5">{formatPrice(Number(it.price) * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <div className="totals w-72 text-[13px]">
                  <div className="row flex justify-between py-1.5"><span className="text-gray-600">Payment Method</span><span>{(receiptOrder as any).payment_reference ? 'Paystack' : 'Pending'}</span></div>
                  <div className="row flex justify-between py-1.5"><span className="text-gray-600">Payment Ref</span><span className="font-mono text-[11px]">{(receiptOrder as any).payment_reference || '—'}</span></div>
                  <div className="grand border-t-2 border-black mt-2 pt-3 flex justify-between font-bold text-base">
                    <span>TOTAL</span><span>{formatPrice(Number(receiptOrder.total))}</span>
                  </div>
                </div>
              </div>
              <div className="footer mt-9 pt-4 border-t border-gray-200 text-center text-[11px] text-gray-600 leading-relaxed">
                <p className="thanks text-sm font-semibold text-black mb-1">Thank you for your purchase!</p>
                Returns accepted within 7 days of delivery in original condition.<br />
                Questions? Contact support@techvault.ng — we are happy to help.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
