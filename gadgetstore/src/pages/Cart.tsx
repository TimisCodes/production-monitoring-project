import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCallback } from 'react';
import { formatPrice } from '@/lib/formatPrice';

const FREE_SHIPPING_THRESHOLD = 50000;

const Cart = () => {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  const handleRemove = useCallback((id: string) => removeItem(id), [removeItem]);
  const handleIncrease = useCallback((id: string, qty: number) => updateQuantity(id, qty + 1), [updateQuantity]);
  const handleDecrease = useCallback((id: string, qty: number) => updateQuantity(id, qty - 1), [updateQuantity]);

  const cartTotal = total();
  const shipping = cartTotal > FREE_SHIPPING_THRESHOLD ? 0 : 3500;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/products"><Button className="rounded-full px-8 text-sm">Browse Products</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold text-foreground mb-8 tracking-tight">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl border border-border/50 p-4 flex gap-4">
                <div className="h-20 w-20 bg-secondary/30 rounded-xl shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-6 w-6 opacity-30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm truncate">{item.name}</h3>
                  <p className="text-foreground font-semibold mt-1 text-sm">
                    {formatPrice((item.sale_price ?? item.price) * item.quantity)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-border rounded-full">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleDecrease(item.id, item.quantity)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleIncrease(item.id, item.quantity)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-6 h-fit">
            <h3 className="font-medium text-foreground mb-5">Summary</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(cartTotal + shipping)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button className="w-full rounded-full text-sm font-medium">
                Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
