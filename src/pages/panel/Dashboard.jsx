import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePanel } from "@/lib/PanelContext";
import { StatCard, PageHeader } from "@/components/panel/ui";
import { Wallet, Users, RefreshCw, ShieldCheck, ShoppingBag, TrendingUp, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

const RANGES = [
  { key: "7d", label: "7 dni", days: 7 },
  { key: "30d", label: "30 dni", days: 30 },
  { key: "3m", label: "3 miesiące", days: 90 },
  { key: "6m", label: "6 miesięcy", days: 180 },
  { key: "1y", label: "Rok", days: 365 },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Dobrej nocy";
  if (h < 12) return "Dzień dobry";
  if (h < 18) return "Miłego popołudnia";
  return "Dobry wieczór";
}

// Agreguje transakcje (status completed) wg dnia dla ostatnich `days` dni.
function aggregate(transactions, days) {
  const map = new Map();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: d.toLocaleDateString("pl-PL", { day: "2-digit", month: days > 90 ? "short" : "2-digit" }), przychod: 0, sprzedaz: 0 });
  }
  for (const t of transactions) {
    if (t.status !== "completed") continue;
    const d = new Date(t.created_date); d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    if (row) { row.przychod += Number(t.amount) || 0; row.sprzedaz += 1; }
  }
  return Array.from(map.values());
}

export default function Dashboard() {
  const { member, hasPermission } = usePanel();
  const [range, setRange] = useState("30d");
  const [global, setGlobal] = useState(null);
  const [txs, setTxs] = useState([]);
  const isStaff = hasPermission("users.view");

  useEffect(() => {
    if (isStaff) {
      base44.entities.Member.list().then((m) => {
        const approved = m.filter((x) => x.account_status === "approved");
        setGlobal({
          totalRevenue: m.reduce((s, x) => s + (x.earnings_total || 0), 0),
          monthRevenue: m.reduce((s, x) => s + (x.earnings_month || 0), 0),
          lastMonthRevenue: m.reduce((s, x) => s + (x.earnings_last_month || 0), 0),
          sellers: approved.filter((x) => x.custom_role === "seller").length,
          activeSellers: approved.filter((x) => x.custom_role === "seller").length,
          customers: m.reduce((s, x) => s + (x.customers_count || 0), 0),
          exchanges: m.reduce((s, x) => s + (x.exchanges_count || 0), 0),
          legitchecks: m.reduce((s, x) => s + (x.legitchecks_count || 0), 0),
          itemsSold: m.reduce((s, x) => s + (x.items_sold || 0), 0),
          walletTotal: m.reduce((s, x) => s + (x.wallet_balance || 0), 0),
        });
      }).catch(() => {});
      base44.entities.Transaction.list("-created_date", 500).then(setTxs).catch(() => {});
    } else if (member) {
      base44.entities.Transaction.filter({ seller_id: member.id }, "-created_date", 500).then(setTxs).catch(() => {});
    }
  }, [isStaff, member]);

  const days = RANGES.find((r) => r.key === range).days;
  const chartData = useMemo(() => aggregate(txs, days), [txs, days]);
  const totalRevenueRange = chartData.reduce((s, x) => s + x.przychod, 0);
  const totalSalesRange = chartData.reduce((s, x) => s + x.sprzedaz, 0);

  const fmt = (n) => new Intl.NumberFormat("pl-PL").format(Math.round(n || 0)) + " PLN";
  const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, color: "hsl(var(--popover-foreground))" };

  return (
    <div>
      <PageHeader title={`${greeting()}, ${member?.display_name || ""} 👋`} subtitle={isStaff ? "Globalne statystyki serwisu KUPDOLARKI.PL" : "Twoje statystyki i podsumowanie"} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isStaff && global ? (
          <>
            <StatCard icon={TrendingUp} accent label="Przychód całkowity" value={fmt(global.totalRevenue)} sub={`Ten miesiąc: ${fmt(global.monthRevenue)}`} />
            <StatCard icon={Users} label="Sellerzy" value={global.sellers} sub={`Aktywni: ${global.activeSellers}`} />
            <StatCard icon={ShoppingBag} label="Sprzedane itemy" value={global.itemsSold} />
            <StatCard icon={Wallet} label="Salda portfeli" value={fmt(global.walletTotal)} />
            <StatCard icon={Users} label="Klienci" value={global.customers} />
            <StatCard icon={RefreshCw} label="Wymiany" value={global.exchanges} />
            <StatCard icon={ShieldCheck} label="Legitchecki" value={global.legitchecks} />
            <StatCard icon={ArrowUpRight} label="Wzrost miesiąc" value={global.lastMonthRevenue > 0 ? "+" + Math.round((global.monthRevenue - global.lastMonthRevenue) / global.lastMonthRevenue * 100) + "%" : "—"} />
          </>
        ) : (
          <>
            <StatCard icon={TrendingUp} accent label="Zarobki (całkowite)" value={fmt(member?.earnings_total)} sub={`Ten miesiąc: ${fmt(member?.earnings_month)}`} />
            <StatCard icon={Wallet} label="Portfel" value={fmt(member?.wallet_balance)} />
            <StatCard icon={Users} label="Klienci" value={member?.customers_count || 0} />
            <StatCard icon={RefreshCw} label="Wymiany" value={member?.exchanges_count || 0} />
            <StatCard icon={ShieldCheck} label="Legitchecki" value={member?.legitchecks_count || 0} />
            <StatCard icon={ShoppingBag} label="Sprzedane itemy" value={member?.items_sold || 0} />
            <StatCard icon={TrendingUp} label="Zarobki (tydzień)" value={fmt(member?.earnings_week)} />
            <StatCard icon={TrendingUp} label="Zarobki (dziś)" value={fmt(member?.earnings_today)} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="font-semibold mr-auto">Przychody i sprzedaż</h3>
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${range === r.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Dzienne przychody</h3>
              <p className="text-xs text-muted-foreground">Suma zakończonych transakcji • {fmt(totalRevenueRange)} w okresie</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), "Przychód"]} />
              <Area type="monotone" dataKey="przychod" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#cGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Dzienna sprzedaż</h3>
            <p className="text-xs text-muted-foreground">Liczba zakończonych transakcji • {totalSalesRange} w okresie</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Transakcje"]} />
              <Line type="monotone" dataKey="sprzedaz" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
