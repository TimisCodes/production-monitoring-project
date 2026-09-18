import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuthStore();

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) { setReferralCode(ref.toUpperCase()); setIsLogin(false); }
  }, [params]);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      } else {
        if (!fullName.trim()) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), referral_code: referralCode.trim().toUpperCase() || null },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {isLogin ? 'Sign in to your TechVault account' : 'Join TechVault today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 bg-background border-border rounded-xl" maxLength={255} />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 bg-background border-border rounded-xl" maxLength={128} />
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="ref" className="text-xs text-muted-foreground">Referral code (optional)</Label>
                <Input id="ref" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="Enter referral code" className="mt-1.5 bg-background border-border rounded-xl uppercase" maxLength={20} />
              </div>
            )}
            <Button type="submit" className="w-full rounded-full text-sm font-medium" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
