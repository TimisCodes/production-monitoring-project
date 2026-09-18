import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface WishlistState {
  items: string[]; // product IDs
  loading: boolean;
  initialized: boolean;
  fetchWishlist: (userId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  fetchWishlist: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);
    set({
      items: data?.map((d) => d.product_id) ?? [],
      loading: false,
      initialized: true,
    });
  },

  toggleItem: async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = get().items;
    if (current.includes(productId)) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      set({ items: current.filter((id) => id !== productId) });
    } else {
      await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId });
      set({ items: [...current, productId] });
    }
  },

  isWishlisted: (productId: string) => get().items.includes(productId),

  clear: () => set({ items: [], initialized: false }),
}));
