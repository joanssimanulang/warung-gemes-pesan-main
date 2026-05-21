import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, user, isAdmin, navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Login gagal: " + error);
      return;
    }
    toast.success("Login berhasil");
    setTimeout(() => navigate({ to: "/admin" }), 200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-xl font-bold">Login Admin</h1>
          <p className="text-xs text-muted-foreground">Warung Mie Kampus</p>
        </div>

        <form onSubmit={handle} className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/30 disabled:opacity-60"
          >
            {submitting ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
          <div className="font-bold">Akun Super Admin Default:</div>
          <div>Email: <span className="font-mono">owner@warung.test</span></div>
          <div>Password: <span className="font-mono">Owner12345!</span></div>
        </div>
      </div>
    </div>
  );
}
