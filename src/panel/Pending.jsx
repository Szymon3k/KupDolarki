import React from "react";
import { Hourglass } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Pending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--panel-gradient)" }}>
          <Hourglass className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold">Konto oczekuje na zatwierdzenie</h1>
        <p className="text-muted-foreground mt-3">Twoje konto oczekuje na zatwierdzenie przez administratora. Otrzymasz powiadomienie, gdy zostanie zatwierdzone.</p>
        <button onClick={() => base44.auth.logout("/login")} className="mt-6 text-sm text-primary hover:underline">Wyloguj się</button>
      </div>
    </div>
  );
}
