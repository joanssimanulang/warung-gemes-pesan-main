import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CustomerHeader } from "@/components/CustomerHeader";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Utensils } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

interface TableOpt { id: string; label: string }
interface RoomOpt { id: string; name: string; building: string | null; floor: string | null }

const baseSchema = z.object({
  customer_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\- ]{8,20}$/, "Nomor WhatsApp tidak valid"),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);

  const [locationType, setLocationType] = useState<"kantin" | "ruangan">("kantin");
  const [form, setForm] = useState({ customer_name: "", whatsapp: "" });
  const [tableId, setTableId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [tables, setTables] = useState<TableOpt[]>([]);
  const [rooms, setRooms] = useState<RoomOpt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("tables").select("id,label").eq("is_active", true).order("label")
      .then(({ data }) => setTables((data ?? []) as TableOpt[]));
    supabase.from("rooms").select("id,name,building,floor").eq("is_active", true).order("name")
      .then(({ data }) => setRooms((data ?? []) as RoomOpt[]));
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <div className="mx-auto max-w-2xl px-4 pt-12 text-center text-sm text-muted-foreground">
          Tidak ada item di keranjang.
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = baseSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    if (locationType === "kantin" && !tableId) { toast.error("Pilih nomor meja"); return; }
    if (locationType === "ruangan" && !roomId) { toast.error("Pilih ruangan tujuan"); return; }

    const tableLabel = locationType === "kantin" ? tables.find((t) => t.id === tableId)?.label ?? null : null;

    setLoading(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: parsed.data.customer_name,
        whatsapp: parsed.data.whatsapp,
        total_price: total,
        location_type: locationType,
        table_number: tableLabel,
        room_id: locationType === "ruangan" ? roomId : null,
      })
      .select("id")
      .single();
    if (error || !order) {
      setLoading(false);
      toast.error("Gagal membuat pesanan: " + (error?.message ?? ""));
      return;
    }
    const itemsPayload = items.map((i) => ({
      order_id: order.id,
      menu_id: i.menu_id,
      menu_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      setLoading(false);
      toast.error("Gagal menyimpan item: " + itemsErr.message);
      return;
    }
    clear();
    navigate({ to: "/payment/$orderId", params: { orderId: order.id } });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold">Checkout</h1>

        <section className="mb-4 rounded-3xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-bold">Ringkasan Pesanan</h2>
          <div className="space-y-1 text-sm">
            {items.map((i) => (
              <div key={i.menu_id} className="flex justify-between">
                <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                <span>{formatRupiah(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span><span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-4">
          <Field label="Nama">
            <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="Nama kamu" maxLength={100} />
          </Field>
          <Field label="Nomor WhatsApp">
            <input required inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary"
              placeholder="08xxxxxxxxxx" maxLength={20} />
          </Field>

          <Field label="Pengiriman">
            <div className="grid grid-cols-2 gap-2">
              <LocChoice active={locationType === "kantin"} onClick={() => setLocationType("kantin")} icon={<Utensils className="h-4 w-4" />}
                title="Makan di Kantin" desc="Pilih nomor meja" />
              <LocChoice active={locationType === "ruangan"} onClick={() => setLocationType("ruangan")} icon={<MapPin className="h-4 w-4" />}
                title="Antar ke Ruangan" desc="Untuk dosen / kelas" />
            </div>
          </Field>

          {locationType === "kantin" ? (
            <Field label="Nomor Meja">
              {tables.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Belum ada meja tersedia. Hubungi admin.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {tables.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTableId(t.id)}
                      className={`rounded-2xl border py-3 text-sm font-semibold transition ${tableId === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          ) : (
            <Field label="Ruangan Tujuan">
              {rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Belum ada ruangan tersedia. Hubungi admin.
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((r) => {
                    const meta = [r.building, r.floor && `Lt. ${r.floor}`].filter(Boolean).join(" · ");
                    return (
                      <button key={r.id} type="button" onClick={() => setRoomId(r.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${roomId === r.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                        <MapPin className={`mt-0.5 h-4 w-4 ${roomId === r.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">{r.name}</div>
                          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-60">
            {loading ? "Memproses…" : `Bayar ${formatRupiah(total)}`}
          </button>
        </form>
      </main>
    </div>
  );
}

function LocChoice({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${active ? "text-primary" : ""}`}>{icon} {title}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
