import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, EmptyState } from "@/components/panel/ui";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2, Users, ShoppingBag, Receipt, Megaphone } from "lucide-react";

export default function Search() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const navigate = useNavigate();
  const { hasPermission } = usePanel();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const doSearch = async (term) => {
    if (!term.trim()) { setResults({}); return; }
    setLoading(true);
    const t = term.toLowerCase();
    const r = {};
    if (hasPermission("users.view")) {
      const m = await base44.entities.Member.list("-created_date", 200);
      r.users = m.filter(x => `${x.display_name} ${x.email}`.toLowerCase().includes(t)).slice(0, 5);
    }
    const p = await base44.entities.Product.list("-created_date", 200);
    r.products = p.filter(x => `${x.name} ${x.game_server}`.toLowerCase().includes(t)).slice(0, 5);
    if (hasPermission("transactions.view")) {
      const tx = await base44.entities.Transaction.list("-created_date", 200);
      r.transactions = tx.filter(x => `${x.customer_name} ${x.product_name}`.toLowerCase().includes(t)).slice(0, 5);
    }
    const an = await base44.entities.Announcement.list("-created_date", 50);
    r.announcements = an.filter(x => `${x.title} ${x.body}`.toLowerCase().includes(t)).slice(0, 5);
    setResults(r); setLoading(false);
  };

  useEffect(() => { if (q) doSearch(q); }, []);

  const submit = (e) => { e.preventDefault(); navigate("/search?q=" + encodeURIComponent(query)); doSearch(query); };

  const total = Object.values(results).reduce((s, a) => s + (a?.length || 0), 0);

  return (
    <div>
      <PageHeader title="Wyszukiwarka globalna" subtitle="Szukaj w całym panelu" />
      <form onSubmit={submit} className="relative max-w-xl mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Wpisz frazę..." className="pl-9 h-11" autoFocus />
      </form>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div> :
       total === 0 && q ? <EmptyState icon={SearchIcon} title="Brak wyników" description={`Nie znaleziono nic dla "${q}".`} /> :
       <div className="space-y-6">
         {results.users?.length > 0 && <ResultGroup icon={Users} title="Użytkownicy" items={results.users.map(u => ({ id: u.id, label: u.display_name, sub: u.email, to: `/users/${u.id}` }))} />}
         {results.products?.length > 0 && <ResultGroup icon={ShoppingBag} title="Produkty" items={results.products.map(p => ({ id: p.id, label: p.name, sub: `${p.price} PLN • ${p.game_server || ""}`, to: "/shop" }))} />}
         {results.transactions?.length > 0 && <ResultGroup icon={Receipt} title="Transakcje" items={results.transactions.map(t => ({ id: t.id, label: t.product_name || t.customer_name, sub: `${t.amount} PLN`, to: "/transactions" }))} />}
         {results.announcements?.length > 0 && <ResultGroup icon={Megaphone} title="Ogłoszenia" items={results.announcements.map(a => ({ id: a.id, label: a.title, sub: a.body.slice(0, 60), to: "/announcements" }))} />}
       </div>}
    </div>
  );
}

function ResultGroup({ icon: Icon, title, items }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground ml-auto">{items.length}</span></div>
      {items.map(i => (
        <Link key={i.id} to={i.to} className="block px-4 py-3 border-t border-border hover:bg-muted/30">
          <p className="text-sm font-medium">{i.label}</p>
          <p className="text-xs text-muted-foreground">{i.sub}</p>
        </Link>
      ))}
    </div>
  );
}
