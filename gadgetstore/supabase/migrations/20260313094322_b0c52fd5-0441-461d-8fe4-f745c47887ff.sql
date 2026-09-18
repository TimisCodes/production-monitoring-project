-- Add payment_reference column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text;

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
