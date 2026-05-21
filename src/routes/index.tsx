import { createFileRoute } from "@tanstack/react-router";
import { CustomerHeader } from "@/components/CustomerHeader";
import { MenuGrid } from "@/components/MenuGrid";
import { CartFooterBar } from "@/components/CartFooterBar";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-warning p-5 text-primary-foreground shadow-md">
          <div className="text-xs font-medium opacity-90">Selamat datang 👋</div>
          <h1 className="mt-1 text-2xl font-bold leading-tight">Mau makan apa hari ini?</h1>
          <p className="mt-1 text-sm opacity-90">Pilih menu, bayar QRIS, makanan diantar ke meja.</p>
        </section>

        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Menu Tersedia
        </h2>
        <MenuGrid />
      </main>
      <CartFooterBar />
    </div>
  );
}
