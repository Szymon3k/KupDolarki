import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { usePanelOps } from "@/lib/usePanelOps";
import { PageHeader, Badge, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus, Trash2, Loader2 } from "lucide-react";

const TYPE_LABEL = { info: "Informacyjne", important: "Ważne", urgent: "Pilne", system: "Systemowe" };
const TYPE_COLOR = { info: "#3b82f6", important: "#f59e0b", urgent: "#ef4444", system: "#a855f7" };

export default function Announcements() {
  const { hasPermission } = usePanel();
  const { run } = usePanelOps();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => { setLoading(true); setItems(await base44.entities.Announcement.list("-created_date", 100)); setLoading(false); };
  useEffect(() => { load(); }, []);

  const del = async (a) => { await run("delete_announcement", { announcementId: a.id }, { successMsg: "Ogłoszenie usunięte", onSuccess: () => load() }); };

  return (
    <div>
      <PageHeader title="Ogłoszenia" subtitle="Komunikaty administracji dla zespołu"
        actions={hasPermission("announcements.create") && <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Nowe ogłoszenie</Button>} />
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div> :
       items.length === 0 ? <EmptyState icon={Megaphone} title="Brak ogłoszeń" /> :
       <div className="space-y-3">
         {items.map((a) => (
           <div key={a.id} className="rounded-xl border border-border bg-card p-5">
             <div className="flex items-start justify-between gap-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: (TYPE_COLOR[a.type] || "#3b82f6") + "22" }}><Megaphone className="w-5 h-5" style={{ color: TYPE_COLOR[a.type] }} /></div>
                 <div><p className="font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.created_by_name} • {new Date(a.created_date).toLocaleString("pl-PL")}</p></div>
               </div>
               <div className="flex items-center gap-2">
                 <Badge color={TYPE_COLOR[a.type]}>{TYPE_LABEL[a.type]}</Badge>
                 {hasPermission("announcements.delete") && <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => del(a)}><Trash2 className="w-4 h-4" /></button>}
               </div>
             </div>
             <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{a.body}</p>
           </div>
         ))}
       </div>}
      {createOpen && <CreateAnnouncement onClose={() => setCreateOpen(false)} onConfirm={async (d) => { await run("create_announcement", d, { successMsg: "Ogłoszenie utworzone", onSuccess: () => load() }); setCreateOpen(false); }} />}
    </div>
  );
}

function CreateAnnouncement({ onClose, onConfirm }) {
  const [d, setD] = useState({ title: "", body: "", type: "info" });
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nowe ogłoszenie</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Tytuł</Label><Input value={d.title} onChange={e => setD({ ...d, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Typ</Label><Select value={d.type} onValueChange={v => setD({ ...d, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Treść</Label><Textarea value={d.body} onChange={e => setD({ ...d, body: e.target.value })} rows={4} /></div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Anuluj</Button><Button disabled={busy || !d.title || !d.body} onClick={async () => { setBusy(true); try { await onConfirm(d); } finally { setBusy(false); } }}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Opublikuj</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
