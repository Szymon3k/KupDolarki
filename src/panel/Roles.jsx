import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

const PERM_GROUPS = {
  "Użytkownicy": ["users.view","users.create","users.edit","users.delete","users.block","users.approve"],
  "Role": ["roles.view","roles.create","roles.edit","roles.delete","roles.assign"],
  "Sklep": ["shop.view","shop.create","shop.edit","shop.delete"],
  "Transakcje": ["transactions.view","transactions.create","transactions.edit"],
  "Portfel": ["wallet.view","wallet.edit","wallet.add_money","wallet.remove_money"],
  "Statystyki": ["stats.view","stats.edit"],
  "Legitcheck": ["legitcheck.view","legitcheck.create","legitcheck.edit","legitcheck.delete"],
  "Wymiany": ["exchange.view","exchange.create","exchange.edit","exchange.delete"],
  "Klienci": ["customers.view","customers.create","customers.edit"],
  "Ogłoszenia": ["announcements.view","announcements.create","announcements.edit","announcements.delete"],
  "Powiadomienia": ["notifications.view"],
  "Rozliczenia": ["settlements.view","settlements.manage"],
  "Ustawienia": ["settings.view","settings.edit","theme.personal","theme.global"],
  "Audyt": ["audit.view"],
  "Zarobki": ["earnings.view","earnings.edit"],
};

export default function Roles() {
  const { hasPermission } = usePanel();
  const { run } = usePanelOps();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);

  const load = async () => { setLoading(true); setRoles(await base44.entities.Role.list()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    if (data.id) await run("update_role", { roleId: data.id, label: data.label, level: data.level, permissions: data.permissions, color: data.color }, "Rola zaktualizowana");
    else await run("create_role", { key: data.key, label: data.label, level: data.level, permissions: data.permissions, color: data.color }, "Rola utworzona");
    setEdit(null); load();
  };
  const del = async (r) => { await run("delete_role", { roleId: r.id }, "Rola usunięta"); load(); };

  return (
    <div>
      <PageHeader title="Role i uprawnienia" subtitle="Definiuj role i przypisuj uprawnienia"
        actions={hasPermission("roles.create") && <Button className="gap-2" onClick={() => setEdit({ key: "", label: "", level: 3, permissions: [], color: "#64748b" })}><Plus className="w-4 h-4" /> Utwórz rolę</Button>} />

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div> :
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: (r.color || "#64748b") + "22" }}><ShieldCheck className="w-5 h-5" style={{ color: r.color }} /></div>
                  <div>
                    <p className="font-semibold">{r.label} {r.is_system && <Badge>systemowa</Badge>}</p>
                    <p className="text-xs text-muted-foreground">Poziom {r.level} • {r.permissions?.length || 0} uprawnień</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {hasPermission("roles.edit") && <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => setEdit(r)}><Pencil className="w-4 h-4" /></button>}
                  {hasPermission("roles.delete") && !r.is_system && <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => del(r)}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(r.permissions || []).slice(0, 8).map((p) => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>)}
                {(r.permissions || []).length > 8 && <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{r.permissions.length - 8} więcej</span>}
              </div>
            </div>
          ))}
        </div>
      }

      {edit && <RoleEditor role={edit} onClose={() => setEdit(null)} onSave={save} canEditKey={!edit.id} />}
    </div>
  );
}

function RoleEditor({ role, onClose, onSave, canEditKey }) {
  const [d, setD] = useState(role);
  const toggle = (p) => setD({ ...d, permissions: d.permissions.includes(p) ? d.permissions.filter(x => x !== p) : [...d.permissions, p] });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{role.id ? "Edytuj rolę" : "Nowa rola"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Klucz</Label><Input value={d.key} disabled={!canEditKey} onChange={e => setD({ ...d, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="np. moderator" /></div>
          <div className="space-y-2"><Label>Etykieta</Label><Input value={d.label} onChange={e => setD({ ...d, label: e.target.value })} /></div>
          <div className="space-y-2"><Label>Poziom</Label><Input type="number" value={d.level} onChange={e => setD({ ...d, level: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Kolor (hex)</Label><Input value={d.color} onChange={e => setD({ ...d, color: e.target.value })} /></div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Uprawnienia</p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {Object.entries(PERM_GROUPS).map(([group, perms]) => (
              <div key={group}>
                <p className="text-xs uppercase text-muted-foreground mb-1">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {perms.map((p) => (
                    <button key={p} type="button" onClick={() => toggle(p)} className={`text-xs px-2 py-1 rounded-md border transition-colors ${d.permissions.includes(p) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>{p}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={() => onSave(d)} disabled={!d.label || (!d.id && !d.key)}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
