
-- Enum for swap listing condition
CREATE TYPE public.swap_condition AS ENUM ('new', 'like_new', 'good', 'fair');

-- Enum for swap listing status
CREATE TYPE public.swap_listing_status AS ENUM ('active', 'swapped', 'archived', 'expired');

-- Enum for swap type
CREATE TYPE public.swap_type AS ENUM ('swap_only', 'swap_and_cash', 'will_also_sell');

-- Enum for proposal status
CREATE TYPE public.swap_proposal_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'completed', 'cancelled');

-- Swap listings table
CREATE TABLE public.swap_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT NOT NULL DEFAULT 'phones',
  condition swap_condition NOT NULL DEFAULT 'good',
  year_purchased INTEGER,
  storage_specs TEXT,
  description TEXT,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  swap_type swap_type NOT NULL DEFAULT 'swap_only',
  open_to_cash_topup BOOLEAN NOT NULL DEFAULT false,
  cash_topup_amount NUMERIC DEFAULT 0,
  open_to_partial_trade BOOLEAN NOT NULL DEFAULT false,
  desired_items TEXT[] DEFAULT '{}',
  location_city TEXT,
  status swap_listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Swap listings viewable by everyone" ON public.swap_listings FOR SELECT USING (true);
CREATE POLICY "Users can create own swap listings" ON public.swap_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own swap listings" ON public.swap_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own swap listings" ON public.swap_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_swap_listings_updated_at BEFORE UPDATE ON public.swap_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Swap listing images
CREATE TABLE public.swap_listing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.swap_listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Swap images viewable by everyone" ON public.swap_listing_images FOR SELECT USING (true);
CREATE POLICY "Users can manage own listing images" ON public.swap_listing_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.swap_listings WHERE id = listing_id AND user_id = auth.uid()));

-- Swap proposals
CREATE TABLE public.swap_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.swap_listings(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL,
  offered_listing_id UUID REFERENCES public.swap_listings(id) ON DELETE SET NULL,
  cash_topup_amount NUMERIC DEFAULT 0,
  message TEXT,
  status swap_proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals on own listings" ON public.swap_proposals FOR SELECT TO authenticated
  USING (
    proposer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.swap_listings WHERE id = listing_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create proposals" ON public.swap_proposals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = proposer_id);
CREATE POLICY "Listing owners can update proposals" ON public.swap_proposals FOR UPDATE TO authenticated
  USING (
    proposer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.swap_listings WHERE id = listing_id AND user_id = auth.uid())
  );

CREATE TRIGGER update_swap_proposals_updated_at BEFORE UPDATE ON public.swap_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Swap messages
CREATE TABLE public.swap_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.swap_proposals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.swap_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Participants can send messages" ON public.swap_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark as read" ON public.swap_messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

-- Swap reviews
CREATE TABLE public.swap_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.swap_proposals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, reviewer_id)
);

ALTER TABLE public.swap_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.swap_reviews FOR SELECT USING (true);
CREATE POLICY "Participants can create reviews" ON public.swap_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Saved/wishlisted swap listings
CREATE TABLE public.swap_saved (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.swap_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.swap_saved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved" ON public.swap_saved FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save listings" ON public.swap_saved FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave listings" ON public.swap_saved FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for swap images
INSERT INTO storage.buckets (id, name, public) VALUES ('swap-images', 'swap-images', true);

CREATE POLICY "Swap images publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'swap-images');
CREATE POLICY "Auth users can upload swap images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'swap-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users can update own swap images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'swap-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users can delete own swap images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'swap-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for proposals and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_messages;
