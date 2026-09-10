import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { PageHeader, StatCard, EmptyState } from "@/components/panel/ui";
import { Wallet, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function WalletPage() {
  const { member } = usePanel();
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.WalletTransaction.filter({ member_id: member.id }, "-created_date", 50);
    setTx(list); setLoading(false);
  };
  useEffect(() => { if (member) load(); }, [member]);

  const fmt = (n) => Math.round(n || 0) + " PLN";

  return (
    <div>
      <PageHeader title="Portfel" subtitle="Twoje środki i historia operacji" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1 rounded-xl border border-border p-6 text-white" style={{ background: "var(--panel-gradient)" }}>
          <Wallet className="w-8 h-8 mb-3" />
          <p className="text-sm text-white/80">Dostępne saldo</p>
          <p className="text-4xl font-bold mt-1">{fmt(member?.wallet_balance)}</p>
        </div>
        <StatCard icon={ArrowUpRight} label="Zarobki (miesiąc)" value={fmt(member?.earnings_month)} className="lg:col-span-2" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">Historia operacji</h3>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> :
         tx.length === 0 ? <EmptyState icon={Wallet} title="Brak operacji" description="Historia operacji portfela będzie tu widoczna." /> :
         <div>{tx.map((t) => (
           <div key={t.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
             <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === "credit" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
               {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium">{t.type === "credit" ? "+" : "-"}{t.amount} PLN</p>
               <p className="text-xs text-muted-foreground truncate">{t.reason} • {t.performed_by_name} • {new Date(t.created_date).toLocaleString("pl-PL")}</p>
             </div>
             <span className="text-xs text-muted-foreground whitespace-nowrap">{t.previous_balance} → {t.new_balance}</span>
           </div>
         ))}</div>}
      </div>
    </div>
  );
}
