import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, statusLabel } from "@/lib/format";
import { ChefHat, CheckCircle2, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminOrdersPage,
});

interface Order {
  id: string;
  customer_name: string;
  whatsapp: string;
  table_number: string | null;
  total_price: number;
  status: "menunggu" | "diproses" | "selesai";
  payment_status: string;
  created_at: string;
  location_type: "kantin" | "ruangan";
  room_id: string | null;
  rooms?: { name: string; building: string | null; floor: string | null } | null;
}
interface Item {
  id: string;
  order_id: string;
  menu_name: string;
  quantity: number;
  subtotal: number;
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [filter, setFilter] = useState<"all" | "menunggu" | "diproses" | "selesai">("all");

  const loadAll = async () => {
    const { data: o } = await supabase
      .from("orders")
      .select("*, rooms(name,building,floor)")
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders((o ?? []) as unknown as Order[]);
    const ids = (o ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: it } = await supabase.from("order_items").select("*").in("order_id", ids);
      const grouped: Record<string, Item[]> = {};
      (it ?? []).forEach((row: any) => {
        (grouped[row.order_id] ??= []).push(row);
      });
      setItems(grouped);
    }
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Status diperbarui");
  };

  const filtered = orders.filter((o) => filter === "all" ? true : o.status === filter);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Pesanan Masuk</h1>
        <span className="text-xs text-muted-foreground">{orders.length} total</span>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", "menunggu", "diproses", "selesai"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f === "all" ? "Semua" : statusLabel(f)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Belum ada pesanan.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              items={items[o.id] ?? []}
              onProcess={() => updateStatus(o.id, "diproses")}
              onComplete={() => updateStatus(o.id, "selesai")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  items,
  onProcess,
  onComplete,
}: {
  order: Order;
  items: Item[];
  onProcess: () => void;
  onComplete: () => void;
}) {
  const isProcessing = order.status === "diproses";
  const isDone = order.status === "selesai";

  // wa.me cleaned number
  const waNumber = order.whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "62");
  const locationLabel = order.location_type === "ruangan"
    ? `Antar ke ${order.rooms?.name ?? "Ruangan"}${order.rooms?.building ? ` (${order.rooms.building}${order.rooms.floor ? ` Lt. ${order.rooms.floor}` : ""})` : ""}`
    : `Meja ${order.table_number ?? "-"}`;
  const waMessage = encodeURIComponent(
    `Halo ${order.customer_name}, pesanan kamu (#${order.id.slice(0, 8).toUpperCase()}) di Warung Mie Kampus sedang kami siapkan. ${order.location_type === "ruangan" ? `Akan diantar ke ${order.rooms?.name ?? "ruangan tujuan"}.` : `Akan segera diantar ke meja ${order.table_number}.`} Terima kasih!`
  );
  const waCompleteMessage = encodeURIComponent(
    `Halo ${order.customer_name}, pesanan kamu (#${order.id.slice(0, 8).toUpperCase()}) sudah selesai. ${order.location_type === "ruangan" ? `Diantar ke ${order.rooms?.name ?? "ruangan tujuan"}.` : `Silakan ambil di meja ${order.table_number}.`} Selamat menikmati!`
  );

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</div>
          <div className="text-base font-bold">{order.customer_name}</div>
          <div className="text-xs text-muted-foreground">{locationLabel} · {order.whatsapp}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 rounded-2xl bg-secondary/60 p-3 text-sm">
        {items.map((i) => (
          <div key={i.id} className="flex justify-between">
            <span>{i.menu_name} × {i.quantity}</span>
            <span>{formatRupiah(Number(i.subtotal))}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-border pt-1 text-sm font-bold">
          <span>Total</span><span className="text-primary">{formatRupiah(Number(order.total_price))}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${order.payment_status === "dibayar" ? "bg-success/15 text-success" : "bg-warning/30 text-warning-foreground"}`}>
          {statusLabel(order.payment_status)}
        </span>
        <span className="text-muted-foreground">{new Date(order.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* Actions: progressive disclosure */}
      <div className="mt-4 space-y-2">
        {order.status === "menunggu" && (
          <button
            onClick={onProcess}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
          >
            <ChefHat className="h-4 w-4" /> Proses Pesanan
          </button>
        )}

        {/* Only visible AFTER admin pressed "Proses" */}
        {(isProcessing || isDone) && (
          <div className="space-y-2 rounded-2xl border border-border bg-background/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kirim notifikasi WhatsApp
            </div>
            <a
              href={`https://wa.me/${waNumber}?text=${isDone ? waCompleteMessage : waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-success py-2.5 text-xs font-bold text-success-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              Kirim WA — {isDone ? "Pesanan Selesai" : "Sedang Diproses"}
            </a>

            {isProcessing && (
              <button
                onClick={onComplete}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-bold text-background active:scale-[0.98]"
              >
                <CheckCircle2 className="h-4 w-4" /> Ubah Status ke Selesai
              </button>
            )}
            {isDone && (
              <div className="flex items-center justify-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-4 w-4" /> Pesanan selesai
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const map = {
    menunggu: { c: "bg-warning/30 text-warning-foreground", icon: Clock },
    diproses: { c: "bg-primary/15 text-primary", icon: ChefHat },
    selesai: { c: "bg-success/15 text-success", icon: CheckCircle2 },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${m.c}`}>
      <Icon className="h-3 w-3" /> {statusLabel(status)}
    </span>
  );
}
