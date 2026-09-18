import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { fetchBlogPosts } from '@/lib/queries';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">Reviews, tips, and tech insights</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 animate-pulse">
                <div className="aspect-video bg-secondary rounded-t-2xl" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-20 text-sm">No blog posts yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden card-hover">
                  {post.thumbnail_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category_tag && (
                      <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{post.category_tag}</span>
                    )}
                    <h3 className="font-medium text-foreground mt-1.5 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.published_at && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                      )}
                      {post.read_time_minutes && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time_minutes} min</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
