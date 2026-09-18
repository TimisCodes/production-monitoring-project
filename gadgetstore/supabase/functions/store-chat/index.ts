import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch product catalog for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("name, price, sale_price, brand, description, stock, is_on_sale, categories(name)")
      .limit(50);

    const productContext = products?.map((p: any) =>
      `- ${p.name} (${p.brand || 'No brand'}) — ₦${Number(p.price).toLocaleString()}${p.is_on_sale && p.sale_price ? ` (Sale: ₦${Number(p.sale_price).toLocaleString()})` : ''} | Category: ${p.categories?.name || 'N/A'} | Stock: ${p.stock}`
    ).join('\n') || 'No products available yet.';

    const systemPrompt = `You are a friendly and helpful store assistant for TechVault, an online electronics store based in Nigeria.

Available products:
${productContext}

Platform features you should help users with:
- **Shop**: browse and buy laptops, phones, tablets, accessories, audio, printers, wearables. Cart is a slide-out drawer.
- **Sell My Device** (/sell): users can sell their used phones, tablets, MacBooks. They go through a multi-step form (device type, model, carrier, storage, battery health, condition, condition checklist, photos) and receive an instant price estimate. Admin reviews and contacts within 24h.
- **Swap & Trade** (/swap): peer-to-peer gadget swap marketplace.
- **Refer & Earn**: every user gets a unique referral code in their Profile. They earn ₦5,000 for each friend who completes a sale. Friends sign up via /auth?ref=CODE.
- **Profile photo**: users can upload and crop a circular profile photo from the Profile page.
- **Dark mode**: toggle in navbar; pure-black theme.
- **Orders & Receipts**: users see receipts on their Orders page after a successful payment. Admins can download a professional PDF receipt.
- **Wishlist**, **Loyalty Points**, **Blog**.

Guidelines:
- Help customers find products, answer questions about specs, prices, and availability
- Guide users to features above when they ask (e.g. "how do I sell my iPhone" → /sell)
- All prices are in Nigerian Naira (₦)
- For order-related questions, direct customers to the "My Orders" page
- Be concise, friendly, and helpful
- If asked about something outside the store, politely redirect to store topics
- Never make up product information not in your context`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
