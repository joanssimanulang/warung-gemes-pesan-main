import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menus")({
  component: MenusPage,
});

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => supabase.from("menus").select("*").order("created_at").then(({ data }) => setMenus((data ?? []) as Menu[]));

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Hapus menu ini?")) return;
    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Menu dihapus"); load(); }
  };

  const toggleAvail = async (m: Menu) => {
    await supabase.from("menus").update({ is_available: !m.is_available }).eq("id", m.id);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Menu</h1>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {menus.map((m) => (
          <div key={m.id} className="flex gap-3 rounded-3xl border border-border bg-card p-3">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-muted">
              {m.image_url && <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold">{m.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                </div>
                <button onClick={() => toggleAvail(m)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.is_available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {m.is_available ? "Tersedia" : "Habis"}
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="font-bold text-primary">{formatRupiah(Number(m.price))}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(m); setOpen(true); }} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(m.id)} className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && <MenuFormModal initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function MenuFormModal({ initial, onClose, onSaved }: { initial: Menu | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) { toast.error("Lengkapi nama dan harga"); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      image_url: imageUrl || null,
    };
    const q = initial
      ? supabase.from("menus").update(payload).eq("id", initial.id)
      : supabase.from("menus").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Tersimpan"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit Menu" : "Tambah Menu"}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama menu" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={100} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi" rows={2} className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={300} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Harga" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" min={0} />
          <div className="space-y-2">
            <label className="block text-xs font-semibold">Foto</label>
            {imageUrl && <img src={imageUrl} alt="" className="h-32 w-full rounded-2xl object-cover" />}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary py-3 text-xs font-semibold">
              <Upload className="h-4 w-4" /> {uploading ? "Mengunggah…" : (imageUrl ? "Ganti foto" : "Unggah foto")}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="atau URL gambar" className="w-full rounded-2xl border border-input bg-background px-4 py-2 text-xs outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
