import { supabase } from '@/integrations/supabase/client';

export const awardLoyaltyPoints = async (orderId: string, totalAmount: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const points = Math.floor(totalAmount / 100); // 1 point per ₦100
  if (points <= 0) return;

  await supabase.from('loyalty_points').insert({
    user_id: user.id,
    points,
    type: 'earned',
    description: `Purchase reward`,
    order_id: orderId,
  } as any);
};
