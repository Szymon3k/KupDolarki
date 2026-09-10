import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Loader2, ArrowLeftRight } from "lucide-react";

const STATUS_LABEL = { pending: "Oczekuje", completed: "Zakończona", cancelled: "Anulowana" };
const STATUS_COLOR = { pending: "#f59e0b", completed: "#10b981", cancelled: "#ef4444" };

export default function Exchanges() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Exchange.list("-created_date", 200);
    if (!isStaff) list = list.filter((e) => e.seller_id === member.id);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((e) => !search || `${e.customer_name} ${e.item} ${e.seller_name}`.toLowerCase().includes(search.toLowerCase()));
  const save = async (d) => {
    await base44.entities.Exchange.create({ seller_id: d.seller_id, seller_name: d.seller_name, customer_name: d.customer_name, value: Number(d.value), item: d.item, status: d.status, note: d.note });
    setEdit(null); load();
  };

  return (
    <div>
      <PageHeader title="Wymiany" subtitle="Historia wymian przeprowadzonych przez sellerów"
        actions={hasPermission("exchange.create") && <Button className="gap-2" onClick={() => setEdit({ seller_id: member.id, seller_name: member.display_name, customer_name: "", value: "", item: "", status: "completed", note: "" })}><Plus className="w-4 h-4" /> Dodaj wymianę</Button>} />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj..." className="pl-9" /></div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={ArrowLeftRight} title="Brak wymian" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Data</th>
             <th className="text-left px-4 py-3 font-medium">Klient</th>
             <th className="text-left px-4 py-3 font-medium">Przedmiot</th>
             {isStaff && <th className="text-left px-4 py-3 font-medium">Seller</th>}
             <th className="text-left px-4 py-3 font-medium">Wartość</th>
             <th className="text-left px-4 py-3 font-medium">Status</th>
           </tr></thead>
           <tbody>{filtered.map((e) => (
             <tr key={e.id} className="border-t border-border hover:bg-muted/30">
               <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.created_date).toLocaleDateString("pl-PL")}</td>
               <td className="px-4 py-3">{e.customer_name || "—"}</td>
               <td className="px-4 py-3">{e.item || "—"}</td>
               {isStaff && <td className="px-4 py-3">{e.seller_name || "—"}</td>}
               <td className="px-4 py-3 font-medium">{e.value} PLN</td>
               <td className="px-4 py-3"><Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge></td>
             </tr>
           ))}</tbody>
         </table></div>}
      </div>
      {edit && <ExEditor data={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}
function ExEditor({ data, onClose, onSave }) {
  const [d, setD] = useState(data);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nowa wymiana</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Klient</Label><Input value={d.customer_name} onChange={e => setD({ ...d, customer_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Przedmiot</Label><Input value={d.item} onChange={e => setD({ ...d, item: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Wartość (PLN)</Label><Input type="number" value={d.value} onChange={e => setD({ ...d, value: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={d.status} onValueChange={v => setD({ ...d, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Notatka</Label><Textarea value={d.note} onChange={e => setD({ ...d, note: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onSave(d); } finally { setBusy(false); } }}>Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
