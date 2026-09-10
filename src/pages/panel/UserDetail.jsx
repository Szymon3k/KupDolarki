import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, StatCard, Badge } from "@/components/panel/ui";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Users, RefreshCw, ShieldCheck, ShoppingBag, ArrowLeft, Plus, Minus, Save, Loader2 } from "lucide-react";

const STATUS_LABEL = { pending: "Oczekuje", approved: "Zatwierdzony", blocked: "Zablokowany", rejected: "Odrzucony" };
const STATUS_COLOR = { pending: "#f59e0b", approved: "#10b981", blocked: "#ef4444", rejected: "#6b7280" };

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, roles } = usePanel();
  const { run } = usePanelOps();
  const [member, setMember] = useState(null);
  const [walletTx, setWalletTx] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    const m = await base44.entities.Member.get(id);
    setMember(m);
    const [wt, ea, au] = await Promise.all([
      base44.entities.WalletTransaction.filter({ member_id: id }, "-created_date", 20).catch(() => []),
      base44.entities.Earning.filter({ member_id: id }, "-created_date", 20).catch(() => []),
      base44.entities.AuditLog.filter({ object_id: id }, "-created_date", 20).catch(() => []),
    ]);
    setWalletTx(wt); setEarnings(ea); setAudits(au);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!member) return <p className="text-muted-foreground">Nie znaleziono użytkownika.</p>;

  const fmt = (n) => Math.round(n || 0) + " PLN";

  const doAction = async (action, payload, msg) => {
    await run(action, payload, { successMsg: msg, onSuccess: () => load() });
    setDialog(null);
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/users")} className="mb-3 gap-2"><ArrowLeft className="w-4 h-4" /> Wróć</Button>
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">{(member.display_name || member.email)[0].toUpperCase()}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{member.display_name}</h1>
          <p className="text-muted-foreground">{member.email}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge color={roles.find(r=>r.key===member.custom_role)?.color}>{member.role_label}</Badge>
            <Badge color={STATUS_COLOR[member.account_status]}>{STATUS_LABEL[member.account_status]}</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasPermission("roles.assign") && <Button variant="outline" size="sm" onClick={() => setDialog({ type: "role" })}>Zmień rolę</Button>}
          {hasPermission("users.edit") && <Button variant="outline" size="sm" onClick={() => setDialog({ type: "edit", display_name: member.display_name, email: member.email })}>Edytuj</Button>}
          {hasPermission("wallet.add_money") && <Button size="sm" className="gap-1" onClick={() => setDialog({ type: "wallet", mode: "credit" })}><Plus className="w-4 h-4" /> Środki</Button>}
          {hasPermission("wallet.remove_money") && <Button variant="outline" size="sm" className="gap-1" onClick={() => setDialog({ type: "wallet", mode: "debit" })}><Minus className="w-4 h-4" /> Odejmij</Button>}
          {hasPermission("earnings.edit") && <Button variant="outline" size="sm" onClick={() => setDialog({ type: "earning" })}>Dodaj zarobek</Button>}
          {hasPermission("stats.edit") && <Button variant="outline" size="sm" onClick={() => setDialog({ type: "stat" })}>Dodaj statystykę</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} accent label="Portfel" value={fmt(member.wallet_balance)} />
        <StatCard icon={TrendingUp} label="Zarobki (całkowite)" value={fmt(member.earnings_total)} sub={`Miesiąc: ${fmt(member.earnings_month)}`} />
        <StatCard icon={Users} label="Klienci" value={member.customers_count || 0} />
        <StatCard icon={ShoppingBag} label="Sprzedane" value={member.items_sold || 0} />
        <StatCard icon={RefreshCw} label="Wymiany" value={member.exchanges_count || 0} />
        <StatCard icon={ShieldCheck} label="Legitchecki" value={member.legitchecks_count || 0} />
        <StatCard icon={TrendingUp} label="Transakcje" value={member.transactions_count || 0} />
        <StatCard icon={TrendingUp} label="Zarobki (tydzień)" value={fmt(member.earnings_week)} />
      </div>

      <Tabs defaultValue="wallet">
        <TabsList className="mb-4">
          <TabsTrigger value="wallet">Historia portfela</TabsTrigger>
          <TabsTrigger value="earnings">Zarobki</TabsTrigger>
          <TabsTrigger value="audit">Historia działań</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet">
          <HistoryList items={walletTx} empty="Brak operacji portfelowych" render={(t) => (
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div>
                <p className="text-sm font-medium">{t.type === "credit" ? "+" : "-"}{t.amount} PLN</p>
                <p className="text-xs text-muted-foreground">{t.reason} • {t.performed_by_name} • {new Date(t.created_date).toLocaleString("pl-PL")}</p>
              </div>
              <span className="text-xs text-muted-foreground">{t.previous_balance} → {t.new_balance}</span>
            </div>
          )} />
        </TabsContent>
        <TabsContent value="earnings">
          <HistoryList items={earnings} empty="Brak zarobków" render={(e) => (
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div>
                <p className="text-sm font-medium">+{e.amount} PLN <Badge>{e.source}</Badge></p>
                <p className="text-xs text-muted-foreground">{e.note} • {e.added_by_name} • {new Date(e.created_date).toLocaleString("pl-PL")}</p>
              </div>
            </div>
          )} />
        </TabsContent>
        <TabsContent value="audit">
          <HistoryList items={audits} empty="Brak zapisów audytu" render={(a) => (
            <div className="py-2.5 border-b border-border">
              <p className="text-sm font-medium">{a.action} <span className="text-muted-foreground">— {a.object_label}</span></p>
              <p className="text-xs text-muted-foreground">{a.details} • {a.actor_name} • {new Date(a.created_date).toLocaleString("pl-PL")}</p>
            </div>
          )} />
        </TabsContent>
      </Tabs>

      {dialog?.type === "role" && <RoleDialog dialog={dialog} setDialog={setDialog} member={member} roles={roles} onConfirm={(rk) => doAction("change_role", { memberId: member.id, roleKey: rk }, "Rola zmieniona")} />}
      {dialog?.type === "edit" && <EditDialog dialog={dialog} setDialog={setDialog} onConfirm={(d) => doAction("update_member", { memberId: member.id, ...d }, "Dane zaktualizowane")} />}
      {dialog?.type === "wallet" && <WalletDialog dialog={dialog} setDialog={setDialog} onConfirm={(d) => doAction(dialog.mode === "credit" ? "wallet_credit" : "wallet_debit", { memberId: member.id, ...d }, "Portfel zaktualizowany")} />}
      {dialog?.type === "earning" && <EarningDialog dialog={dialog} setDialog={setDialog} onConfirm={(d) => doAction("add_earning", { memberId: member.id, ...d }, "Zarobek dodany")} />}
      {dialog?.type === "stat" && <StatDialog dialog={dialog} setDialog={setDialog} onConfirm={(d) => doAction("add_stat", { memberId: member.id, ...d }, "Statystyka dodana")} />}
    </div>
  );
}

