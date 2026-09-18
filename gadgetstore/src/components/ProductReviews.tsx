import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
        reviewer_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setReviewText('');
      setRating(5);
      toast.success('Review submitted!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const userHasReviewed = reviews?.some((r) => r.user_id === user?.id);

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Reviews</h3>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-warning fill-warning' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Write a review */}
      {user ? (
        !userHasReviewed ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
            <h4 className="font-medium text-foreground text-sm mb-4">Write a Review</h4>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || rating) ? 'text-warning fill-warning' : 'text-border'}`} />
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">{rating} / 5</span>
            </div>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              className="mb-4 bg-background border-border rounded-xl resize-none"
              rows={3}
              maxLength={1000}
            />
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="rounded-full px-6 text-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">You've already reviewed this product.</p>
        )
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8 text-center">
          <p className="text-muted-foreground text-sm">
            <a href="/auth" className="text-primary hover:underline font-medium">Sign in</a> to leave a review.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-card rounded-2xl border border-border/50 p-5">
              <div className="h-3 bg-secondary rounded w-24 mb-2" />
              <div className="h-3 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-2xl border border-border/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{review.reviewer_name}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-warning fill-warning' : 'text-border'}`} />
                    ))}
                  </div>
                </div>
                {user?.id === review.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(review.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {review.review_text && (
                <p className="text-muted-foreground text-sm leading-relaxed">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
