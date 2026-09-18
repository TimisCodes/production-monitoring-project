import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const ReferAndEarn = () => {
  const { user } = useAuthStore();
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState({ count: 0, rewards: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('referral_code').eq('user_id', user.id).maybeSingle();
      if (profile?.referral_code) setCode(profile.referral_code);
      const { data: refs } = await supabase.from('referrals').select('reward_amount').eq('referrer_id', user.id);
      if (refs) setStats({
        count: refs.length,
        rewards: refs.reduce((s, r: any) => s + Number(r.reward_amount || 0), 0),
      });
    })();
  }, [user]);

  const link = `${window.location.origin}/auth?ref=${code}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join TechVault', text: `Use my code ${code} to sign up`, url: link });
      } catch {}
    } else copy(link);
  };

  if (!code) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Refer & Earn</h3>
          <p className="text-xs text-muted-foreground">Earn ₦5,000 for every friend who completes a sale</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-foreground">{stats.count}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Friends referred</div>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-foreground">₦{stats.rewards.toLocaleString('en-NG')}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Rewards earned</div>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Your referral code</label>
        <div className="flex gap-2 mt-1.5">
          <Input readOnly value={code} className="font-mono font-semibold rounded-xl bg-background" />
          <Button variant="outline" size="icon" onClick={() => copy(code)} className="rounded-xl shrink-0"><Copy className="h-4 w-4" /></Button>
          <Button size="icon" onClick={share} className="rounded-xl shrink-0"><Share2 className="h-4 w-4" /></Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 break-all">Share link: {link}</p>
      </div>
    </div>
  );
};

export default ReferAndEarn;