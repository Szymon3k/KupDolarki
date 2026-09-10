import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Search, Check, X, Ban, Users as UsersIcon, Loader2, Download, UserCog } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

const STATUS_LABEL = { pending: "Oczekuje", approved: "Zatwierdzony", blocked: "Zablokowany", rejected: "Odrzucony" };
const STATUS_COLOR = { pending: "#f59e0b", approved: "#10b981", blocked: "#ef4444", rejected: "#6b7280" };

export default function Users() {
  const { hasPermission, roles } = usePanel();
  const { run } = usePanelOps();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [confirm, setConfirm] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkRole, setBulkRole] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Member.list("-created_date", 200);
    setMembers(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) => {
    if (tab === "pending" && m.account_status !== "pending") return false;
    if (tab !== "pending" && statusFilter !== "all" && m.account_status !== statusFilter) return false;
    if (roleFilter !== "all" && m.custom_role !== roleFilter) return false;
    if (search && !(`${m.display_name} ${m.email}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const act = async (action, memberId, extra = {}) => {
    await run(action, { memberId, ...extra }, { onSuccess: () => load() });
    setConfirm(null);
  };

  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((m) => m.id)));
  const clearSel = () => setSelected(new Set());

  const bulkBlock = async (block) => {
    setBulkBusy(true);
    try {
      for (const id of [...selected]) {
        const m = members.find((x) => x.id === id);
        if (!m) continue;
        if (block && m.account_status === "approved") await run("block_member", { memberId: id }, { successMsg: false });
        if (!block && m.account_status === "blocked") await run("unblock_member", { memberId: id }, { successMsg: false });
      }
      await load(); clearSel();
      toast({ title: block ? "Konta zablokowane" : "Konta odblokowane", variant: "success" });
    } catch {} finally { setBulkBusy(false); }
  };

  const bulkChangeRole = async () => {
    if (!bulkRole) return;
    setBulkBusy(true);
    try {
      for (const id of [...selected]) await run("change_role", { memberId: id, roleKey: bulkRole }, { successMsg: false });
      await load(); clearSel(); setBulkRole("");
      toast({ title: "Rola zmieniona", variant: "success" });
    } catch {} finally { setBulkBusy(false); }
  };

  const exportCSV = () => {
    const rows = members.filter((m) => selected.has(m.id));
    const lines = [["Imie", "Email", "Rola", "Status", "Zarobki", "Klienci", "Transakcje"].join(";")];
    for (const m of rows) {
      lines.push([m.display_name || "", m.email || "", m.role_label || "", STATUS_LABEL[m.account_status] || "", Math.round(m.earnings_total || 0), m.customers_count || 0, m.transactions_count || 0].join(";"));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "uzytkownicy.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Użytkownicy" subtitle="Zarządzaj kontami, rolami i statusami"
        actions={hasPermission("users.create") && <Button onClick={() => setCreateOpen(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Utwórz użytkownika</Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTab("all")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Wszyscy</button>
        <button onClick={() => setTab("pending")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "pending" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Oczekujący ({members.filter(m=>m.account_status==="pending").length})</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj..." className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Rola" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie role</SelectItem>
            {roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {tab !== "pending" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-sm font-medium mr-2">Zaznaczono {selected.size}</span>
          {hasPermission("roles.assign") && (
            <div className="flex items-center gap-2">
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Zmień rolę na..." /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" disabled={bulkBusy || !bulkRole} onClick={bulkChangeRole} className="gap-2"><UserCog className="w-4 h-4" /> Zastosuj</Button>
            </div>
          )}
          {hasPermission("users.block") && <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkBlock(true)} className="gap-2"><Ban className="w-4 h-4" /> Zablokuj</Button>}
          {hasPermission("users.block") && <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkBlock(false)} className="gap-2"><Check className="w-4 h-4" /> Odblokuj</Button>}
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" /> Eksportuj CSV</Button>
          <Button size="sm" variant="ghost" onClick={clearSel}>Odznacz</Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
         filtered.length === 0 ? <EmptyState icon={UsersIcon} title="Brak użytkowników" description="Nie znaleziono użytkowników spełniających kryteria." /> :
         <div className="overflow-x-auto">
           <table className="w-full text-sm">
             <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
               <tr>
                 <th className="px-4 py-3 w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Zaznacz wszystkie" /></th>
                 <th className="text-left px-4 py-3 font-medium">Użytkownik</th>
                 <th className="text-left px-4 py-3 font-medium">Rola</th>
                 <th className="text-left px-4 py-3 font-medium">Status</th>
                 <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Zarobek</th>
                 <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Klienci</th>
                 <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Trans.</th>
                 <th className="text-right px-4 py-3 font-medium">Akcje</th>
               </tr>
             </thead>
             <tbody>
               {filtered.map((m) => (
                 <tr key={m.id} className={`border-t border-border hover:bg-muted/30 ${selected.has(m.id) ? "bg-primary/5" : ""}`}>
                   <td className="px-4 py-3"><Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label="Zaznacz" /></td>
                   <td className="px-4 py-3">
                     <Link to={`/users/${m.id}`} className="flex items-center gap-3 hover:text-primary">
                       <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{(m.display_name || m.email)[0].toUpperCase()}</div>
                       <div>
                         <p className="font-medium">{m.display_name}</p>
                         <p className="text-xs text-muted-foreground">{m.email}</p>
                       </div>
                     </Link>
                   </td>
                   <td className="px-4 py-3"><Badge color={roles.find(r=>r.key===m.custom_role)?.color}>{m.role_label}</Badge></td>
                   <td className="px-4 py-3"><Badge color={STATUS_COLOR[m.account_status]}>{STATUS_LABEL[m.account_status]}</Badge></td>
                   <td className="px-4 py-3 hidden md:table-cell">{Math.round(m.earnings_total||0)} PLN</td>
                   <td className="px-4 py-3 hidden lg:table-cell">{m.customers_count||0}</td>
                   <td className="px-4 py-3 hidden lg:table-cell">{m.transactions_count||0}</td>
                   <td className="px-4 py-3">
                     <div className="flex items-center justify-end gap-1">
                       {m.account_status === "pending" && hasPermission("users.approve") && (
                         <>
                           <button title="Zatwierdź" onClick={() => setConfirm({ action: "approve_member", id: m.id, label: "Zatwierdź", msg: `Zatwierdzić konto ${m.email}?` })} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10"><Check className="w-4 h-4" /></button>
                           <button title="Odrzuć" onClick={() => setConfirm({ action: "reject_member", id: m.id, label: "Odrzuć", msg: `Odrzucić konto ${m.email}? Użytkownik zostanie zablokowany.`, variant: "destructive" })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><X className="w-4 h-4" /></button>
                         </>
                       )}
                       {m.account_status === "approved" && hasPermission("users.block") && (
                         <button title="Zablokuj" onClick={() => setConfirm({ action: "block_member", id: m.id, label: "Zablokuj", msg: `Zablokować ${m.email}?`, variant: "destructive" })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Ban className="w-4 h-4" /></button>
                       )}
                       {m.account_status === "blocked" && hasPermission("users.block") && (
                         <button title="Odblokuj" onClick={() => setConfirm({ action: "unblock_member", id: m.id, label: "Odblokuj", msg: `Odblokować ${m.email}?` })} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10"><Check className="w-4 h-4" /></button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.label || ""}
        description={confirm?.msg}
        confirmLabel={confirm?.label}
        variant={confirm?.variant}
        onConfirm={() => act(confirm.action, confirm.id)}
      />
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} roles={roles} />
    </div>
  );
}

function CreateUserDialog({ open, onClose, onCreated, roles }) {
  const { run } = usePanelOps();
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("seller");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await run("invite_user", { email, roleKey }, { successMsg: "Zaproszenie wysłane" });
      onCreated(); onClose(); setEmail(""); setRoleKey("seller");
    } catch {} finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Utwórz użytkownika</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Zostanie wysłane zaproszenie na podany e-mail. Użytkownik uzupełni hasło przy pierwszym logowaniu.</p>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="np. jan@gmail.com" />
          </div>
          <div className="space-y-2">
            <Label>Rola</Label>
            <Select value={roleKey} onValueChange={setRoleKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={submit} disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Wyślij zaproszenie</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
