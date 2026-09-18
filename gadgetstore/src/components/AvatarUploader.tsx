import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

interface Props {
  userId: string;
  currentUrl?: string | null;
  fullName?: string | null;
  onUpdated: (url: string) => void;
}

const getCroppedBlob = async (imageSrc: string, crop: { x: number; y: number; width: number; height: number }): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
};

const AvatarUploader = ({ userId, currentUrl, fullName, onUpdated }: Props) => {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Image too large (max 5MB)');
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onCropComplete = useCallback((_: any, area: any) => setCroppedAreaPixels(area), []);

  const handleSave = async () => {
    if (!src || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('user_id', userId);
      if (updErr) throw updErr;
      onUpdated(pub.publicUrl);
      toast.success('Profile photo updated');
      setSrc(null);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const initial = (fullName || 'U').slice(0, 1).toUpperCase();

  return (
    <>
      <div className="relative h-16 w-16">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold text-foreground">{initial}</div>
        )}
        <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow">
          <Camera className="h-3.5 w-3.5" />
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      </div>

      <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crop your photo</DialogTitle></DialogHeader>
          <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden">
            {src && (
              <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            )}
          </div>
          <div className="px-1">
            <label className="text-xs text-muted-foreground">Zoom</label>
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(v) => setZoom(v[0])} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSrc(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUploader;