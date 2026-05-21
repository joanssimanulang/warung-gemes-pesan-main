import { useCart } from "@/lib/cart";
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "@/lib/format";

export function CartFooterBar() {
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.total());
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <div className="text-xs text-muted-foreground">{count} item · Total</div>
          <div className="text-lg font-bold text-primary">{formatRupiah(total)}</div>
        </div>
        <Link
          to="/checkout"
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
