import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Lock, Loader2, Store, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Podaj poprawny adres e-mail");
      return;
    }
    if (password.length < 6) { setError("Hasło musi mieć min. 6 znaków"); return; }
    if (password !== confirmPassword) { setError("Hasła nie są zgodne"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim().toLowerCase(), password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Rejestracja nieudana");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim().toLowerCase(), otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Nieprawidłowy kod weryfikacyjny");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email.trim().toLowerCase());
      toast({ title: "Kod wysłany", description: "Sprawdź skrzynkę e-mail." });
    } catch (err) {
      setError(err.message || "Nie udało się wysłać kodu");
    }
  };

  if (showOtp) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Zweryfikuj e-mail</h1>
        <p className="text-sm text-muted-foreground mt-1">Wysłaliśmy kod na {email}</p>
        {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center my-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-11 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Weryfikacja...</> : "Zweryfikuj"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">Nie dostałeś kodu? <button onClick={handleResend} className="text-primary font-medium hover:underline">Wyślij ponownie</button></p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Rejestracja</h1>
      <p className="text-sm text-muted-foreground mt-1">Konto zespołu KUPDOLARKI.PL — podaj swój realny e-mail</p>
      {error && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 mt-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoFocus placeholder="ty@przyklad.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Powtórz hasło</Label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="confirm" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-11" required /></div>
        </div>
        <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tworzenie konta...</> : <><UserPlus className="w-4 h-4 mr-2" /> Zarejestruj</>}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-5">Masz już konto? <Link to="/login" className="text-primary font-medium hover:underline">Zaloguj się</Link></p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: "var(--panel-gradient, linear-gradient(135deg,#7c3aed,#a855f7))" }}><Store className="w-7 h-7 text-white" /></div>
          <p className="text-sm text-muted-foreground">KUPDOLARKI.PL — Panel Operacyjny</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-7">{children}</div>
        <p className="text-center text-xs text-muted-foreground mt-6">Site Designed by <a href="https://dc.kupdolarki.pl" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">realkampus</a></p>
      </div>
    </div>
  );
}
