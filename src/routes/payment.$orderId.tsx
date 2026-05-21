import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerHeader } from "@/components/CustomerHeader";
import { formatRupiah } from "@/lib/format";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payment/$orderId")({
  component: PaymentPage,
});

function PaymentPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => setOrder(data));
  }, [orderId]);

  const simulatePay = async () => {
    setPaying(true);
    // simulate gateway delay
    await new Promise((r) => setTimeout(r, 1800));
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "dibayar" })
      .eq("id", orderId);
    setPaying(false);
    if (error) {
      toast.error("Pembayaran gagal: " + error.message);
      return;
    }
    setPaid(true);
    setTimeout(() => navigate({ to: "/track/$orderId", params: { orderId } }), 1200);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <div className="mx-auto max-w-2xl px-4 pt-20 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // QRIS dummy SVG
  const qrisDummy = (
    <div className="mx-auto grid h-56 w-56 grid-cols-12 grid-rows-12 gap-[2px] rounded-2xl bg-white p-3">
      {Array.from({ length: 144 }).map((_, i) => (
        <div
          key={i}
          className={`${(i * 17 + (i % 7)) % 3 === 0 ? "bg-foreground" : "bg-transparent"}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Pesanan</div>
              <div className="font-mono text-sm font-semibold">#{String(order.id).slice(0, 8).toUpperCase()}</div>
            </div>
            <div className="rounded-full bg-warning/30 px-3 py-1 text-xs font-bold text-warning-foreground">
              QRIS Dummy
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-secondary p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Pembayaran</div>
            <div className="mt-1 text-3xl font-extrabold text-primary">{formatRupiah(Number(order.total_price))}</div>
          </div>

          <div className="mt-5 flex flex-col items-center">
            {paid ? (
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-20 w-20 text-success" />
                <div className="mt-2 text-lg font-bold text-success">Pembayaran Berhasil</div>
                <div className="text-sm text-muted-foreground">Mengarahkan ke pelacakan…</div>
              </div>
            ) : (
              <>
                {qrisDummy}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Scan QRIS dengan aplikasi e-wallet kamu (simulasi)
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-medium">Menunggu pembayaran…</span>
                </div>
              </>
            )}
          </div>

          {!paid && (
            <button
              onClick={simulatePay}
              disabled={paying}
              className="mt-5 w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
            >
              {paying ? "Memproses pembayaran…" : "Saya sudah bayar (Simulasi)"}
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          * Ini adalah simulasi gateway pembayaran (mirip Midtrans). Tidak ada uang nyata yang ditarik.
        </p>
      </main>
    </div>
  );
}
