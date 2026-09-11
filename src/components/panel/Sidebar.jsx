import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, ArrowLeftRight, Users, RefreshCw, ShieldCheck,
  Wallet, TrendingUp, FileText, Bell, Megaphone, Settings, ScrollText, UserCog,
  ChevronLeft, ChevronRight, Store, Receipt
} from "lucide-react";
import { usePanel } from "@/lib/PanelContext";
import { cn } from "@/lib/utils";

const NAV = [
  { section: "Główne", items: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, perm: null },
  ]},
  { section: "Operacje", items: [
    { label: "Sklep", path: "/shop", icon: ShoppingBag, perm: "shop.view" },
    { label: "Transakcje", path: "/transactions", icon: Receipt, perm: "transactions.view" },
    { label: "Klienci", path: "/customers", icon: Users, perm: "customers.view" },
    { label: "Wymiany", path: "/exchanges", icon: ArrowLeftRight, perm: "exchange.view" },
    { label: "Legitcheck", path: "/legitchecks", icon: ShieldCheck, perm: "legitcheck.view" },
    { label: "Zarobki", path: "/earnings", icon: TrendingUp, perm: "earnings.view" },
    { label: "Portfel", path: "/wallet", icon: Wallet, perm: "wallet.view" },
    { label: "Rozliczenia", path: "/settlements", icon: FileText, perm: "settlements.view" },
  ]},
  { section: "Komunikacja", items: [
    { label: "Powiadomienia", path: "/notifications", icon: Bell, perm: "notifications.view" },
    { label: "Ogłoszenia", path: "/announcements", icon: Megaphone, perm: "announcements.view" },
  ]},
  { section: "Administracja", items: [
    { label: "Użytkownicy", path: "/users", icon: UserCog, perm: "users.view" },
    { label: "Role i uprawnienia", path: "/roles", icon: ShieldCheck, perm: "roles.view" },
    { label: "Logi audytu", path: "/audit-logs", icon: ScrollText, perm: "audit.view" },
  ]},
  { section: "System", items: [
    { label: "Ustawienia", path: "/settings", icon: Settings, perm: "settings.view" },
  ]},
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { member, settings, hasPermission } = usePanel();
  const panelName = settings?.panel_name || "KUPDOLARKI.PL";

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn(
        "fixed lg:sticky top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "var(--panel-gradient)" }}>
            <Store className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate text-sidebar-foreground">{panelName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Panel Operacyjny</p>
            </div>
          )}
          <button className="ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV.map((group, gi) => {
            const visible = group.items.filter((it) => !it.perm || hasPermission(it.perm));
            if (!visible.length) return null;
            return (
              <div key={gi}>
                {!collapsed && <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.section}</p>}
                <div className="space-y-0.5">
                  {visible.map((it) => (
                    <NavLink
                      key={it.path}
                      to={it.path}
                      end={it.path === "/"}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                        isActive ? "bg-primary text-primary-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        collapsed && "justify-center"
                      )}
                      title={collapsed ? it.label : undefined}
                    >
                      <it.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {(member?.display_name || "U")[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground">{member?.display_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{member?.role_label}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
