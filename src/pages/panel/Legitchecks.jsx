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
import { Plus, Search, Loader2, ShieldCheck } from "lucide-react";

const STATUS_LABEL = { pending: "Oczekuje", verified: "Zweryfikowany", fake: "Fałszywy", inconclusive: "Nieokreślony" };
const STATUS_COLOR = { pending: "#f59e0b", verified: "#10b981", fake: "#ef4444", inconclusive: "#6b7280" };

export default function Legitchecks() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.LegitCheck.list("-created_date", 200);
    if (!isStaff) list = list.filter((l) => l.seller_id === member.id);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((l) => !search || `${l.customer_name} ${l.product_name} ${l.seller_name}`.toLowerCase().includes(search.toLowerCase()));
  const save = async (d) => {
    await base44.entities.LegitCheck.create({ seller_id: d.seller_id, seller_name: d.seller_name, customer_name: d.customer_name, product_name: d.product_name, status: d.status, note: d.note, added_by: member.id });
    setEdit(null); load();
  };

  return (
    <div>
      <PageHeader title="Legitcheck" subtitle="Weryfikacja autentyczności przedmiotów"
        actions={hasPermission("legitcheck.create") && <Button className="gap-2" onClick={() => setEdit({ seller_id: member.id, seller_name: member.display_name, customer_name: "", product_name: "", status: "verified", note: "" })}><Plus className="w-4 h-4" /> Dodaj legitcheck</Button>} />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj..." className="pl-9" /></div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={ShieldCheck} title="Brak legitchecków" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Data</th>
             <th className="text-left px-4 py-3 font-medium">Klient</th>
             <th className="text-left px-4 py-3 font-medium">Produkt</th>
             {isStaff && <th className="text-left px-4 py-3 font-medium">Seller</th>}
             <th className="text-left px-4 py-3 font-medium">Status</th>
           </tr></thead>
           <tbody>{filtered.map((l) => (
             <tr key={l.id} className="border-t border-border hover:bg-muted/30">
               <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_date).toLocaleDateString("pl-PL")}</td>
               <td className="px-4 py-3">{l.customer_name || "—"}</td>
               <td className="px-4 py-3">{l.product_name || "—"}</td>
               {isStaff && <td className="px-4 py-3">{l.seller_name || "—"}</td>}
               <td className="px-4 py-3"><Badge color={STATUS_COLOR[l.status]}>{STATUS_LABEL[l.status]}</Badge></td>
             </tr>
           ))}</tbody>
         </table></div>}
      </div>
      {edit && <LcEditor data={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}
function LcEditor({ data, onClose, onSave }) {
  const [d, setD] = useState(data);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nowy legitcheck</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Klient</Label><Input value={d.customer_name} onChange={e => setD({ ...d, customer_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Produkt</Label><Input value={d.product_name} onChange={e => setD({ ...d, product_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={d.status} onValueChange={v => setD({ ...d, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Notatka</Label><Textarea value={d.note} onChange={e => setD({ ...d, note: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onSave(d); } finally { setBusy(false); } }}>Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
