import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { fetchSwapListingById, fetchUserSwapListings, createSwapProposal, toggleSaveSwap } from '@/lib/swapQueries';
import { formatPrice } from '@/lib/formatPrice';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowRightLeft, Heart, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const conditionLabels: Record<string, string> = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };

const SwapDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [cashTopup, setCashTopup] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['swapListing', id],
    queryFn: () => fetchSwapListingById(id!),
    enabled: !!id,
  });

  const { data: myListings } = useQuery({
    queryKey: ['mySwapListings', user?.id],
    queryFn: () => fetchUserSwapListings(user!.id),
    enabled: !!user && proposalOpen,
  });

  const proposalMutation = useMutation({
    mutationFn: () => createSwapProposal({
      listing_id: id!,
      offered_listing_id: selectedOffer || undefined,
      cash_topup_amount: cashTopup ? parseFloat(cashTopup) : undefined,
      message: proposalMessage || undefined,
    }),
    onSuccess: () => {
      toast.success('Proposal sent!');
      setProposalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['swapListing', id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSave = async () => {
    if (!user) { navigate('/auth'); return; }
    const saved = await toggleSaveSwap(id!);
    setIsSaved(saved);
    toast.success(saved ? 'Saved to wishlist' : 'Removed from wishlist');
  };

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-20 text-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div></Layout>;
  if (!listing) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Listing not found</div></Layout>;

  const images = listing.swap_listing_images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const isOwner = user?.id === listing.user_id;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/swap" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/20 relative">
              {images.length > 0 ? (
                <>
                  <img src={images[currentImage]?.url} alt={listing.title} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImage(i => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center" disabled={currentImage === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={() => setCurrentImage(i => Math.min(images.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center" disabled={currentImage === images.length - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No photos</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setCurrentImage(i)} className={`h-16 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === currentImage ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2 capitalize">{conditionLabels[listing.condition]}</Badge>
              <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
              <p className="text-3xl font-bold text-primary mt-2">{formatPrice(listing.estimated_value)}</p>
            </div>

            {/* Specs */}
            <div className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-medium text-sm text-foreground">Device Specs</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {listing.brand && <div><span className="text-muted-foreground">Brand:</span> {listing.brand}</div>}
                {listing.model && <div><span className="text-muted-foreground">Model:</span> {listing.model}</div>}
                {listing.storage_specs && <div><span className="text-muted-foreground">Storage/Specs:</span> {listing.storage_specs}</div>}
                {listing.year_purchased && <div><span className="text-muted-foreground">Year:</span> {listing.year_purchased}</div>}
                <div><span className="text-muted-foreground">Category:</span> <span className="capitalize">{listing.category}</span></div>
                <div><span className="text-muted-foreground">Swap Type:</span> {listing.swap_type.replace(/_/g, ' ')}</div>
              </div>
            </div>

            {listing.description && (
              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Owner Profile */}
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {listing.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{listing.profiles?.full_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {listing.location_city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location_city}</span>}
                    <span className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" />{(listing as any).owner_stats?.completed_swaps || 0} swaps</span>
                    {(listing as any).owner_stats?.avg_rating > 0 && (
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{(listing as any).owner_stats.avg_rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desired items */}
            {listing.desired_items && listing.desired_items.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-foreground mb-2">What I'm Looking For</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.desired_items.map((item, i) => <Badge key={i} variant="outline">{item}</Badge>)}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isOwner && (
              <div className="flex gap-3">
                <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 rounded-full gap-2" onClick={() => !user && navigate('/auth')}>
                      <ArrowRightLeft className="h-4 w-4" /> Propose a Swap
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Propose a Swap</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label>Select your gadget to offer</Label>
                        {myListings && myListings.filter(l => l.status === 'active').length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
                            {myListings.filter(l => l.status === 'active').map(l => (
                              <button
                                key={l.id}
                                onClick={() => setSelectedOffer(selectedOffer === l.id ? null : l.id)}
                                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedOffer === l.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                              >
                                <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                                  {l.swap_listing_images?.[0] && <img src={l.swap_listing_images[0].url} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{l.title}</p>
                                  <p className="text-xs text-muted-foreground">{formatPrice(l.estimated_value)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground mt-2">
                            No listings yet.{' '}
                            <Link to="/swap/list" className="text-primary">List a gadget first</Link>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Cash top-up (₦, optional)</Label>
                        <Input type="number" value={cashTopup} onChange={e => setCashTopup(e.target.value)} placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <Label>Message to owner</Label>
                        <Textarea value={proposalMessage} onChange={e => setProposalMessage(e.target.value)} placeholder="Hi, I'd like to swap..." className="mt-1" rows={3} />
                      </div>
                      <Button
                        onClick={() => proposalMutation.mutate()}
                        disabled={proposalMutation.isPending || (!selectedOffer && !cashTopup)}
                        className="w-full rounded-full"
                      >
                        {proposalMutation.isPending ? 'Sending...' : 'Send Proposal'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="rounded-full" onClick={handleSave}>
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SwapDetail;
