import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, EmptyState } from "@/components/panel/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ScrollText } from "lucide-react";

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.AuditLog.list("-created_date", 200);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const actions = ["all", ...Array.from(new Set(items.map(i => i.action.split(".")[0])))];
  const filtered = items.filter((a) => {
    if (actionFilter !== "all" && !a.action.startsWith(actionFilter)) return false;
    if (search && !(`${a.actor_name} ${a.action} ${a.object_label} ${a.details}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Logi audytu" subtitle="Historia wszystkich działań administracyjnych" />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj w logach..." className="pl-9" /></div>
        <Select value={actionFilter} onValueChange={setActionFilter}><SelectTrigger className="w-[180px]"><SelectValue /><SelectContent>{actions.map(a => <SelectItem key={a} value={a}>{a === "all" ? "Wszystkie akcje" : a}</SelectItem>)}</SelectContent></SelectTrigger></Select>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={ScrollText} title="Brak logów" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Data</th>
             <th className="text-left px-4 py-3 font-medium">Osoba</th>
             <th className="text-left px-4 py-3 font-medium">Akcja</th>
             <th className="text-left px-4 py-3 font-medium">Obiekt</th>
             <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Szczegóły</th>
           </tr></thead>
           <tbody>{filtered.map((a) => (
             <tr key={a.id} className="border-t border-border hover:bg-muted/30">
               <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_date).toLocaleString("pl-PL")}</td>
               <td className="px-4 py-3">{a.actor_name}</td>
               <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{a.action}</span></td>
               <td className="px-4 py-3">{a.object_label || a.object_type}</td>
               <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{a.details}</td>
             </tr>
           ))}</tbody>
         </table></div>}
      </div>
    </div>
  );
}
