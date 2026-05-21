import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdminPassword,
} from "@/lib/admins.functions";
import { Plus, Trash2, KeyRound, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

interface RoleRow { id: string; user_id: string; role: string; email: string | null; created_at: string }

function UsersPage() {
  const { isSuperAdmin, loading } = useAuth();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<RoleRow | null>(null);
  const [selfPwOpen, setSelfPwOpen] = useState(false);

  if (!loading && !isSuperAdmin) {
    throw redirect({ to: "/admin" });
  }

  const load = async () => {
    try {
      // Pass the bearer token automatically via createServerFn fetch wrapper
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const data = await listAdmins({
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      } as any);
      setRows(data as any);
    } catch (e: any) {
      toast.error("Gagal memuat: " + (e?.message ?? e));
    }
  };

  useEffect(() => { load(); }, []);

  const callWithAuth = async <T,>(fn: any, payload?: any): Promise<T> => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    return fn({
      data: payload,
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
  };

  const onDelete = async (row: RoleRow) => {
    if (!confirm(`Hapus admin ${row.email}?`)) return;
    try {
      await callWithAuth(deleteAdmin, { user_id: row.user_id });
      toast.success("Admin dihapus");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menghapus");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Manajemen Pengguna</h1>
          <p className="text-xs text-muted-foreground">Hanya Super Admin yang dapat mengelola akun.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelfPwOpen(true)} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-bold">
            <KeyRound className="h-4 w-4" /> Password Saya
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> Tambah Admin
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className={`grid h-10 w-10 place-items-center rounded-full ${r.role === "superadmin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{r.email ?? "(tanpa email)"}</div>
              <div className="text-xs text-muted-foreground capitalize">{r.role}</div>
            </div>
            {r.role !== "superadmin" && (
              <div className="flex gap-1">
                <button onClick={() => setPwTarget(r)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary"><KeyRound className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(r)} className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {open && <CreateAdminModal onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} call={callWithAuth} />}
      {pwTarget && <ChangePwModal target={pwTarget} onClose={() => setPwTarget(null)} call={callWithAuth} />}
      {selfPwOpen && <SelfPwModal onClose={() => setSelfPwOpen(false)} />}
    </div>
  );
}

function SelfPwModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password Anda berhasil diperbarui");
      onClose();
    } catch (e: any) { toast.error(e?.message ?? "Gagal"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ubah Password Saya</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru (min 8 karakter)" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          <input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Konfirmasi password baru" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "Menyimpan…" : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateAdminModal({ onClose, onCreated, call }: { onClose: () => void; onCreated: () => void; call: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await call(createAdmin, { email, password });
      toast.success("Admin dibuat");
      onCreated();
    } catch (e: any) { toast.error(e?.message ?? "Gagal"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Tambah Admin</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 karakter)" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "Menyimpan…" : "Buat Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChangePwModal({ target, onClose, call }: { target: RoleRow; onClose: () => void; call: any }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await call(updateAdminPassword, { user_id: target.user_id, password });
      toast.success("Password diperbarui");
      onClose();
    } catch (e: any) { toast.error(e?.message ?? "Gagal"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ubah Password — {target.email}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru" className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
