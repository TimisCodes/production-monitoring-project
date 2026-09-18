import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { createSwapListing, uploadSwapImage, addSwapImage } from '@/lib/swapQueries';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, Check, ArrowLeft, ArrowRight } from 'lucide-react';

const CATEGORIES = ['phones', 'laptops', 'tablets', 'consoles', 'cameras', 'wearables', 'accessories'];
const CONDITIONS = [
  { value: 'new', label: 'New', desc: 'Unused, sealed or opened but never used' },
  { value: 'like_new', label: 'Like New', desc: 'Minimal signs of use, fully functional' },
  { value: 'good', label: 'Good', desc: 'Normal wear, fully functional' },
  { value: 'fair', label: 'Fair', desc: 'Visible wear, works but may have cosmetic issues' },
];

const SwapListGadget = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('phones');
  const [condition, setCondition] = useState('good');
  const [yearPurchased, setYearPurchased] = useState('');
  const [storageSpecs, setStorageSpecs] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Step 3
  const [desiredItems, setDesiredItems] = useState<string[]>([]);
  const [desiredInput, setDesiredInput] = useState('');
  const [openToCash, setOpenToCash] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [openToPartial, setOpenToPartial] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [swapType, setSwapType] = useState('swap_only');

  // Step 4
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [locationCity, setLocationCity] = useState('');

  const handlePhotoAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 6) {
      toast.error('Maximum 6 photos allowed');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addDesiredItem = useCallback(() => {
    const item = desiredInput.trim();
    if (item && !desiredItems.includes(item)) {
      setDesiredItems(prev => [...prev, item]);
      setDesiredInput('');
    }
  }, [desiredInput, desiredItems]);

  const mutation = useMutation({
    mutationFn: async () => {
      const listing = await createSwapListing({
        title,
        brand: brand || undefined,
        model: model || undefined,
        category,
        condition,
        year_purchased: yearPurchased ? parseInt(yearPurchased) : undefined,
        storage_specs: storageSpecs || undefined,
        description: description || undefined,
        estimated_value: parseFloat(estimatedValue) || 0,
        swap_type: swapType,
        open_to_cash_topup: openToCash,
        cash_topup_amount: openToCash ? parseFloat(cashAmount) || 0 : 0,
        open_to_partial_trade: openToPartial,
        desired_items: desiredItems,
        location_city: locationCity || undefined,
      });

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadSwapImage(photos[i], listing.id);
        await addSwapImage(listing.id, url, i === 0, i);
      }

      return listing;
    },
    onSuccess: () => {
      toast.success('Listing posted successfully!');
      navigate('/swap/dashboard');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create listing'),
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  const canProceed = () => {
    switch (step) {
      case 1: return title.trim().length > 0;
      case 2: return true; // photos optional
      case 3: return parseFloat(estimatedValue) > 0;
      case 4: return agreedToTerms;
      default: return false;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">List a Gadget for Swap</h1>
        <p className="text-muted-foreground text-sm mb-6">Fill in the details to post your gadget.</p>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            {['Device Details', 'Photos', 'Swap Preferences', 'Confirm'].map((label, i) => (
              <span key={i} className={step > i ? 'text-primary font-medium' : step === i + 1 ? 'text-foreground font-medium' : ''}>
                {label}
              </span>
            ))}
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Device Name *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 14 Pro Max 256GB" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Brand</Label><Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Apple" className="mt-1" /></div>
              <div><Label>Model</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. A2894" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Year Purchased</Label><Input type="number" value={yearPurchased} onChange={e => setYearPurchased(e.target.value)} placeholder="2023" className="mt-1" /></div>
            </div>
            <div><Label>Storage / Specs</Label><Input value={storageSpecs} onChange={e => setStorageSpecs(e.target.value)} placeholder="256GB, 6GB RAM" className="mt-1" /></div>
            <div>
              <Label>Condition *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCondition(c.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${condition === c.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <p className="font-medium text-sm text-foreground">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your gadget..." className="mt-1" rows={3} /></div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <Label>Photos (up to 6) — first photo becomes thumbnail</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && <Badge className="absolute bottom-1 left-1 text-[9px]">Cover</Badge>}
                </div>
              ))}
              {photos.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>What would you like in return?</Label>
              <div className="flex gap-2 mt-1">
                <Input value={desiredInput} onChange={e => setDesiredInput(e.target.value)} placeholder="e.g. iPhone 15, Gaming Laptop" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDesiredItem())} />
                <Button type="button" onClick={addDesiredItem} variant="outline" size="sm">Add</Button>
              </div>
              {desiredItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {desiredItems.map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {item}
                      <button onClick={() => setDesiredItems(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Estimated Device Value (₦) *</Label>
              <Input type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="150000" className="mt-1" />
            </div>
            <div>
              <Label>Swap Type</Label>
              <Select value={swapType} onValueChange={setSwapType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="swap_only">Swap Only</SelectItem>
                  <SelectItem value="swap_and_cash">Swap + Cash</SelectItem>
                  <SelectItem value="will_also_sell">Will Also Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Open to cash top-up?</Label>
              <Switch checked={openToCash} onCheckedChange={setOpenToCash} />
            </div>
            {openToCash && (
              <div>
                <Label>Cash top-up amount (₦)</Label>
                <Input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="20000" className="mt-1" />
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <Label>Open to partial trade?</Label>
              <Switch checked={openToPartial} onCheckedChange={setOpenToPartial} />
            </div>
            <div>
              <Label>Your City / Location</Label>
              <Input value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="e.g. Lagos" className="mt-1" />
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Review Your Listing</h2>
            <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center gap-3">
                {photoPreviews[0] && <img src={photoPreviews[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{brand} {model}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Category:</span> <span className="capitalize">{category}</span></div>
                <div><span className="text-muted-foreground">Condition:</span> <span className="capitalize">{condition.replace('_', ' ')}</span></div>
                <div><span className="text-muted-foreground">Value:</span> ₦{parseFloat(estimatedValue || '0').toLocaleString()}</div>
                <div><span className="text-muted-foreground">Swap Type:</span> {swapType.replace(/_/g, ' ')}</div>
                {locationCity && <div><span className="text-muted-foreground">Location:</span> {locationCity}</div>}
                <div><span className="text-muted-foreground">Photos:</span> {photos.length}</div>
              </div>
              {desiredItems.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Looking for:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {desiredItems.map((item, i) => <Badge key={i} variant="outline" className="text-xs">{item}</Badge>)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(!!c)} id="terms" />
              <label htmlFor="terms" className="text-sm text-muted-foreground">I agree to the swap terms and confirm the information is accurate.</label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => step === 1 ? navigate('/swap') : setStep(s => s - 1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? 'Back to Marketplace' : 'Previous'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => mutation.mutate()} disabled={!canProceed() || mutation.isPending} className="gap-2">
              {mutation.isPending ? 'Posting...' : <><Check className="h-4 w-4" /> Post Listing</>}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SwapListGadget;
