import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProducts, fetchCategories } from '@/lib/queries';
import { formatPrice } from '@/lib/formatPrice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, X, Star, ImageIcon, RefreshCw } from 'lucide-react';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => fetchProducts() });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [replacingCoverId, setReplacingCoverId] = useState<string | null>(null);

  // Refs to avoid stale closures in mutations
  const editingIdRef = useRef<string | null>(null);
  const pendingFilesRef = useRef<File[]>([]);
  const productImagesRef = useRef<any[]>([]);
  editingIdRef.current = editingId;
  pendingFilesRef.current = pendingFiles;
  productImagesRef.current = productImages;

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', sale_price: '', brand: '', stock: '0',
    category_id: '', is_featured: false, is_on_sale: false,
  });

  const resetForm = useCallback(() => {
    setForm({ name: '', slug: '', description: '', price: '', sale_price: '', brand: '', stock: '0', category_id: '', is_featured: false, is_on_sale: false });
    setEditingId(null);
    setProductImages([]);
    setPendingFiles([]);
    setReplacingCoverId(null);
  }, []);

  const openCreate = useCallback(() => { resetForm(); setDialogOpen(true); }, [resetForm]);

  const openEdit = useCallback((product: any) => {
    setEditingId(product.id);
    setPendingFiles([]);
    setReplacingCoverId(null);
    setForm({
      name: product.name, slug: product.slug, description: product.description || '',
      price: String(product.price), sale_price: product.sale_price ? String(product.sale_price) : '',
      brand: product.brand || '', stock: String(product.stock),
      category_id: product.category_id || '', is_featured: product.is_featured, is_on_sale: product.is_on_sale,
    });
    const imgs = product.product_images?.map((img: any) => ({
      id: img.id, url: img.url, is_primary: img.is_primary, sort_order: img.sort_order, alt_text: img.alt_text,
    })) || [];
    setProductImages(imgs.sort((a: any, b: any) => a.sort_order - b.sort_order));
    setDialogOpen(true);
  }, []);

  const uploadImagesToProduct = useCallback(async (productId: string, files: File[], existingCount: number) => {
    if (!productId || productId === 'undefined') {
      toast.error('Cannot upload: invalid product ID');
      return [];
    }
    const uploaded: any[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) { toast.error(uploadError.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      const isPrimary = existingCount === 0 && uploaded.length === 0;
      const { data, error } = await supabase.from('product_images').insert({
        product_id: productId, url: publicUrl, is_primary: isPrimary, sort_order: existingCount + uploaded.length,
      }).select().single();
      if (error) { toast.error(error.message); continue; }
      uploaded.push(data);
    }
    return uploaded;
  }, []);

  const replaceCoverImage = useCallback(async (imageId: string, file: File) => {
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId || currentEditingId === 'undefined') {
      toast.error('Cannot replace image: no valid product selected');
      return;
    }

    setUploading(true);
    try {
      const oldImg = productImagesRef.current.find(img => img.id === imageId);

      const ext = file.name.split('.').pop();
      const path = `${currentEditingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);

      const { error } = await supabase.from('product_images').update({ url: publicUrl }).eq('id', imageId);
      if (error) { toast.error(error.message); return; }

      // Delete old file from storage
      if (oldImg?.url) {
        const oldPath = oldImg.url.split('/product-images/')[1];
        if (oldPath) {
          await supabase.storage.from('product-images').remove([decodeURIComponent(oldPath)]);
        }
      }

      setProductImages(prev => prev.map(img => img.id === imageId ? { ...img, url: publicUrl + '?t=' + Date.now() } : img));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Image replaced successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to replace image');
    } finally {
      setUploading(false);
      setReplacingCoverId(null);
    }
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentEditingId = editingIdRef.current;
      const currentPendingFiles = pendingFilesRef.current;
      const currentImageCount = productImagesRef.current.length;

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description.trim() || null,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        brand: form.brand.trim() || null,
        stock: Number(form.stock),
        category_id: form.category_id || null,
        is_featured: form.is_featured,
        is_on_sale: form.is_on_sale,
      };

      let productId = currentEditingId;

      if (currentEditingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', currentEditingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        if (!data?.id) throw new Error('Failed to create product — no ID returned');
        productId = data.id;
      }

      // Upload pending files
      if (currentPendingFiles.length > 0 && productId) {
        setUploading(true);
        try {
          await uploadImagesToProduct(productId, currentPendingFiles, currentImageCount);
        } finally {
          setUploading(false);
        }
      }

      return { isNew: !currentEditingId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      resetForm();
      toast.success(result?.isNew === false ? 'Product updated!' : 'Product created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const uploadImages = useCallback(async (files: File[]) => {
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId) {
      setPendingFiles(prev => [...prev, ...files]);
      toast.info(`${files.length} image(s) queued — they'll be uploaded when you save.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadImagesToProduct(currentEditingId, files, productImagesRef.current.length);
      setProductImages(prev => [...prev, ...uploaded]);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Images uploaded!');
    } finally {
      setUploading(false);
    }
  }, [queryClient, uploadImagesToProduct]);

  const deleteImage = useCallback(async (imageId: string, imageUrl: string) => {
    const urlParts = imageUrl.split('/product-images/');
    const storagePath = urlParts[1];
    if (storagePath) {
      await supabase.storage.from('product-images').remove([storagePath]);
    }
    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) { toast.error(error.message); return; }
    setProductImages(prev => prev.filter(img => img.id !== imageId));
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success('Image deleted');
  }, [queryClient]);

  const setAsCover = useCallback(async (imageId: string) => {
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId) return;
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', currentEditingId);
    const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);
    if (error) { toast.error(error.message); return; }
    setProductImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })));
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success('Cover image updated');
  }, [queryClient]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) uploadImages(files);
  }, [uploadImages]);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="font-display"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={200} /></div>
              <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1 bg-secondary border-border" maxLength={200} /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={5000} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Price (₦)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
                <div><Label className="text-xs">Sale Price (₦)</Label><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1 bg-secondary border-border" maxLength={100} /></div>
                <div><Label className="text-xs">Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 bg-secondary border-border" /></div>
              </div>
              {categories && (
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category_id || 'none'} onValueChange={(v) => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label className="text-xs">Featured</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_on_sale} onCheckedChange={(v) => setForm({ ...form, is_on_sale: v })} /><Label className="text-xs">On Sale</Label></div>
              </div>

              {/* Image Management */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Product Images</Label>
                
                {/* Existing images grid (only for editing) */}
                {productImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {productImages.map((img) => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {img.is_primary && (
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">Cover</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {!img.is_primary && (
                            <button onClick={() => setAsCover(img.id)} className="p-1.5 bg-primary rounded text-primary-foreground" title="Set as cover">
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReplacingCoverId(img.id);
                              coverInputRef.current?.click();
                            }}
                            className="p-1.5 bg-accent rounded text-accent-foreground"
                            title="Replace image"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                          <button onClick={() => deleteImage(img.id, img.url)} className="p-1.5 bg-destructive rounded text-destructive-foreground" title="Delete">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden input for replacing a specific image */}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && replacingCoverId) {
                      replaceCoverImage(replacingCoverId, file);
                    }
                    e.target.value = '';
                  }}
                />

                {/* Pending files preview (for new products) */}
                {pendingFiles.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Queued for upload ({pendingFiles.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {pendingFiles.map((file, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-dashed border-primary/50 aspect-square bg-primary/5">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover opacity-75" />
                          <button onClick={() => removePendingFile(idx)} className="absolute top-1 right-1 p-1 bg-destructive rounded text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag-and-drop upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploading ? 'Uploading...' : editingId ? 'Drag & drop images or click to browse' : 'Add images (uploaded on save)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) uploadImages(files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price || saveMutation.isPending || uploading} className="w-full font-display">
                {saveMutation.isPending || uploading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Product</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Price</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Stock</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products?.map((p) => {
                const img = p.product_images?.find((i: any) => i.is_primary) || p.product_images?.[0];
                return (
                  <tr key={p.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-secondary/50 overflow-hidden shrink-0">
                          {(img as any)?.url ? <img src={(img as any).url} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-foreground">
                      {formatPrice(Number(p.price))}
                      {p.sale_price && <span className="text-xs text-primary ml-1">({formatPrice(Number(p.sale_price))})</span>}
                    </td>
                    <td className="p-3 text-foreground">{p.stock}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {p.is_featured && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">Featured</span>}
                        {p.is_on_sale && <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Sale</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!products || products.length === 0) && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
