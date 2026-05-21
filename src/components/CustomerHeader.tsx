import { Link } from "@tanstack/react-router";
import { ShoppingCart, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";

export function CustomerHeader() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold">Warung Mie Kampus</div>
            <div className="text-[11px] text-muted-foreground">Pesan dari meja</div>
          </div>
        </Link>
        <Link
          to="/cart"
          className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition active:scale-95"
          aria-label="Keranjang"
        >
          <ShoppingCart className="h-5 w-5" />
          {mounted && count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
