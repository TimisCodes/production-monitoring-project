import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Smartphone, ChevronLeft, ChevronRight, Upload, X, CheckCircle2, Sparkles } from 'lucide-react';

type Condition = 'excellent' | 'good' | 'fair' | 'poor';

const DEVICE_TYPES = ['iPhone', 'Samsung', 'Google Pixel', 'iPad', 'MacBook', 'Other'];
const CARRIERS = ['Unlocked', 'AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'MTN', 'Glo', 'Airtel', '9mobile', 'Other'];
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const BATTERY_RANGES = ['100% – 90%', '89% – 80%', '79% – 60%', 'Below 60%'];

const CONDITION_INFO: { value: Condition; label: string; desc: string }[] = [
  { value: 'excellent', label: 'Excellent', desc: 'Like new, no scratches or marks' },
  { value: 'good', label: 'Good', desc: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', desc: 'Visible scratches, works perfectly' },
  { value: 'poor', label: 'Poor', desc: 'Heavy wear or minor functional issues' },
];

const SellDevice = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [form, setForm] = useState({
    number_of_devices: 1,
    device_type: '',
    model: '',
    carrier: '',
    storage_size: '',
    battery_health: '',
    condition: 'good' as Condition,
    broken_screen: false,
    screen_replaced: false,
    battery_replaced: false,
    casing_changed: false,
    snapchat_banned: false,
    face_id_working: true,
    touch_id_working: true,
    contact_name: '',
    contact_phone: '',
    contact_email: user?.email || '',
    notes: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (files.length + list.length > 8) {
      toast.error('Max 8 photos');
      return;
    }
    setFiles((p) => [...p, ...list]);
  };

  const calcEstimate = useCallback(() => {
    // Heuristic estimate (NGN) — admin will quote final
    let base = 100000;
    const m = form.model.toLowerCase();
    if (m.includes('pro max')) base = 700000;
    else if (m.includes('pro')) base = 550000;
    else if (m.includes('plus') || m.includes('ultra')) base = 500000;
    else if (m.includes('mini')) base = 350000;
    else if (form.device_type === 'iPhone') base = 400000;
    else if (form.device_type === 'MacBook') base = 800000;
    else if (form.device_type === 'iPad') base = 350000;
    else if (form.device_type === 'Samsung') base = 350000;

    // Storage modifier
    const storageMul: Record<string, number> = { '64GB': 0.85, '128GB': 1, '256GB': 1.15, '512GB': 1.3, '1TB': 1.5, '2TB': 1.75 };
    base *= storageMul[form.storage_size] || 1;

    // Condition
    const condMul: Record<Condition, number> = { excellent: 1.1, good: 1, fair: 0.8, poor: 0.55 };
    base *= condMul[form.condition];

    // Battery
    if (form.battery_health.includes('100')) base *= 1.05;
    else if (form.battery_health.includes('Below')) base *= 0.7;
    else if (form.battery_health.includes('79')) base *= 0.9;

    if (form.broken_screen) base *= 0.5;
    if (form.screen_replaced) base *= 0.85;
    if (form.battery_replaced) base *= 0.92;
    if (form.casing_changed) base *= 0.9;
    if (form.snapchat_banned) base *= 0.85;
    if (!form.face_id_working) base *= 0.85;
    if (!form.touch_id_working) base *= 0.92;

    base *= form.number_of_devices;
    return Math.max(20000, Math.round(base / 1000) * 1000);
  }, [form]);

  const next = () => {
    if (step === 1 && (!form.device_type || !form.model.trim())) return toast.error('Select device type and enter model');
    if (step === 2 && (!form.carrier || !form.storage_size || !form.battery_health)) return toast.error('Complete all fields');
    setStep((s) => Math.min(totalSteps, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit');
      navigate('/auth');
      return;
    }
    if (!form.contact_name.trim() || !form.contact_phone.trim()) {
      toast.error('Please add your contact info');
      return;
    }
    setSubmitting(true);
    try {
      const est = calcEstimate();
      const { data: req, error } = await supabase
        .from('sell_requests')
        .insert({
          user_id: user.id,
          ...form,
          estimated_price: est,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Upload images
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${user.id}/${req.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage.from('sell-images').upload(path, f);
        if (upErr) { console.error(upErr); continue; }
        const { data: pub } = supabase.storage.from('sell-images').getPublicUrl(path);
        await supabase.from('sell_request_images').insert({ sell_request_id: req.id, url: pub.publicUrl, sort_order: i });
      }
      setEstimate(est);
      setSubmittedId(req.id);
    } catch (e: any) {
      toast.error(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Sell My Device</h1>
          <p className="text-muted-foreground text-sm mt-2">Get an instant price estimate. Fast, secure, and fair.</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5 min-h-[380px]">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-foreground">Device basics</h2>
              <div>
                <Label className="text-xs text-muted-foreground">Number of devices</Label>
                <Input type="number" min={1} max={50} value={form.number_of_devices}
                  onChange={(e) => update('number_of_devices', Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Device type</Label>
                <Select value={form.device_type} onValueChange={(v) => update('device_type', v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select device type" /></SelectTrigger>
                  <SelectContent>{DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input value={form.model} onChange={(e) => update('model', e.target.value)}
                  placeholder="e.g. iPhone 14 Pro Max" className="mt-1.5 rounded-xl" maxLength={120} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-foreground">Specs & carrier</h2>
              <div>
                <Label className="text-xs text-muted-foreground">Carrier</Label>
                <Select value={form.carrier} onValueChange={(v) => update('carrier', v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>{CARRIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Storage size</Label>
                <Select value={form.storage_size} onValueChange={(v) => update('storage_size', v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select storage" /></SelectTrigger>
                  <SelectContent>{STORAGE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Battery health</Label>
                <Select value={form.battery_health} onValueChange={(v) => update('battery_health', v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select battery range" /></SelectTrigger>
                  <SelectContent>{BATTERY_RANGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-foreground">Overall condition</h2>
              <div className="grid gap-2">
                {CONDITION_INFO.map((c) => (
                  <button type="button" key={c.value} onClick={() => update('condition', c.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${form.condition === c.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-sm">{c.label}</span>
                      {form.condition === c.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-semibold text-foreground">Condition checklist</h2>
              {([
                ['broken_screen', 'Broken screen?'],
                ['screen_replaced', 'Screen replaced/changed?'],
                ['battery_replaced', 'Battery replaced/changed?'],
                ['casing_changed', 'Casing/back changed?'],
                ['snapchat_banned', 'Snapchat banned?'],
                ['face_id_working', 'Face ID working?'],
                ['touch_id_working', 'Touch ID working?'],
              ] as const).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground">{label}</span>
                  <Switch checked={(form as any)[k]} onCheckedChange={(v) => update(k, v)} />
                </div>
              ))}
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="font-semibold text-foreground">Photos & contact</h2>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Upload device photos (max 8)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {files.length < 8 && (
                    <label className="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                    </label>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Your name</Label>
                  <Input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="mt-1.5 rounded-xl" maxLength={100} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} className="mt-1.5 rounded-xl" maxLength={20} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} className="mt-1.5 rounded-xl" maxLength={255} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="mt-1.5 rounded-xl" maxLength={1000} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-5">
          <Button variant="outline" disabled={step === 1} onClick={back} className="rounded-full"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
          {step < totalSteps ? (
            <Button onClick={next} className="rounded-full">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-full">
              <Sparkles className="h-4 w-4 mr-1.5" /> {submitting ? 'Submitting...' : 'Get Price Estimate'}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={!!submittedId} onOpenChange={() => { setSubmittedId(null); navigate('/profile'); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Your Estimated Price</DialogTitle></DialogHeader>
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-primary mb-1">₦{estimate?.toLocaleString('en-NG')}</div>
            <p className="text-xs text-muted-foreground">Estimated trade-in value</p>
            <p className="text-sm text-muted-foreground mt-4">
              Our team will review your submission and contact you within 24 hours with a final offer.
            </p>
            <Button onClick={() => { setSubmittedId(null); navigate('/profile'); }} className="mt-5 rounded-full">View My Submissions</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SellDevice;