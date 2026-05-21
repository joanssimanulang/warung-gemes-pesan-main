import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/locations")({
  component: LocationsPage,
});

interface TableRow {
  id: string;
  label: string;
  notes: string | null;
  is_active: boolean;
}
interface RoomRow {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  notes: string | null;
  is_active: boolean;
}

function LocationsPage() {
  const [tab, setTab] = useState<"tables" | "rooms">("tables");
  const [tables, setTables] = useState<TableRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [tableModal, setTableModal] = useState<{ open: boolean; initial: TableRow | null }>({ open: false, initial: null });
  const [roomModal, setRoomModal] = useState<{ open: boolean; initial: RoomRow | null }>({ open: false, initial: null });

  const loadTables = async () => {
    const { data } = await supabase.from("tables").select("*").order("label");
    setTables((data ?? []) as TableRow[]);
  };
  const loadRooms = async () => {
    const { data } = await supabase.from("rooms").select("*").order("name");
    setRooms((data ?? []) as RoomRow[]);
  };

  useEffect(() => { loadTables(); loadRooms(); }, []);

  const toggleTable = async (t: TableRow) => {
    await supabase.from("tables").update({ is_active: !t.is_active }).eq("id", t.id);
    loadTables();
  };
  const toggleRoom = async (r: RoomRow) => {
    await supabase.from("rooms").update({ is_active: !r.is_active }).eq("id", r.id);
    loadRooms();
  };
  const removeTable = async (id: string) => {
    if (!confirm("Hapus meja ini?")) return;
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Meja dihapus"); loadTables(); }
  };
  const removeRoom = async (id: string) => {
    if (!confirm("Hapus ruangan ini?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Ruangan dihapus"); loadRooms(); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Kelola Lokasi</h1>
        <button
          onClick={() =>
            tab === "tables"
              ? setTableModal({ open: true, initial: null })
              : setRoomModal({ open: true, initial: null })
          }
          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Tambah {tab === "tables" ? "Meja" : "Ruangan"}
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <TabBtn active={tab === "tables"} onClick={() => setTab("tables")} icon={<Hash className="h-3.5 w-3.5" />}>
          Meja ({tables.length})
        </TabBtn>
        <TabBtn active={tab === "rooms"} onClick={() => setTab("rooms")} icon={<MapPin className="h-3.5 w-3.5" />}>
          Ruangan ({rooms.length})
        </TabBtn>
      </div>

      {tab === "tables" ? (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {tables.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada meja. Tambahkan agar customer bisa pilih saat checkout.
            </div>
          )}
          {tables.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                {t.label}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Meja {t.label}</div>
                {t.notes && <div className="truncate text-xs text-muted-foreground">{t.notes}</div>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button onClick={() => toggleTable(t)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {t.is_active ? "Aktif" : "Nonaktif"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => setTableModal({ open: true, initial: t })} className="grid h-7 w-7 place-items-center rounded-full bg-secondary"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => removeTable(t.id)} className="grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rooms.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada ruangan. Tambahkan ruangan dosen / lab agar bisa pesan antar.
            </div>
          )}
          {rooms.map((r) => (
            <div key={r.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[r.building, r.floor && `Lt. ${r.floor}`].filter(Boolean).join(" · ") || "—"}
                </div>
                {r.notes && <div className="mt-0.5 truncate text-xs text-muted-foreground">{r.notes}</div>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button onClick={() => toggleRoom(r)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {r.is_active ? "Aktif" : "Nonaktif"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => setRoomModal({ open: true, initial: r })} className="grid h-7 w-7 place-items-center rounded-full bg-secondary"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => removeRoom(r.id)} className="grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tableModal.open && (
        <TableModal
          initial={tableModal.initial}
          onClose={() => setTableModal({ open: false, initial: null })}
          onSaved={() => { setTableModal({ open: false, initial: null }); loadTables(); }}
        />
      )}
      {roomModal.open && (
        <RoomModal
          initial={roomModal.initial}
          onClose={() => setRoomModal({ open: false, initial: null })}
          onSaved={() => { setRoomModal({ open: false, initial: null }); loadRooms(); }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
    >
      {icon} {children}
    </button>
  );
}

function TableModal({ initial, onClose, onSaved }: { initial: TableRow | null; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { toast.error("Label meja wajib diisi"); return; }
    setSaving(true);
    const payload = { label: label.trim(), notes: notes.trim() || null };
    const q = initial
      ? supabase.from("tables").update(payload).eq("id", initial.id)
      : supabase.from("tables").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Tersimpan"); onSaved(); }
  };

  return (
    <ModalShell title={initial ? "Edit Meja" : "Tambah Meja"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Label meja (nomor / nama)">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: 11 atau VIP-A" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={20} />
        </Field>
        <Field label="Catatan (opsional)">
          <input value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Dekat jendela" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={120} />
        </Field>
        <button type="submit" disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </ModalShell>
  );
}

function RoomModal({ initial, onClose, onSaved }: { initial: RoomRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [building, setBuilding] = useState(initial?.building ?? "");
  const [floor, setFloor] = useState(initial?.floor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama ruangan wajib diisi"); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      building: building.trim() || null,
      floor: floor.trim() || null,
      notes: notes.trim() || null,
    };
    const q = initial
      ? supabase.from("rooms").update(payload).eq("id", initial.id)
      : supabase.from("rooms").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Tersimpan"); onSaved(); }
  };

  return (
    <ModalShell title={initial ? "Edit Ruangan" : "Tambah Ruangan"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Nama ruangan">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ruang Dosen Informatika" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={100} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gedung / Area">
            <input value={building ?? ""} onChange={(e) => setBuilding(e.target.value)} placeholder="Gedung A" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={60} />
          </Field>
          <Field label="Lantai">
            <input value={floor ?? ""} onChange={(e) => setFloor(e.target.value)} placeholder="2" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={20} />
          </Field>
        </div>
        <Field label="Catatan (opsional)">
          <input value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Petunjuk lokasi / penerima" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" maxLength={200} />
        </Field>
        <button type="submit" disabled={saving} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
