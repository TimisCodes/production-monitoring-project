import { Link } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCallback } from 'react';

const CartDrawer = () => {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const itemCount = useCartStore((s) => s.itemCount());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const shipping = total >= 50000 ? 0 : 3500;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-semibold">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
            <Link to="/products">
              <Button size="sm" className="rounded-full text-xs">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm font-semibold text-primary mt-0.5">
                      {formatPrice(item.sale_price ?? item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto h-7 w-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-border pt-3">
                <span>Total</span>
                <span>{formatPrice(total + shipping)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/checkout">
                  <Button className="w-full rounded-full font-medium">Proceed to Checkout</Button>
                </Link>
                <Link to="/cart">
                  <Button variant="outline" className="w-full rounded-full text-xs">View Full Cart</Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
