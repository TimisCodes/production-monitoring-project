import { supabase } from '@/integrations/supabase/client';

export type SwapListing = {
  id: string;
  user_id: string;
  title: string;
  brand: string | null;
  model: string | null;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  year_purchased: number | null;
  storage_specs: string | null;
  description: string | null;
  estimated_value: number;
  swap_type: 'swap_only' | 'swap_and_cash' | 'will_also_sell';
  open_to_cash_topup: boolean;
  cash_topup_amount: number | null;
  open_to_partial_trade: boolean;
  desired_items: string[];
  location_city: string | null;
  status: 'active' | 'swapped' | 'archived' | 'expired';
  created_at: string;
  updated_at: string;
  swap_listing_images?: SwapImage[];
  profiles?: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
};

export type SwapImage = {
  id: string;
  listing_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
};

export type SwapProposal = {
  id: string;
  listing_id: string;
  proposer_id: string;
  offered_listing_id: string | null;
  cash_topup_amount: number | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  swap_listings?: SwapListing | null;
  offered_listing?: SwapListing | null;
  proposer_profile?: { full_name: string | null; avatar_url: string | null } | null;
};

export const fetchSwapListings = async (filters?: {
  category?: string;
  condition?: string;
  swapType?: string;
  minValue?: number;
  maxValue?: number;
  search?: string;
  city?: string;
}) => {
  let query = supabase
    .from('swap_listings')
    .select('*, swap_listing_images(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.condition) query = query.eq('condition', filters.condition as any);
  if (filters?.swapType) query = query.eq('swap_type', filters.swapType as any);
  if (filters?.minValue) query = query.gte('estimated_value', filters.minValue);
  if (filters?.maxValue) query = query.lte('estimated_value', filters.maxValue);
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
  if (filters?.city) query = query.ilike('location_city', `%${filters.city}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as SwapListing[];
};

export const fetchSwapListingById = async (id: string) => {
  const { data, error } = await supabase
    .from('swap_listings')
    .select('*, swap_listing_images(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  
  // Fetch owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, city')
    .eq('user_id', data.user_id)
    .maybeSingle();
  
  // Fetch swap review stats for the owner
  const { count: completedSwaps } = await supabase
    .from('swap_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewee_id', data.user_id);

  const { data: ratings } = await supabase
    .from('swap_reviews')
    .select('rating')
    .eq('reviewee_id', data.user_id);

  const avgRating = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return {
    ...data,
    profiles: profile,
    owner_stats: { completed_swaps: completedSwaps || 0, avg_rating: avgRating },
  } as SwapListing & { owner_stats: { completed_swaps: number; avg_rating: number } };
};

export const fetchUserSwapListings = async (userId: string) => {
  const { data, error } = await supabase
    .from('swap_listings')
    .select('*, swap_listing_images(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as SwapListing[];
};

export const createSwapListing = async (listing: {
  title: string;
  brand?: string;
  model?: string;
  category: string;
  condition: string;
  year_purchased?: number;
  storage_specs?: string;
  description?: string;
  estimated_value: number;
  swap_type: string;
  open_to_cash_topup: boolean;
  cash_topup_amount?: number;
  open_to_partial_trade: boolean;
  desired_items: string[];
  location_city?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('swap_listings')
    .insert({ ...listing, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSwapListing = async (id: string, updates: Partial<SwapListing>) => {
  const { data, error } = await supabase
    .from('swap_listings')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSwapListing = async (id: string) => {
  const { error } = await supabase.from('swap_listings').delete().eq('id', id);
  if (error) throw error;
};

export const uploadSwapImage = async (file: File, listingId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop();
  const path = `${user.id}/${listingId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('swap-images').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('swap-images').getPublicUrl(path);
  return publicUrl;
};

export const addSwapImage = async (listingId: string, url: string, isPrimary: boolean, sortOrder: number) => {
  const { error } = await supabase
    .from('swap_listing_images')
    .insert({ listing_id: listingId, url, is_primary: isPrimary, sort_order: sortOrder });
  if (error) throw error;
};

// Proposals
export const fetchIncomingProposals = async (userId: string) => {
  const { data: listings } = await supabase
    .from('swap_listings')
    .select('id')
    .eq('user_id', userId);
  
  if (!listings || listings.length === 0) return [];

  const listingIds = listings.map(l => l.id);
  const { data, error } = await supabase
    .from('swap_proposals')
    .select('*')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchOutgoingProposals = async (userId: string) => {
  const { data, error } = await supabase
    .from('swap_proposals')
    .select('*')
    .eq('proposer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createSwapProposal = async (proposal: {
  listing_id: string;
  offered_listing_id?: string;
  cash_topup_amount?: number;
  message?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('swap_proposals')
    .insert({ ...proposal, proposer_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProposalStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('swap_proposals')
    .update({ status } as any)
    .eq('id', id);
  if (error) throw error;
};

// Messages
export const fetchSwapMessages = async (proposalId: string) => {
  const { data, error } = await supabase
    .from('swap_messages')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const sendSwapMessage = async (proposalId: string, receiverId: string, message: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('swap_messages')
    .insert({ proposal_id: proposalId, sender_id: user.id, receiver_id: receiverId, message });
  if (error) throw error;
};

// Saved
export const fetchSavedSwaps = async (userId: string) => {
  const { data, error } = await supabase
    .from('swap_saved')
    .select('*, swap_listings(*, swap_listing_images(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const toggleSaveSwap = async (listingId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('swap_saved')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from('swap_saved').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('swap_saved').insert({ user_id: user.id, listing_id: listingId });
    return true;
  }
};

// Reviews
export const createSwapReview = async (proposalId: string, revieweeId: string, rating: number, reviewText?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('swap_reviews')
    .insert({ proposal_id: proposalId, reviewer_id: user.id, reviewee_id: revieweeId, rating, review_text: reviewText });
  if (error) throw error;
};

// Pending count for badge
export const fetchPendingSwapCount = async (userId: string) => {
  const { data: listings } = await supabase
    .from('swap_listings')
    .select('id')
    .eq('user_id', userId);

  if (!listings || listings.length === 0) return 0;

  const { count } = await supabase
    .from('swap_proposals')
    .select('*', { count: 'exact', head: true })
    .in('listing_id', listings.map(l => l.id))
    .eq('status', 'pending');

  return count || 0;
};
