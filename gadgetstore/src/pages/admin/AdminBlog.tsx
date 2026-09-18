import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllBlogPosts } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminBlog = () => {
  const queryClient = useQueryClient();
  const { data: posts } = useQuery({ queryKey: ['admin-blog'], queryFn: fetchAllBlogPosts });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', thumbnail_url: '', author_name: 'Admin', is_published: false,
  });

  const resetForm = useCallback(() => {
    setForm({ title: '', slug: '', excerpt: '', content: '', thumbnail_url: '', author_name: 'Admin', is_published: false });
    setEditingId(null);
  }, []);

  const openEdit = useCallback((post: any) => {
    setEditingId(post.id);
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content,
      thumbnail_url: post.thumbnail_url || '', author_name: post.author_name, is_published: post.is_published,
    });
    setDialogOpen(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        thumbnail_url: form.thumbnail_url.trim() || null,
        author_name: form.author_name.trim() || 'Admin',
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
      };
      if (editingId) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingId ? 'Post updated!' : 'Post created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Blog Posts</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="font-display"><Plus className="h-4 w-4 mr-2" /> New Post</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={200} /></div>
              <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1 bg-secondary border-border" maxLength={200} /></div>
              <div><Label className="text-xs">Excerpt</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={500} /></div>
              <div><Label className="text-xs">Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 bg-secondary border-border min-h-[150px]" /></div>
              <div><Label className="text-xs">Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
              <div><Label className="text-xs">Author</Label><Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={100} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label className="text-xs">Published</Label></div>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.content || saveMutation.isPending} className="w-full font-display">
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="gradient-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Title</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts?.map((post) => (
                <tr key={post.id}>
                  <td className="p-3 text-foreground font-medium">{post.title}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${post.is_published ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{format(new Date(post.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {(!posts || posts.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No posts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;
