import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerHeader } from "@/components/CustomerHeader";
import { formatRupiah, statusLabel } from "@/lib/format";
import { Check, ChefHat, Clock, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackPage,
});

const steps: { key: "menunggu" | "diproses" | "selesai"; label: string; icon: any }[] = [
  { key: "menunggu", label: "Menunggu", icon: Clock },
  { key: "diproses", label: "Diproses", icon: ChefHat },
  { key: "selesai", label: "Selesai", icon: PartyPopper },
];

function TrackPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).single();
      setOrder(o);
      const { data: it } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setItems(it ?? []);
    };
    load();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <div className="mx-auto max-w-2xl px-4 pt-20 text-center text-sm text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  const stepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-background pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Pesanan</div>
              <div className="font-mono text-sm font-semibold">#{String(order.id).slice(0, 8).toUpperCase()}</div>
            </div>
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
              {statusLabel(order.payment_status)}
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const reached = idx <= stepIndex;
                const Icon = reached ? Check : s.icon;
                return (
                  <div key={s.key} className="flex flex-1 flex-col items-center">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-full transition ${
                        reached ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`mt-2 text-xs font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="relative mt-3 h-1.5 rounded-full bg-secondary">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="Nama">{order.customer_name}</Info>
            <Info label="No. Meja">{order.table_number}</Info>
            <Info label="WhatsApp">{order.whatsapp}</Info>
            <Info label="Total"><span className="font-bold text-primary">{formatRupiah(Number(order.total_price))}</span></Info>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-bold">Detail Pesanan</h2>
          <div className="space-y-1 text-sm">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span className="text-muted-foreground">{i.menu_name} × {i.quantity}</span>
                <span>{formatRupiah(Number(i.subtotal))}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Halaman ini terupdate otomatis saat status pesananmu berubah.
        </p>
      </main>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}
