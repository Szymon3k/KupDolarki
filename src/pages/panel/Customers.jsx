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
import { Plus, Search, Loader2, Users } from "lucide-react";

const STATUS_LABEL = { new: "Nowy", served: "Obsłużony", returning: "Stały" };
const STATUS_COLOR = { new: "#3b82f6", served: "#10b981", returning: "#a855f7" };

export default function Customers() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Customer.list("-created_date", 200);
    if (!isStaff) list = list.filter((c) => c.seller_id === member.id);
    setItems(list); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => !search || `${c.name} ${c.contact} ${c.seller_name}`.toLowerCase().includes(search.toLowerCase()));
  const save = async (d) => {
    await base44.entities.Customer.create({ seller_id: d.seller_id, seller_name: d.seller_name, name: d.name, contact: d.contact, total_spent: Number(d.total_spent) || 0, status: d.status, note: d.note });
    setEdit(null); load();
  };

  return (
    <div>
      <PageHeader title="Klienci" subtitle="Baza obsłużonych klientów"
        actions={hasPermission("customers.create") && <Button className="gap-2" onClick={() => setEdit({ seller_id: member.id, seller_name: member.display_name, name: "", contact: "", total_spent: 0, status: "new", note: "" })}><Plus className="w-4 h-4" /> Dodaj klienta</Button>} />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj klientów..." className="pl-9" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         filtered.length === 0 ? <EmptyState icon={Users} title="Brak klientów" /> :
         <div className="overflow-x-auto"><table className="w-full text-sm">
           <thead className="bg-muted/50 text-muted-foreground text-xs uppercase"><tr>
             <th className="text-left px-4 py-3 font-medium">Nazwa</th>
             <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Kontakt</th>
             {isStaff && <th className="text-left px-4 py-3 font-medium">Seller</th>}
             <th className="text-left px-4 py-3 font-medium">Wydano</th>
             <th className="text-left px-4 py-3 font-medium">Status</th>
           </tr></thead>
 
