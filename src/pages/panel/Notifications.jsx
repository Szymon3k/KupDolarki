import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, EmptyState } from "@/components/panel/ui";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_COLOR = { info: "#3b82f6", success: "#10b981", warning: "#f59e0b", error: "#ef4444" };

export default function Notifications() {
  const { member } = usePanel();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Notification.filter({ member_id: member.id }, "-created_date", 100);
    setItems(list); setLoading(false);
  };
  useEffect(() => { if (member) load(); }, [member]);

  const markRead = async (n) => { await base44.entities.Notification.update(n.id, { read: true }); load(); };
  const markAll = async () => { await Promise.all(items.filter(n=>!n.read).map(n => base44.entities.Notification.update(n.id, { read: true }))); load(); };

  return (
    <div>
      <PageHeader title="Powiadomienia" subtitle="Twoje powiadomienia systemowe"
        actions={<Button variant="outline" size="sm" className="gap-2" onClick={markAll}><CheckCheck className="w-4 h-4" /> Oznacz wszystkie jako przeczytane</Button>} />
      <div className="rounded-xl border border-border bg-card">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         items.length === 0 ? <EmptyState icon={Bell} title="Brak powiadomień" /> :
         <div>{items.map((n) => (
           <div key={n.id} className={cn("flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/30", !n.read && "bg-primary/5")}>
             <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TYPE_COLOR[n.type] || "#3b82f6" }} />
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium">{n.title}</p>
               <p className="text-sm text-muted-foreground">{n.body}</p>
               <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleString("pl-PL")}</p>
             </div>
             <div className="flex items-center gap-2">
               {n.link && <Link to={n.link} className="text-xs text-primary hover:underline">Otwórz</Link>}
               {!n.read && <button onClick={() => markRead(n)} className="text-xs text-muted-foreground hover:text-foreground">Przeczytane</button>}
             </div>
           </div>
         ))}</div>}
      </div>
    </div>
  );
}
