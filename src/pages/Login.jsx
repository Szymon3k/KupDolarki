import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Store, LogIn } from "lucide-react";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.toLowerCase().endsWith("@kd.pl")) {
      setError("Dozwolone są tylko adresy @kd.pl");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Nieprawidłowy e-mail lub hasło");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--panel-gradient, linear-gradient(135deg,#7c3aed,#a855f7))" }}>
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">KUPDOLARKI.PL</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel Operacyjny — zaloguj się</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-7">
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" autoFocus placeholder="jan@kd.pl" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Zapomniałeś hasła?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logowanie...</> : <><LogIn className="w-4 h-4 mr-2" /> Zaloguj</>}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Nie masz konta?{" "}
            <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">Zarejestruj się</Link>
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">Site Designed by <a href="https://dc.kupdolarki.pl" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">realkampus</a></p>
      </div>
 
