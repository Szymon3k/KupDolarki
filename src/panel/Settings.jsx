import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, Loader2, Palette, Building2, Settings as SettingsIcon, DollarSign, Sliders } from "lucide-react";

export default function Settings() {
  const { settings, hasPermission, applyPersonalTheme } = usePanel();
  const { run } = usePanelOps();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (settings) setD({ ...settings, theme: { ...settings.theme } }); }, [settings]);
  if (!d) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const canEdit = hasPermission("settings.edit");
  const canThemeGlobal = hasPermission("theme.global");

  const save = async () => {
    setBusy(true);
    try {
      await run("update_settings", {
        panel_name: d.panel_name, panel_display_name: d.panel_display_name, description: d.description,
        logo_url: d.logo_url, favicon_url: d.favicon_url, discord_url: d.discord_url,
        footer_text: d.footer_text, footer_link: d.footer_link,
        ceo_share_percent: Number(d.ceo_share_percent), allow_registration: d.allow_registration,
        theme_locked: d.theme_locked, theme: d.theme
      }, { successMsg: "Ustawienia zapisane", onSuccess: () => applyPersonalTheme({}) });
    } catch {} finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Ustawienia" subtitle="Konfiguracja panelu KUPDOLARKI.PL"
        actions={canEdit && <Button className="gap-2" onClick={save} disabled={busy}><Save className="w-4 h-4" /> {busy ? "Zapisywanie..." : "Zapisz"}</Button>} />
      <Tabs defaultValue="general">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="general" className="gap-1.5"><SettingsIcon className="w-4 h-4" /> Ogólne</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Building2 className="w-4 h-4" /> Branding</TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5"><Palette className="w-4 h-4" /> Motyw</TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5"><DollarSign className="w-4 h-4" /> Finanse</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5"><Sliders className="w-4 h-4" /> System</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><Section disabled={!canEdit}>
          <Field label="Nazwa panelu"><Input value={d.panel_name} onChange={e => setD({ ...d, panel_name: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="Nazwa wyświetlana"><Input value={d.panel_display_name} onChange={e => setD({ ...d, panel_display_name: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="Opis"><Textarea value={d.description} onChange={e => setD({ ...d, description: e.target.value })} rows={2} disabled={!canEdit} /></Field>
          <Field label="URL Discord"><Input value={d.discord_url} onChange={e => setD({ ...d, discord_url: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="Tekst footera"><Input value={d.footer_text} onChange={e => setD({ ...d, footer_text: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="Link footera"><Input value={d.footer_link} onChange={e => setD({ ...d, footer_link: e.target.value })} disabled={!canEdit} /></Field>
        </Section></TabsContent>

        <TabsContent value="branding"><Section disabled={!canEdit}>
          <Field label="URL logo"><Input value={d.logo_url} onChange={e => setD({ ...d, logo_url: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="URL favicon"><Input value={d.favicon_url} onChange={e => setD({ ...d, favicon_url: e.target.value })} disabled={!canEdit} /></Field>
          <Field label="Nazwa"><Input value={d.panel_name} onChange={e => setD({ ...d, panel_name: e.target.value })} disabled={!canEdit} /></Field>
        </Section></TabsContent>

        <TabsContent value="theme">
          <Section disabled={!canThemeGlobal}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-4">
              <div><p className="text-sm font-medium">Wymuś motyw globalny</p><p className="text-xs text-muted-foreground">Gdy włączone, użytkownicy nie mogą nadpisać motywu dla siebie.</p></div>
              <Switch checked={!!d.theme_locked} onCheckedChange={v => setD({ ...d, theme_locked: v })} disabled={!canThemeGlobal} />
            </div>
            <Field label="Tryb"><Select2 value={d.theme.mode} onChange={v => setD({ ...d, theme: { ...d.theme, mode: v } })} options={[{v:"dark",l:"Ciemny"},{v:"light",l:"Jasny"}]} disabled={!canThemeGlobal} /></Field>
            <ColorField label="Kolor główny (primary)" value={d.theme.primary} onChange={v => setD({ ...d, theme: { ...d.theme, primary: v } })} disabled={!canThemeGlobal} />
            <ColorField label="Kolor akcentu" value={d.theme.accent} onChange={v => setD({ ...d, theme: { ...d.theme, accent: v } })} disabled={!canThemeGlobal} />
            <ColorField label="Tło" value={d.theme.background} onChange={v => setD({ ...d, theme: { ...d.theme, background: v } })} disabled={!canThemeGlobal} />
            <ColorField label="Sidebar" value={d.theme.sidebar} onChange={v => setD({ ...d, theme: { ...d.theme, sidebar: v } })} disabled={!canThemeGlobal} />
            <Field label="Gradient (CSS)"><Input value={d.theme.gradient} onChange={e => setD({ ...d, theme: { ...d.theme, gradient: e.target.value } })} disabled={!canThemeGlobal} /></Field>
            <div className="mt-3 h-16 rounded-lg" style={{ background: d.theme.gradient }} />
          </Section>
        </TabsContent>

        <TabsContent value="finance"><Section disabled={!canEdit}>
          <Field label="Udział CEO (%)"><Input type="number" value={d.ceo_share_percent} onChange={e => setD({ ...d, ceo_share_percent: e.target.value })} disabled={!canEdit} /></Field>
          <p className="text-xs text-muted-foreground">Procent tygodniowego zarobku sellera przekazywany CEO. Stare rozliczenia nie ulegają zmianie.</p>
        </Section></TabsContent>

        <TabsContent value="system"><Section disabled={!canEdit}>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div><p className="text-sm font-medium">Rejestracja nowych kont</p><p className="text-xs text-muted-foreground">Zezwalaj na samodzielną rejestrację (tylko @kd.pl).</p></div>
            <Switch checked={!!d.allow_registration} onCheckedChange={v => setD({ ...d, allow_registration: v })} disabled={!canEdit} />
          </div>
        </Section></TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ children, disabled }) {
  return <div className={`space-y-4 max-w-2xl ${disabled ? "opacity-60" : ""}`}>{children}</div>;
}
function Field({ label, children }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function ColorField({ label, value, onChange, disabled }) {
  return <div className="space-y-2"><Label>{label}</Label><div className="flex gap-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-12 h-9 rounded-lg border border-border bg-transparent cursor-pointer" /><Input value={value} onChange={e => onChange(e.target.value)} disabled={disabled} /></div></div>;
}
function Select2({ value, onChange, options, disabled }) {
  return (
    <div className="space-y-2"><Label>Tryb</Label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
