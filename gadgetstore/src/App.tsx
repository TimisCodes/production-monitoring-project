import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, checkAdminRole } from "@/stores/authStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Wishlist from "./pages/Wishlist";
import SwapMarketplace from "./pages/SwapMarketplace";
import SwapListGadget from "./pages/SwapListGadget";
import SwapDetail from "./pages/SwapDetail";
import SwapDashboard from "./pages/SwapDashboard";
import SellDevice from "./pages/SellDevice";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSellRequests from "./pages/admin/AdminSellRequests";
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setIsAdmin, setLoading, setInitialized } = useAuthStore();
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const clearWishlist = useWishlistStore((s) => s.clear);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setUser(user);
        if (user) {
          setTimeout(async () => {
            const admin = await checkAdminRole(user.id);
            setIsAdmin(admin);
            setLoading(false);
            setInitialized(true);
            fetchWishlist(user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
          setInitialized(true);
          clearWishlist();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        checkAdminRole(user.id).then((admin) => {
          setIsAdmin(admin);
          setLoading(false);
          setInitialized(true);
          fetchWishlist(user.id);
        });
      } else {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="techvault-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthInitializer>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/swap" element={<SwapMarketplace />} />
              <Route path="/swap/list" element={<ProtectedRoute><SwapListGadget /></ProtectedRoute>} />
              <Route path="/swap/dashboard" element={<ProtectedRoute><SwapDashboard /></ProtectedRoute>} />
              <Route path="/swap/:id" element={<SwapDetail />} />
              <Route path="/sell" element={<SellDevice />} />

              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="sell-requests" element={<AdminSellRequests />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatWidget />
          </AuthInitializer>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
