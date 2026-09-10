import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, StatCard, Badge } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, Users, RefreshCw, ShieldCheck, ShoppingBag, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { member, settings, hasPermission, applyPersonalTheme, refresh } = usePanel();
  const [d, setD] = useState({ display_name: member?.display_name || "", avatar_url: member?.avatar_url || "" });
  const [theme, setTheme] = useState(member?.theme_settings || { mode: settings?.theme?.mode || "dark", primary: "", accent: "", sidebar: "" });
  const [busy, setBusy] = useState(false);
  if (!member) return null;

  const fmt = (n) => Math.round(n || 0) + " PLN";
  const themeLocked = settings?.theme_locked;
  const canTheme = hasPermission("theme.personal") && !themeLocked;

  const save = async () => {
    setBusy(true);
    try {
      await base44.entities.Member.update(member.id, { display_name: d.display_name, avatar_url: d.avatar_url, theme_settings: theme });
      applyPersonalTheme(theme);
      await refresh();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Profil" subtitle="Twoje dane i ustawienia osobiste" />
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">{(member.display_name || member.email)[0].toUpperCase()}</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{member.display_name}</h2>
          <p className="text-muted-foreground">{member.email}</p>
          <div className="flex gap-2 mt-2"><Badge color="#a855f7">{member.role_label}</Badge><Badge color="#10b981">Zatwierdzony</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} accent label="Portfel" value={fmt(member.wallet_balance)} />
        <StatCard icon={TrendingUp} label="Zarobki" value={fmt(member.earnings_total)} />
        <StatCard icon={Users} label="Klienci" value={member.customers_count || 0} />
        <StatCard icon={ShoppingBag} label="Sprzedane" value={member.items_sold || 0} />
        <StatCard icon={RefreshCw} label="Wymiany" value={member.exchanges_count || 0} />
        <StatCard icon={ShieldCheck} label="Legitchecki" value={member.legitchecks_count || 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Dane konta</h3>
          <div className="space-y-2"><Label>Nazwa wyświetlana</Label><Input value={d.display_name} onChange={e => setD({ ...d, display_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>URL avatara</Label><Input value={d.avatar_url} onChange={e => setD({ ...d, avatar_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Motyw osobisty</h3>
          {themeLocked ? <p className="text-sm text-muted-foreground">Motyw globalny jest wymuszony przez administrację. Nie możesz go zmienić.</p> : !canTheme ? <p className="text-sm text-muted-foreground">Nie masz uprawnień do zmiany motywu.</p> : (
            <>
              <div className="space-y-2"><Label>Tryb</Label><select value={theme.mode} onChange={e => setTheme({ ...theme, mode: e.target.value })} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"><option value="dark">Ciemny</option><option value="light">Jasny</option></select></div>
              <div className="space-y-2"><Label>Kolor główny</Label><div className="flex gap-2"><input type="color" value={theme.primary || settings?.theme?.primary || "#7c3aed"} onChange={e => setTheme({ ...theme, primary: e.target.value })} className="w-12 h-9 rounded-lg border border-border cursor-pointer" /><Input value={theme.primary} onChange={e => setTheme({ ...theme, primary: e.target.value })} placeholder="puste = globalny" /></div></div>
              <div className="space-y-2"><Label>Akcent</Label><div className="flex gap-2"><input type="color" value={theme.accent || settings?.theme?.accent || "#a855f7"} onChange={e => setTheme({ ...theme, accent: e.target.value })} className="w-12 h-9 rounded-lg border border-border cursor-pointer" /><Input value={theme.accent} onChange={e => setTheme({ ...theme, accent: e.target.value })} placeholder="puste = globalny" /></div></div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4"><Button onClick={save} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Zapisz profil</Button></div>
    </div>
  );
}
