import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import {
  fetchUserSwapListings, fetchIncomingProposals, fetchOutgoingProposals,
  fetchSavedSwaps, updateSwapListing, deleteSwapListing, updateProposalStatus,
} from '@/lib/swapQueries';
import { formatPrice } from '@/lib/formatPrice';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Check, X, ArrowRightLeft, Eye, Heart } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  swapped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const SwapDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('listings');

  const { data: myListings = [] } = useQuery({
    queryKey: ['mySwapListings', user?.id],
    queryFn: () => fetchUserSwapListings(user!.id),
    enabled: !!user,
  });

  const { data: incoming = [] } = useQuery({
    queryKey: ['incomingProposals', user?.id],
    queryFn: () => fetchIncomingProposals(user!.id),
    enabled: !!user,
  });

  const { data: outgoing = [] } = useQuery({
    queryKey: ['outgoingProposals', user?.id],
    queryFn: () => fetchOutgoingProposals(user!.id),
    enabled: !!user,
  });

  const { data: saved = [] } = useQuery({
    queryKey: ['savedSwaps', user?.id],
    queryFn: () => fetchSavedSwaps(user!.id),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSwapListing,
    onSuccess: () => {
      toast.success('Listing deleted');
      queryClient.invalidateQueries({ queryKey: ['mySwapListings'] });
    },
  });

  const markSwapped = useMutation({
    mutationFn: (id: string) => updateSwapListing(id, { status: 'swapped' } as any),
    onSuccess: () => {
      toast.success('Marked as swapped');
      queryClient.invalidateQueries({ queryKey: ['mySwapListings'] });
    },
  });

  const proposalAction = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateProposalStatus(id, status),
    onSuccess: () => {
      toast.success('Proposal updated');
      queryClient.invalidateQueries({ queryKey: ['incomingProposals'] });
      queryClient.invalidateQueries({ queryKey: ['outgoingProposals'] });
    },
  });

  if (!user) { navigate('/auth'); return null; }

  const getImg = (listing: any) => {
    const imgs = listing?.swap_listing_images;
    if (!imgs || imgs.length === 0) return '/placeholder.svg';
    return imgs.find((i: any) => i.is_primary)?.url || imgs[0]?.url || '/placeholder.svg';
  };

  const pendingIncoming = incoming.filter(p => p.status === 'pending').length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Swap Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your swap listings and proposals</p>
          </div>
          <Link to="/swap/list">
            <Button className="rounded-full gap-2"><Plus className="h-4 w-4" /> New Listing</Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="listings">My Listings ({myListings.length})</TabsTrigger>
            <TabsTrigger value="incoming" className="relative">
              Incoming {pendingIncoming > 0 && <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] inline-flex items-center justify-center">{pendingIncoming}</span>}
            </TabsTrigger>
            <TabsTrigger value="outgoing">My Proposals ({outgoing.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
          </TabsList>

          {/* My Listings */}
          <TabsContent value="listings" className="mt-4">
            {myListings.length === 0 ? (
              <div className="text-center py-16">
                <ArrowRightLeft className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-3">No listings yet</p>
                <Link to="/swap/list"><Button className="rounded-full gap-2"><Plus className="h-4 w-4" /> List your first gadget</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map(listing => (
                  <div key={listing.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <img src={getImg(listing)} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(listing.estimated_value)}</p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${statusColors[listing.status]}`}>{listing.status}</Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/swap/${listing.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button></Link>
                      {listing.status === 'active' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markSwapped.mutate(listing.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(listing.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Incoming Proposals */}
          <TabsContent value="incoming" className="mt-4">
            {incoming.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No proposals received yet</div>
            ) : (
              <div className="space-y-3">
                {incoming.map(proposal => (
                  <div key={proposal.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-[10px] ${statusColors[proposal.status]}`}>{proposal.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                    {proposal.message && <p className="text-sm text-foreground">"{proposal.message}"</p>}
                    {(proposal.cash_topup_amount ?? 0) > 0 && (
                      <p className="text-sm text-muted-foreground">Cash top-up offered: {formatPrice(proposal.cash_topup_amount!)}</p>
                    )}
                    {proposal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-full gap-1" onClick={() => proposalAction.mutate({ id: proposal.id, status: 'accepted' })}>
                          <Check className="h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={() => proposalAction.mutate({ id: proposal.id, status: 'declined' })}>
                          <X className="h-3 w-3" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Proposals */}
          <TabsContent value="outgoing" className="mt-4">
            {outgoing.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No proposals sent yet</div>
            ) : (
              <div className="space-y-3">
                {outgoing.map(proposal => (
                  <div key={proposal.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-[10px] ${statusColors[proposal.status]}`}>{proposal.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                    {proposal.message && <p className="text-sm text-muted-foreground mt-2">"{proposal.message}"</p>}
                    <Link to={`/swap/${proposal.listing_id}`}>
                      <Button variant="link" size="sm" className="px-0 text-xs">View listing →</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed" className="mt-4">
            {(() => {
              const completed = [...incoming, ...outgoing].filter(p => p.status === 'completed');
              return completed.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">No completed swaps yet</div>
              ) : (
                <div className="space-y-3">
                  {completed.map(p => (
                    <div key={p.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                      <Badge className={`text-[10px] ${statusColors.completed}`}>Completed</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* Saved */}
          <TabsContent value="saved" className="mt-4">
            {saved.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                No saved listings
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.map((s: any) => {
                  const listing = s.swap_listings;
                  if (!listing) return null;
                  return (
                    <Link key={s.id} to={`/swap/${listing.id}`}>
                      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all">
                        <div className="aspect-video overflow-hidden bg-secondary/20">
                          <img src={listing.swap_listing_images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-sm text-foreground truncate">{listing.title}</p>
                          <p className="text-sm text-primary font-bold">{formatPrice(listing.estimated_value)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SwapDashboard;
