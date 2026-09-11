import React from "react";
import { Navigate } from "react-router-dom";
import { usePanel } from "@/lib/PanelContext";

// Hides children if the current member lacks the permission.
export function PermissionGate({ perm, children, fallback = null }) {
  const { hasPermission } = usePanel();
  if (!hasPermission(perm)) return fallback;
  return children;
}

// Renders a page only if the current member has the permission, else Forbidden.
export function PermPage({ perm, Component }) {
  const { hasPermission, member, loading } = usePanel();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!member) return <Navigate to="/login" replace />;
  if (!hasPermission(perm)) return <Forbidden />;
  return <Component />;
}

export function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-7xl font-bold text-primary/30">403</div>
      <h2 className="text-2xl font-semibold mt-4">Brak uprawnień</h2>
      <p className="text-muted-foreground mt-2 max-w-md">Nie masz uprawnień do tej strony. Skontaktuj się z administracją, jeśli uważasz, że to błąd.</p>
    </div>
  );
}