function HistoryList({ items, empty, render }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">{empty}</p>;
  return <div className="rounded-xl border border-border bg-card p-4">{items.map(render)}</div>;
}

function Dlg({ open, onClose, title, children, onConfirm, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">{children}</div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({ dialog, setDialog, member, roles, onConfirm }) {
  const [rk, setRk] = useState(member.custom_role);
  return <Dlg open onClose={() => setDialog(null)} title="Zmień rolę" label="Zapisz" onConfirm={() => onConfirm(rk)}>
    <Select value={rk} onValueChange={setRk}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent></Select>
  </Dlg>;
}
function EditDialog({ dialog, setDialog, onConfirm }) {
  const [d, setD] = useState({ display_name: dialog.display_name, email: dialog.email });
  return <Dlg open onClose={() => setDialog(null)} title="Edytuj dane" label="Zapisz" onConfirm={() => onConfirm(d)}>
    <div className="space-y-2"><Label>Nazwa wyświetlana</Label><Input value={d.display_name} onChange={e => setD({ ...d, display_name: e.target.value })} /></div>
    <div className="space-y-2"><Label>E-mail</Label><Input value={d.email} onChange={e => setD({ ...d, email: e.target.value })} /></div>
  </Dlg>;
}
function WalletDialog({ dialog, setDialog, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  return <Dlg open onClose={() => setDialog(null)} title={dialog.mode === "credit" ? "Dodaj środki" : "Odejmij środki"} label="Zatwierdź" onConfirm={() => onConfirm({ amount: Number(amount), reason })}>
    <div className="space-y-2"><Label>Kwota (PLN)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
    <div className="space-y-2"><Label>Powód</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="np. sprzedaż itemów" /></div>
  </Dlg>;
}
function EarningDialog({ setDialog, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("manual");
  const [note, setNote] = useState("");
  return <Dlg open onClose={() => setDialog(null)} title="Dodaj zarobek" label="Dodaj" onConfirm={() => onConfirm({ amount: Number(amount), source, note })}>
    <div className="space-y-2"><Label>Kwota (PLN)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
    <div className="space-y-2"><Label>Źródło</Label><Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Ręcznie</SelectItem><SelectItem value="transaction">Transakcja</SelectItem><SelectItem value="exchange">Wymiana</SelectItem><SelectItem value="legitcheck">Legitcheck</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label>Notatka</Label><Input value={note} onChange={e => setNote(e.target.value)} /></div>
  </Dlg>;
}
function StatDialog({ setDialog, onConfirm }) {
  const [statType, setStatType] = useState("customers");
  const [count, setCount] = useState("1");
  return <Dlg open onClose={() => setDialog(null)} title="Dodaj statystykę" label="Dodaj" onConfirm={() => onConfirm({ statType, count: Number(count) })}>
    <div className="space-y-2"><Label>Typ</Label><Select value={statType} onValueChange={setStatType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customers">Klienci</SelectItem><SelectItem value="transactions">Transakcje</SelectItem><SelectItem value="exchanges">Wymiany</SelectItem><SelectItem value="legitchecks">Legitchecki</SelectItem><SelectItem value="items">Sprzedane itemy</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label>Liczba</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
  </Dlg>;
}
