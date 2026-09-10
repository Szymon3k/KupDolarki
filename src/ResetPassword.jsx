import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Hasło musi mieć min. 6 znaków"); return; }
    if (newPassword !== confirmPassword) { setError("Hasła nie są zgodne"); return; }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      setDone(true);
      setTimeout(() => { window.location.href = "/login"; }, 1800);
    } catch (err) {
      setError(err.message || "Nie udało się zmienić hasła. Link mógł wygasnąć — poproś o nowy.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Nieprawidłowy link"
        subtitle="Ten link do resetu hasła jest niekompletny lub nieważny"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Poproś o nowy link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Link, którego użyłeś, wydaje się niekompletny. Poproś o ponowne wysłanie wiadomości resetującej hasło.
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Hasło zmienione"
        subtitle="Możesz teraz zalogować się używając nowego hasła"
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            Przejdź do logowania
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Twoje hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nowe hasło"
      subtitle="Wpisz swoje nowe hasło poniżej"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Powtórz hasło</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zmieniam hasło...
            </>
          ) : (
            "Zmień hasło"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
