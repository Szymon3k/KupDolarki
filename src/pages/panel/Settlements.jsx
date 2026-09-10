import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Check, Loader2, CalendarPlus } from "lucide-react";

export default function Settlements() {
  const { member, hasPermission, settings } = usePanel();
  const { run } = usePanelOps();
  const isStaff = hasPermission("settlements.manage");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("due");

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Settlement.list("-created_date", 200);
    if (!isStaff) list = list.filter((s) => s.member_id === member.id);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((s) => tab === "due" ? s.status === "due" : s.status === "paid");
  const markPaid = async (s) => { await run("mark_settlement_paid", { settlementId: s.id }, { successMsg: "Oznaczono jako opłacone", onSuccess: () => load() }); };

  return (
    <div>
      <PageHeader title="Rozliczenia" subtitle={`Udział CEO: ${settings?.ceo_share_percent || 25}% tygodniowego zarobku sellera`}
        actions={isStaff && <Button className="gap-2" onClick={() => setCreateOpen(true)}><CalendarPlus className="w-4 h-4" /> Utwórz okres rozliczeniowy</Button>} />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("due")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "due" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Do zapłaty ({items.filter(s=>s.status==="due").length})</button>
        <button onClick={() => setTab("paid")} className={`px-3 py-1.5 rounded-lg text-sm ${tab === "paid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Historia (opłacone)</button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={FileText} title="Brak rozliczeń" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Seller</th>
             <th className="text-left px-4 py-3 font-medium">Okres</th>
             <th className="text-left px-4 py-3 font-medium">Zarobek</th>
             <th className="text-left px-4 py-3 font-medium">CEO ({settings?.ceo_share_percent || 25}%)</th>
             <th className="text-left px-4 py-3 font-medium">Seller</th>
             <th className="text-left px-4 py-3 font-medium">Status</th>
             {isStaff && tab === "due" && <th className="text-right px-4 py-3 font-medium">Akcja</th>}
           </tr></thead>
           <tbody>{filtered.map((s) => (
             <tr key={s.id} className="border-t border-border hover:bg-muted/30">
               <td className="px-4 py-3 font-medium">{s.member_name}</td>
               <td className="px-4 py-3 text-xs text-muted-foreground">{s.period_label}</td>
               <td className="px-4 py-3">{s.revenue} PLN</td>
               <td className="px-4 py-3 text-amber-500 font-medium">{s.ceo_amount} PLN</td>
               <td className="px-4 py-3 text-emerald-500 font-medium">{s.seller_amount} PLN</td>
               <td className="px-4 py-3"><Badge color={s.status === "paid" ? "#10b981" : "#f59e0b"}>{s.status === "paid" ? "Zapłacono" : "Do zapłaty"}</Badge></td>
               {isStaff && tab === "due" && <td className="px-4 py-3 text-right">{hasPermission("settlements.manage") && <button onClick={() => markPaid(s)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs hover:bg-emerald-500/20"><Check className="w-3.5 h-3.5" /> Oznacz opłacone</button>}</td>}
             </tr>
           ))}</tbody>
         </table></div>}
      </div>

      {createOpen && <CreatePeriod onClose={() => setCreateOpen(false)} onConfirm={async (d) => { await run("create_settlement_period", d, { successMsg: "Okres rozliczeniowy utworzony", onSuccess: () => load() }); setCreateOpen(false); }} />}
    </div>
  );
}

function CreatePeriod({ onClose, onConfirm }) {
  const today = new Date();
  const monday = new Date(today); monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const [start, setStart] = useState(fmt(monday));
  const [end, setEnd] = useState(fmt(sunday));
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Utwórz okres rozliczeniowy</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">System wygeneruje rozliczenia dla wszystkich aktywnych sellerów na podstawie ich zarobków tygodniowych.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Od</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div className="space-y-2"><Label>Do</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm({ periodStart: start, periodEnd: end, periodLabel: start + " — " + end }); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Utwórz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
