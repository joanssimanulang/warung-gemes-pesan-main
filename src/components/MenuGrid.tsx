import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

export function MenuGrid() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("menus")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) toast.error("Gagal memuat menu");
        setMenus((data ?? []) as Menu[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("menus-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "menus" }, () => {
        supabase.from("menus").select("*").eq("is_available", true).order("created_at").then(({ data }) => {
          setMenus((data ?? []) as Menu[]);
        });
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Belum ada menu tersedia.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {menus.map((m) => {
        const inCart = items.find((i) => i.menu_id === m.id);
        return (
          <article
            key={m.id}
            className="flex gap-3 overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
              {m.image_url ? (
                <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <h3 className="text-base font-semibold leading-tight">{m.name}</h3>
              {m.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-bold text-primary">{formatRupiah(m.price)}</span>
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(m.id, inCart.quantity - 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-secondary"
                      aria-label="Kurangi"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{inCart.quantity}</span>
                    <button
                      onClick={() => setQty(m.id, inCart.quantity + 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"
                      aria-label="Tambah"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      add({ menu_id: m.id, name: m.name, price: Number(m.price), image_url: m.image_url });
                      toast.success(`${m.name} ditambahkan`);
                    }}
                    className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
