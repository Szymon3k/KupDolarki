import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { usePanel } from "@/lib/PanelContext";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function Header({ onMenu, onToggleCollapse, settings }) {
  const { member, hasPermission, refresh } = usePanel();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const loadNotifs = async () => {
    if (!member) return;
    try {
      const list = await base44.entities.Notification.filter({ member_id: member.id }, "-created_date", 10);
      setNotifs(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch (e) {}
  };

  useEffect(() => { loadNotifs(); }, [member]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) { setNotifOpen(false); setUserOpen(false); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unreadList = notifs.filter((n) => !n.read);
    await Promise.all(unreadList.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    loadNotifs();
  };

  const doSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate("/search?q=" + encodeURIComponent(search.trim()));
  };

  const logout = () => { base44.auth.logout("/login"); };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border flex items-center gap-3 px-4">
      <button className="lg:hidden p-2 rounded-lg hover:bg-muted" onClick={onMenu}><Menu className="w-5 h-5" /></button>
      <button className="hidden lg:block p-2 rounded-lg hover:bg-muted" onClick={onToggleCollapse}><Menu className="w-5 h-5" /></button>

      <form onSubmit={doSearch} className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj użytkowników, transakcji, produktów..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <div className="relative" ref={notifRef}>
          <button className="relative p-2 rounded-lg hover:bg-muted" onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); if (!notifOpen) loadNotifs(); }}>
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[9px] flex items-center justify-center text-primary-foreground font-bold">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">Powiadomienia</p>
                <button className="text-xs text-primary hover:underline" onClick={markAllRead}>Oznacz wszystkie jako przeczytane</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Brak powiadomień</p> :
                  notifs.map((n) => (
                    <Link to={n.link || "/notifications"} key={n.id} onClick={() => setNotifOpen(false)}
                      className={cn("block px-4 py-3 border-b border-border/50 hover:bg-muted/50", !n.read && "bg-primary/5")}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    </Link>
                  ))}
              </div>
              <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block py-2 text-center text-xs text-primary hover:underline">Zobacz wszystkie</Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted" onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{(member?.display_name || "U")[0].toUpperCase()}</div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium leading-tight">{member?.display_name}</p>
              <p className="text-[10px] text-muted-foreground">{member?.role_label}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover shadow-xl py-1">
              <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"><User className="w-4 h-4" /> Profil</Link>
              <Link to="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"><Settings className="w-4 h-4" /> Ustawienia</Link>
              <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="w-4 h-4" /> Wyloguj</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
