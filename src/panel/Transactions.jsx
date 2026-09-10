import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Loader2, Receipt } from "lucide-react";

const STATUS_LABEL = { pending: "Oczekuje", completed: "Zakończona", cancelled: "Anulowana", refunded: "Zwrócona" };
const STATUS_COLOR = { pending: "#f59e0b", completed: "#10b981", cancelled: "#ef4444", refunded: "#6b7280" };

export default function Transactions() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Transaction.list("-created_date", 200);
    if (!isStaff) list = list.filter((t) => t.seller_id === member.id);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !(`${t.customer_name} ${t.product_name} ${t.seller_name}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const save = async (data) => {
    const created = await base44.entities.Transaction.create({ seller_id: data.seller_id, seller_name: data.seller_name, customer_name: data.customer_name, product_name: data.product_name, amount: Number(data.amount), status: data.status, method: data.method, note: data.note, is_demo: false });
    // Powiadom adminów na Slacku po sfinalizowaniu transakcji (best-effort, nie blokuje zapisu)
    if (String(data.status).toLowerCase() === "completed") {
      base44.functions.invoke("slackNotify", { transaction: created }).catch(() => {});
    }
    setEdit(null); load();
  };

  return (
    <div>
      <PageHeader title="Transakcje" subtitle="Historia sprzedaży i płatności"
        actions={hasPermission("transactions.create") && <Button className="gap-2" onClick={() => setEdit({ seller_id: member.id, seller_name: member.display_name, customer_name: "", product_name: "", amount: "", status: "completed", method: "PayPal", note: "" })}><Plus className="w-4 h-4" /> Dodaj transakcję</Button>} />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Wszystkie</SelectItem>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={Receipt} title="Brak transakcji" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Data</th>
             <th className="text-left px-4 py-3 font-medium">Klient</th>
             <th className="text-left px-4 py-3 font-medium">Produkt</th>
             {isStaff && <th className="text-left px-4 py-3 font-medium">Seller</th>}
             <th className="text-left px-4 py-3 font-medium">Kwota</th>
             <th className="text-left px-4 py-3 font-medium">Status</th>
             <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Metoda</th>
           </tr></thead>
           <tbody>{filtered.map((t) => (
             <tr key={t.id} className="border-t border-border hover:bg-muted/30">
               <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_date).toLocaleDateString("pl-PL")}</td>
               <td className="px-4 py-3">{t.customer_name || "—"}</td>
               <td className="px-4 py-3">{t.product_name || "—"}</td>
               {isStaff && <td className="px-4 py-3">{t.seller_name || "—"}</td>}
               <td className="px-4 py-3 font-medium">{t.amount} PLN</td>
               <td className="px-4 py-3"><Badge color={STATUS_COLOR[t.status]}>{STATUS_LABEL[t.status]}</Badge></td>
               <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{t.method || "—"}</td>
             </tr>
           ))}</tbody>
         </table></div>}
      </div>
      {edit && <TxEditor data={edit} onClose={() => setEdit(null)} onSave={save} isStaff={isStaff} />}
    </div>
  );
}

function TxEditor({ data, onClose, onSave, isStaff }) {
  const [d, setD] = useState(data);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nowa transakcja</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Klient</Label><Input value={d.customer_name} onChange={e => setD({ ...d, customer_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Produkt</Label><Input value={d.product_name} onChange={e => setD({ ...d, product_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Kwota (PLN)</Label><Input type="number" value={d.amount} onChange={e => setD({ ...d, amount: e.target.value })} /></div>
            <div className="space-y-2"><Label>Metoda</Label><Input value={d.method} onChange={e => setD({ ...d, method: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Status</Label><Select value={d.status} onValueChange={v => setD({ ...d, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Notatka</Label><Input value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onSave(d); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
