import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerHeader } from "@/components/CustomerHeader";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());

  return (
    <div className="min-h-screen bg-background pb-32">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold">Keranjang</h1>

        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Keranjang kamu masih kosong.</p>
            <Link to="/" className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Lihat Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {items.map((i) => (
                <div key={i.menu_id} className="flex gap-3 rounded-3xl border border-border bg-card p-3">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-muted">
                    {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{i.name}</h3>
                      <button onClick={() => remove(i.menu_id)} className="text-muted-foreground" aria-label="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatRupiah(i.price)}</div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="font-bold text-primary">{formatRupiah(i.price * i.quantity)}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(i.menu_id, i.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><Minus className="h-4 w-4" /></button>
                        <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                        <button onClick={() => setQty(i.menu_id, i.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold text-primary">{formatRupiah(total)}</div>
                </div>
                <Link to="/checkout" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95">
                  Lanjut Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
