import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

const STATUSES = ['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed'];

const AdminSellRequests = () => {
  const [items, setItems] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [quote, setQuote] = useState('');

  const load = async () => {
    const { data, error } = await supabase
      .from('sell_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (item: any) => {
    setSelected(item);
    setQuote(item.admin_quoted_price ? String(item.admin_quoted_price) : '');
    const { data } = await supabase.from('sell_request_images').select('*').eq('sell_request_id', item.id).order('sort_order');
    setImages(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('sell_requests').update({ status: status as any }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveQuote = async () => {
    if (!selected) return;
    const val = parseFloat(quote);
    if (isNaN(val) || val < 0) return toast.error('Enter a valid price');
    const { error } = await supabase.from('sell_requests').update({ admin_quoted_price: val, status: 'quoted' as any }).eq('id', selected.id);
    if (error) return toast.error(error.message);
    toast.success('Quote saved');
    load();
    setSelected({ ...selected, admin_quoted_price: val, status: 'quoted' });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Sell Requests</h1>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Device</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Storage</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Condition</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Estimate</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!items ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>)}</tr>
                ))
              ) : items.length ? items.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d')}</td>
                  <td className="p-3 text-xs text-foreground">{r.contact_name || '—'}</td>
                  <td className="p-3 text-xs text-foreground">{r.device_type} {r.model}</td>
                  <td className="p-3 text-xs">{r.storage_size}</td>
                  <td className="p-3 text-xs capitalize">{r.condition}</td>
                  <td className="p-3 text-xs font-medium">₦{Number(r.estimated_price).toLocaleString('en-NG')}</td>
                  <td className="p-3">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(r)}><Eye className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No sell requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sell Request Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Customer" value={selected.contact_name} />
                <Info label="Phone" value={selected.contact_phone} />
                <Info label="Email" value={selected.contact_email} />
                <Info label="Devices" value={selected.number_of_devices} />
                <Info label="Type" value={selected.device_type} />
                <Info label="Model" value={selected.model} />
                <Info label="Carrier" value={selected.carrier} />
                <Info label="Storage" value={selected.storage_size} />
                <Info label="Battery" value={selected.battery_health} />
                <Info label="Condition" value={selected.condition} />
              </div>
              <div className="bg-secondary/40 rounded-xl p-3">
                <div className="font-medium mb-2">Condition checklist</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <Check label="Broken screen" v={selected.broken_screen} />
                  <Check label="Screen replaced" v={selected.screen_replaced} />
                  <Check label="Battery replaced" v={selected.battery_replaced} />
                  <Check label="Casing changed" v={selected.casing_changed} />
                  <Check label="Snapchat banned" v={selected.snapchat_banned} />
                  <Check label="Face ID working" v={selected.face_id_working} />
                  <Check label="Touch ID working" v={selected.touch_id_working} />
                </div>
              </div>
              {selected.notes && <div><div className="text-xs text-muted-foreground">Notes</div><p>{selected.notes}</p></div>}
              {images.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Photos</div>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                        <img src={img.url} className="aspect-square rounded-lg object-cover w-full" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">Estimated price</div>
                <div className="text-lg font-semibold">₦{Number(selected.estimated_price).toLocaleString('en-NG')}</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Final quote (₦)</label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" value={quote} onChange={(e) => setQuote(e.target.value)} className="rounded-xl" />
                  <Button onClick={saveQuote}>Save Quote</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: any }) => (
  <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium capitalize">{value || '—'}</div></div>
);
const Check = ({ label, v }: { label: string; v: boolean }) => (
  <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className={v ? 'text-success font-medium' : 'text-muted-foreground'}>{v ? 'Yes' : 'No'}</span></div>
);

export default AdminSellRequests;