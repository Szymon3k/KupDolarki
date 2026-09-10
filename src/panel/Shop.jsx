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
import { Plus, Search, Pencil, Trash2, Copy, Archive, Loader2, Package } from "lucide-react";
import { Image } from "@/components/ui/image";

const STATUS_LABEL = { active: "Aktywny", inactive: "Nieaktywny", sold_out: "Wyprzedany", archived: "Archiwalny" };
const STATUS_COLOR = { active: "#10b981", inactive: "#6b7280", sold_out: "#f59e0b", archived: "#94a3b8" };

export default function Shop() {
  const { member, hasPermission } = usePanel();
  const isStaff = hasPermission("users.view");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    let list = await base44.entities.Product.list("-created_date", 200);
    if (!isStaff) list = list.filter((p) => p.seller_id === member.id);
    setProducts(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !(`${p.name} ${p.game_server} ${p.category}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const save = async (data) => {
    if (data.id) await base44.entities.Product.update(data.id, { name: data.name, description: data.description, price: data.price, category: data.category, game_server: data.game_server, image_url: data.image_url, quantity: data.quantity, status: data.status, tags: data.tags });
    else await base44.entities.Product.create({ name: data.name, description: data.description, price: Number(data.price), category: data.category, game_server: data.game_server, seller_id: member.id, seller_name: member.display_name, image_url: data.image_url, quantity: Number(data.quantity) || 1, status: data.status || "active", tags: data.tags ? data.tags.split(",").map(t=>t.trim()) : [], is_demo: false });
    setEdit(null); load();
  };
  const duplicate = async (p) => { await base44.entities.Product.create({ ...p, id: undefined, name: p.name + " (kopia)", status: "inactive" }); load(); };
  const archive = async (p) => { await base44.entities.Product.update(p.id, { status: "archived" }); load(); };
  const del = async (p) => { await base44.entities.Product.delete(p.id); load(); };

  return (
    <div>
      <PageHeader title="Sklep" subtitle="Zarządzaj ofertami kupdolarki.pl"
        actions={hasPermission("shop.create") && <Button className="gap-2" onClick={() => setEdit({ name: "", price: "", category: "", game_server: "", description: "", image_url: "", quantity: 1, status: "active", tags: "" })}><Plus className="w-4 h-4" /> Dodaj produkt</Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj produktów..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div> :
       filtered.length === 0 ? <EmptyState icon={Package} title="Brak produktów" description="Dodaj pierwszy produkt do sklepu." /> :
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {filtered.map((p) => (
           <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
             <div className="aspect-video bg-muted flex items-center justify-center">
               {p.image_url ? <Image src={p.image_url} fittingType="fill" className="w-full h-full" /> : <Package className="w-10 h-10 text-muted-foreground" />}
             </div>
             <div className="p-4">
               <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.game_server || "—"}</p>
                </div>
                <Badge color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge>
               </div>
               <p className="text-lg font-bold mt-2">{p.price} PLN</p>
               <p className="text-xs text-muted-foreground">Ilość: {p.quantity} • {p.category || "bez kategorii"}</p>
               <div className="flex gap-1 mt-3">
                 {hasPermission("shop.edit") && <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => setEdit(p)}><Pencil className="w-4 h-4" /></button>}
                 {hasPermission("shop.edit") && <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => duplicate(p)} title="Duplikuj"><Copy className="w-4 h-4" /></button>}
                 {hasPermission("shop.edit") && p.status !== "archived" && <button className="p-1.5 rounded-lg hover:bg-muted" onClick={() => archive(p)} title="Archiwizuj"><Archive className="w-4 h-4" /></button>}
                 {hasPermission("shop.delete") && <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 ml-auto" onClick={() => del(p)}><Trash2 className="w-4 h-4" /></button>}
               </div>
             </div>
           </div>
         ))}
       </div>}

      {edit && <ProductEditor product={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}

function ProductEditor({ product, onClose, onSave }) {
  const [d, setD] = useState({ ...product, tags: Array.isArray(product.tags) ? product.tags.join(", ") : (product.tags || "") });
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product.id ? "Edytuj produkt" : "Nowy produkt"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Nazwa</Label><Input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Cena (PLN)</Label><Input type="number" value={d.price} onChange={e => setD({ ...d, price: e.target.value })} /></div>
            <div className="space-y-2"><Label>Ilość</Label><Input type="number" value={d.quantity} onChange={e => setD({ ...d, quantity: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Kategoria</Label><Input value={d.category} onChange={e => setD({ ...d, category: e.target.value })} placeholder="np. Anarchia.gg" /></div>
            <div className="space-y-2"><Label>Gra/Serwer</Label><Input value={d.game_server} onChange={e => setD({ ...d, game_server: e.target.value })} placeholder="np. Anarchia.gg" /></div>
          </div>
          <div className="space-y-2"><Label>URL zdjęcia</Label><Input value={d.image_url} onChange={e => setD({ ...d, image_url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Opis</Label><Textarea value={d.description} onChange={e => setD({ ...d, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Status</Label><Select value={d.status} onValueChange={v => setD({ ...d, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Tagi (oddzielone przecinkiem)</Label><Input value={d.tags} onChange={e => setD({ ...d, tags: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button disabled={busy || !d.name} onClick={async () => { setBusy(true); try { await onSave(d); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
