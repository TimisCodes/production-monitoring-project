import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LoyaltyPoints from '@/components/LoyaltyPoints';
import ReferAndEarn from '@/components/ReferAndEarn';
import AvatarUploader from '@/components/AvatarUploader';

const Profile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState({ full_name: '', phone: '', address: '', city: '', country: '', avatar_url: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          avatar_url: data.avatar_url || '',
        });
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim() || null,
          phone: profile.phone.trim() || null,
          address: profile.address.trim() || null,
          city: profile.city.trim() || null,
          country: profile.country.trim() || null,
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <h1 className="text-3xl font-semibold text-foreground mb-8 tracking-tight">Profile</h1>
        
        <div className="space-y-6">
          <LoyaltyPoints />
          <ReferAndEarn />
          
          <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
            <div className="flex items-center gap-4 mb-2">
              {user && (
                <AvatarUploader
                  userId={user.id}
                  currentUrl={profile.avatar_url}
                  fullName={profile.full_name}
                  onUpdated={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
                />
              )}
              <div>
                <p className="font-medium text-foreground">{profile.full_name || 'User'}</p>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={20} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={500} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="mt-1.5 bg-background border-border rounded-xl" maxLength={100} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="rounded-full text-sm font-medium px-8">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
