import React from "react";
import { Link } from "react-router-dom";

export function Forbidden() {
  return (
    <Shell code="403" title="Brak uprawnień" description="Nie masz uprawnień do tej strony. Skontaktuj się z administracją, jeśli uważasz, że to błąd." />
  );
}
export function NotFound() {
  return (
    <Shell code="404" title="Nie znaleziono strony" description="Strona, której szukasz, nie istnieje lub została przeniesiona." />
  );
}
export function ServerError() {
  return (
    <Shell code="500" title="Błąd serwera" description="Wystąpił błąd serwera. Spróbuj ponownie za chwilę." />
  );
}

function Shell({ code, title, description }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20">{code}</div>
        <h1 className="text-2xl font-bold mt-4">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-lg text-white font-medium text-sm" style={{ background: "var(--panel-gradient)" }}>Wróć do dashboardu</Link>
        <p className="mt-8 text-xs text-muted-foreground">Site Designed by <a href="https://dc.kupdolarki.pl" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">realkampus</a></p>
      </div>
    </div>
  );
}
