import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, ShoppingBag, Utensils, BarChart3, Users, LogOut, Menu as MenuIcon, X, MapPin } from "lucide-react";
import { useState } from "react";

export function AdminShell() {
  const { signOut, user, isSuperAdmin, roles } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });

  const links = [
    { to: "/admin", label: "Pesanan", icon: ShoppingBag },
    { to: "/admin/menus", label: "Menu", icon: Utensils },
    { to: "/admin/locations", label: "Lokasi", icon: MapPin },
    { to: "/admin/analytics", label: "Analitik", icon: BarChart3 },
    ...(isSuperAdmin ? [{ to: "/admin/users", label: "Pengguna", icon: Users }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    nav({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary md:hidden" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">Admin Warung Mie</div>
                <div className="text-[11px] text-muted-foreground">{user?.email} · {roles.join(", ")}</div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-semibold">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
        {/* Mobile menu */}
        {open && (
          <nav className="border-t border-border bg-card md:hidden">
            <div className="mx-auto max-w-6xl px-2 py-2">
              {links.map((l) => {
                const active = path === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <l.icon className="h-4 w-4" /> {l.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4">
        <aside className="hidden w-56 flex-shrink-0 md:block">
          <nav className="sticky top-20 space-y-1 rounded-2xl border border-border bg-card p-2">
            {links.map((l) => {
              const active = path === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
