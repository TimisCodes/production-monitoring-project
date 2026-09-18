import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Star } from 'lucide-react';

const fetchUserPoints = async (userId: string) => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('points, type')
    .eq('user_id', userId);
  if (error) throw error;
  const total = (data || []).reduce((sum, row) => {
    return sum + (row.type === 'earned' ? row.points : -row.points);
  }, 0);
  return Math.max(0, total);
};

const LoyaltyPoints = () => {
  const { user } = useAuthStore();
  const { data: points } = useQuery({
    queryKey: ['loyalty-points', user?.id],
    queryFn: () => fetchUserPoints(user!.id),
    enabled: !!user,
  });

  if (!user || points === undefined) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Loyalty Points</p>
          <p className="text-2xl font-semibold text-foreground">{points.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        Earn 1 point per ₦100 spent. Accumulate points for future rewards!
      </p>
    </div>
  );
};

export default LoyaltyPoints;
