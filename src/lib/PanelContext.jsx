import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { applyTheme } from "@/lib/theme";

const PanelContext = createContext(null);

export function PanelProvider({ children }) {
  const [member, setMember] = useState(null);
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejected, setRejected] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("initSession", {});
      const data = res.data;
      if (data.rejected) {
        setRejected(true);
        window.location.href = data.redirect || "https://google.com";
        return;
      }
      setMember(data.member);
      setSettings(data.settings);
      setRoles(data.roles || []);
      const theme = data.settings?.theme_locked
        ? data.settings?.theme
        : { ...data.settings?.theme, ...(data.member?.theme_settings || {}) };
      applyTheme(theme, data.member?.theme_settings?.mode || data.settings?.theme?.mode || "dark");
    } catch (e) {
      setError(e.message || "Błąd inicjalizacji");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("initSession", {});
      const data = res.data;
      if (!data.rejected) {
        setMember(data.member);
        setSettings(data.settings);
        setRoles(data.roles || []);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const hasPermission = useCallback((perm) => {
    if (!member) return false;
    if (member.custom_role === "developer") return true;
    return (member.permissions || []).includes(perm);
  }, [member]);

  const applyPersonalTheme = useCallback((themeSettings) => {
    const theme = settings?.theme_locked
      ? settings?.theme
      : { ...settings?.theme, ...themeSettings };
    applyTheme(theme, themeSettings?.mode || settings?.theme?.mode || "dark");
  }, [settings]);

  return (
    <PanelContext.Provider value={{ member, settings, roles, loading, error, rejected, refresh, hasPermission, applyPersonalTheme, setMember }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used within PanelProvider");
  return ctx;
}
