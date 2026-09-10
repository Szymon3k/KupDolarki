import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, Loader2 } from "lucide-react";

export default function Earnings() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const { run } = usePanelOps();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [add, setAdd] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Earning.list("-created_date", 100);
    if (!isStaff) list = list.filter((e) => e.member_id === member.id);
    setEarnings(list);
    if (isStaff) setMembers(await base44.entities.Member.list());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmt = (n) => Math.round(n || 0) + " PLN";

  return (
    <div>
      <PageHeader title="Zarobki" subtitle={isStaff ? "Zarobki wszystkich sellerów" : "Twoje zarobki"}
        actions={hasPermission("earnings.edit") && <Button className="gap-2" onClick={() => setAdd({ member_id: member.id, amount: "", source: "manual", note: "" })}><Plus className="w-4 h-4" /> Dodaj zarobek</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} accent label="Całkowite" value={fmt(member?.earnings_total)} />
        <StatCard icon={TrendingUp} label="Ten miesiąc" value={fmt(member?.earnings_month)} />
        <StatCard icon={TrendingUp} label="Poprzedni miesiąc" value={fmt(member?.earnings_last_month)} />
        <StatCard icon={TrendingUp} label="Ten tydzień" value={fmt(member?.earnings_week)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">Historia zarobków</h3>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         earnings.length === 0 ? <EmptyState icon={TrendingUp} title="Brak wpisów" /> :
         <div>{earnings.map((e) => (
           <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
             <div>
               <p className="text-sm font-medium">+{e.amount} PLN <Badge>{e.source}</Badge></p>
               <p className="text-xs text-muted-foreground">{e.note} • {e.added_by_name} • {new Date(e.created_date).toLocaleString("pl-PL")}</p>
             </div>
             {isStaff && <span className="text-xs text-muted-foreground">{e.member_name}</span>}
           </div>
         ))}</div>}
      </div>

      {add && <AddEarning data={add} members={members} isStaff={isStaff} onClose={() => setAdd(null)} onConfirm={async (d) => { await run("add_earning", d, { successMsg: "Zarobek dodany", onSuccess: () => load() }); setAdd(null); }} />}
    </div>
  );
}

function AddEarning({ data, members, isStaff, onClose, onConfirm }) {
  const [d, setD] = useState(data);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Dodaj zarobek</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {isStaff && <div className="space-y-2"><Label>Seller</Label><Select value={d.member_id} onValueChange={v => setD({ ...d, member_id: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{members.filter(m=>m.account_status==="approved").map(m => <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-2"><Label>Kwota (PLN)</Label><Input type="number" value={d.amount} onChange={e => setD({ ...d, amount: e.target.value })} /></div>
          <div className="space-y-2"><Label>Źródło</Label><Select value={d.source} onValueChange={v => setD({ ...d, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Ręcznie</SelectItem><SelectItem value="transaction">Transakcja</SelectItem><SelectItem value="exchange">Wymiana</SelectItem><SelectItem value="legitcheck">Legitcheck</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Notatka</Label><Input value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm({ ...d, amount: Number(d.amount) }); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Dodaj</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
