import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { createOrder } from '@/lib/queries';
import { awardLoyaltyPoints } from '@/lib/loyaltyPoints';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatPrice';
import { usePaystackPayment } from 'react-paystack';
import { ShieldCheck, Truck, Lock } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 50000;

const CheckoutInner = ({ paystackKey }: { paystackKey: string }) => {
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: user?.email || '', phone: '', address: '', city: '', country: 'Nigeria' });

  const cartTotal = total();
  const shipping = cartTotal > FREE_SHIPPING_THRESHOLD ? 0 : 3500;
  const grandTotal = cartTotal + shipping;
  const reference = `TV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const config = {
    reference,
    email: user?.email || '',
    amount: Math.round(grandTotal * 100), // kobo
    publicKey: paystackKey,
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = useCallback(async (ref: any) => {
    setLoading(true);
    try {
      const orderData = await createOrder({
        total: grandTotal,
        shipping_address: form.address.trim(),
        shipping_city: form.city.trim(),
        shipping_country: form.country.trim(),
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        payment_reference: ref.reference || reference,
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
          price: i.sale_price ?? i.price,
        })),
      });
      // Award loyalty points
      try {
        await awardLoyaltyPoints(orderData.id, grandTotal);
      } catch { /* non-critical */ }
      clearCart();
      toast.success('Order placed successfully! Points earned 🎉');
      navigate(`/orders?new=${orderData.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }, [form, items, grandTotal, reference, clearCart, navigate]);

  const onClose = useCallback(() => {
    toast.error('Payment cancelled. Your cart is still saved.');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in'); navigate('/auth'); return; }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    initializePayment({ onSuccess, onClose } as any);
  }, [user, form, items, initializePayment, onSuccess, onClose, navigate]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-semibold text-foreground mb-8 tracking-tight">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
           <h3 className="font-medium text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" /> Contact & Shipping
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={200} placeholder="John Doe" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone Number *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={20} placeholder="+234 800 000 0000" type="tel" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={200} placeholder="you@example.com" type="email" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={500} placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">City *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} placeholder="Lagos" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Order Summary
            </h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                <span className="text-foreground">{formatPrice((item.sale_price ?? item.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border/50 mt-3 pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="border-t border-border/50 mt-3 pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-foreground">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full text-sm font-medium" size="lg" disabled={loading}>
            <Lock className="mr-2 h-4 w-4" />
            {loading ? 'Processing...' : `Pay ${formatPrice(grandTotal)} with Paystack`}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

const Checkout = () => {
  const [paystackKey, setPaystackKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-paystack-key');
        if (error) throw error;
        setPaystackKey(data?.key || '');
      } catch {
        toast.error('Failed to load payment configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchKey();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </Layout>
    );
  }

  if (!paystackKey) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Payment system unavailable. Please try again later.</p>
        </div>
      </Layout>
    );
  }

  return <CheckoutInner paystackKey={paystackKey} />;
};

export default Checkout;
