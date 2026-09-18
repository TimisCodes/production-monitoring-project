
-- ===== Sell My Device =====
CREATE TYPE public.sell_request_status AS ENUM ('pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed');
CREATE TYPE public.device_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

CREATE TABLE public.sell_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  number_of_devices integer NOT NULL DEFAULT 1,
  device_type text NOT NULL,
  model text NOT NULL,
  carrier text,
  storage_size text,
  battery_health text,
  condition device_condition NOT NULL DEFAULT 'good',
  broken_screen boolean NOT NULL DEFAULT false,
  screen_replaced boolean NOT NULL DEFAULT false,
  battery_replaced boolean NOT NULL DEFAULT false,
  casing_changed boolean NOT NULL DEFAULT false,
  snapchat_banned boolean NOT NULL DEFAULT false,
  face_id_working boolean NOT NULL DEFAULT true,
  touch_id_working boolean NOT NULL DEFAULT true,
  estimated_price numeric NOT NULL DEFAULT 0,
  admin_quoted_price numeric,
  notes text,
  status sell_request_status NOT NULL DEFAULT 'pending',
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own sell requests" ON public.sell_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own sell requests" ON public.sell_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sell requests" ON public.sell_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sell requests" ON public.sell_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sell requests" ON public.sell_requests FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sell_requests_updated_at BEFORE UPDATE ON public.sell_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sell_request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_request_id uuid NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sell_request_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sell images viewable by owner or admin" ON public.sell_request_images FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.sell_requests sr WHERE sr.id = sell_request_id AND (sr.user_id = auth.uid() OR has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Owner can manage sell images" ON public.sell_request_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sell_requests sr WHERE sr.id = sell_request_id AND sr.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sell_requests sr WHERE sr.id = sell_request_id AND sr.user_id = auth.uid()));

-- ===== Referral system =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  reward_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$;

-- Update handle_new_user to assign referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code text;
  ref_code text;
  ref_user_id uuid;
BEGIN
  new_code := public.generate_referral_code();
  ref_code := NEW.raw_user_meta_data->>'referral_code';

  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    SELECT user_id INTO ref_user_id FROM public.profiles WHERE referral_code = upper(ref_code);
  END IF;

  INSERT INTO public.profiles (user_id, full_name, referral_code, referred_by)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_code, ref_user_id);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF ref_user_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code)
    VALUES (ref_user_id, NEW.id, upper(ref_code));
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill referral codes for existing users
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- ===== Storage buckets =====
INSERT INTO storage.buckets (id, name, public) VALUES ('sell-images', 'sell-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sell images public read" ON storage.objects FOR SELECT USING (bucket_id = 'sell-images');
CREATE POLICY "Authenticated upload sell images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sell-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update sell images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sell-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete sell images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sell-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
