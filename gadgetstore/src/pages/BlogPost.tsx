import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { fetchBlogPostBySlug, fetchLatestBlogPosts } from '@/lib/queries';
import { format } from 'date-fns';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPostBySlug(slug!),
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['blog-posts-related', slug],
    queryFn: () => fetchLatestBlogPosts(4),
    enabled: !!slug,
  });

  const otherPosts = relatedPosts?.filter((p: any) => p.slug !== slug)?.slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-2xl animate-pulse">
          <div className="h-8 bg-secondary rounded w-3/4 mb-4" />
          <div className="h-4 bg-secondary rounded w-1/3 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-secondary rounded" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Post not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {post.thumbnail_url && (
        <div className="w-full h-56 md:h-80 overflow-hidden">
          <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="container mx-auto px-4 py-10 max-w-2xl">
        <Link to="/blog" className="text-primary text-sm hover:underline flex items-center gap-1.5 mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
        </Link>

        {(post as any).category_tag && (
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{(post as any).category_tag}</span>
        )}

        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 mt-2 tracking-tight leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10">
          <span>{post.author_name}</span>
          {post.published_at && (
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(post.published_at), 'MMMM d, yyyy')}</span>
          )}
          {(post as any).read_time_minutes && (
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{(post as any).read_time_minutes} min read</span>
          )}
        </div>

        <div className="prose max-w-none text-foreground/80 leading-[1.8] whitespace-pre-wrap text-base">
          {post.content}
        </div>
      </article>

      {otherPosts && otherPosts.length > 0 && (
        <section className="container mx-auto px-4 py-12 max-w-2xl border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">You might also like</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {otherPosts.map((p: any) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden card-hover">
                  {p.thumbnail_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPost;
