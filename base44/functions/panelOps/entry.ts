import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ROLE_DEFAULTS, hasPermission, writeAudit, sendNotification } from "../../shared/panel.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const sr = base44.asServiceRole;

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const callers = await sr.entities.Member.filter({ user_id: user.id });
    const caller = callers[0];
    if (!caller) return Response.json({ error: "Member profile not found" }, { status: 403 });
    if (caller.account_status !== "approved") return Response.json({ error: "Konto nie jest zatwierdzone" }, { status: 403 });

    const need = (perm) => {
      if (!hasPermission(caller, perm)) return false;
      return true;
    };
    const deny = () => Response.json({ error: "Brak wymaganych uprawnień" }, { status: 403 });

    // ---- USER APPROVAL ----
    if (action === "approve_member") {
      if (!need("users.approve")) return deny();
      const m = await sr.entities.Member.update(body.memberId, { account_status: "approved" });
      await writeAudit(base44, caller, "user.approve", "Member", m.id, m.email, "Zatwierdzono konto");
      await sendNotification(base44, m.id, "Konto zatwierdzone", "Twoje konto zostało zatwierdzone. Możesz korzystać z panelu.", "success", "/");
      return Response.json({ ok: true, member: m });
    }

    if (action === "reject_member") {
      if (!need("users.approve")) return deny();
      const m = await sr.entities.Member.update(body.memberId, { account_status: "rejected" });
      await writeAudit(base44, caller, "user.reject", "Member", m.id, m.email, "Odrzucono konto");
      return Response.json({ ok: true, member: m });
    }

    if (action === "block_member") {
      if (!need("users.block")) return deny();
      const m = await sr.entities.Member.update(body.memberId, { account_status: "blocked" });
      await writeAudit(base44, caller, "user.block", "Member", m.id, m.email, "Zablokowano konto");
      return Response.json({ ok: true, member: m });
    }

    if (action === "unblock_member") {
      if (!need("users.block")) return deny();
      const m = await sr.entities.Member.update(body.memberId, { account_status: "approved" });
      await writeAudit(base44, caller, "user.unblock", "Member", m.id, m.email, "Odblokowano konto");
      return Response.json({ ok: true, member: m });
    }

    if (action === "delete_member") {
      if (!need("users.delete")) return deny();
      const m = await sr.entities.Member.get(body.memberId);
      await sr.entities.Member.delete(body.memberId);
      await writeAudit(base44, caller, "user.delete", "Member", body.memberId, m?.email || "", "Usunięto konto");
      return Response.json({ ok: true });
    }

    // ---- ROLE / PERMISSIONS ----
    if (action === "change_role") {
      if (!need("roles.assign")) return deny();
      const role = (await sr.entities.Role.filter({ key: body.roleKey }))[0];
      const roleLabel = role ? role.label : body.roleKey;
      const perms = role ? role.permissions : (ROLE_DEFAULTS[body.roleKey] ? ROLE_DEFAULTS[body.roleKey].permissions : []);
      const m = await sr.entities.Member.update(body.memberId, { custom_role: body.roleKey, role_label: roleLabel, permissions: perms });
      await writeAudit(base44, caller, "user.role_change", "Member", m.id, m.email, "Zmiana roli na " + roleLabel);
      await sendNotification(base44, m.id, "Zmiana roli", "Twoja rola została zmieniona na: " + roleLabel, "info", "/profile");
      return Response.json({ ok: true, member: m });
    }

    if (action === "update_permissions") {
      if (!need("roles.assign")) return deny();
      const m = await sr.entities.Member.update(body.memberId, { permissions: body.permissions || [] });
      await writeAudit(base44, caller, "user.permissions_change", "Member", m.id, m.email, "Zmiana uprawnień");
      return Response.json({ ok: true, member: m });
    }

    if (action === "update_member") {
      if (!need("users.edit")) return deny();
      const fields = {};
      for (const k of ["display_name", "avatar_url", "email"]) {
        if (body[k] !== undefined) fields[k] = body[k];
      }
      const m = await sr.entities.Member.update(body.memberId, fields);
      await writeAudit(base44, caller, "user.edit", "Member", m.id, m.email, "Edycja danych użytkownika");
      return Response.json({ ok: true, member: m });
    }

    if (action === "create_role") {
      if (!need("roles.create")) return deny();
      const r = await sr.entities.Role.create({
        key: body.key, label: body.label, level: body.level ?? 3,
        permissions: body.permissions || [], color: body.color || "#64748b", is_system: false
      });
      await writeAudit(base44, caller, "role.create", "Role", r.id, r.label, "Utworzono rolę");
      return Response.json({ ok: true, role: r });
    }

    if (action === "update_role") {
      if (!need("roles.edit")) return deny();
      const r = await sr.entities.Role.update(body.roleId, {
        label: body.label, level: body.level, permissions: body.permissions, color: body.color
      });
      await writeAudit(base44, caller, "role.edit", "Role", r.id, r.label, "Edycja roli");
      return Response.json({ ok: true, role: r });
    }

    if (action === "delete_role") {
      if (!need("roles.delete")) return deny();
      const r = await sr.entities.Role.get(body.roleId);
      if (r?.is_system) return Response.json({ error: "Nie można usunąć roli systemowej" }, { status: 400 });
      await sr.entities.Role.delete(body.roleId);
      await writeAudit(base44, caller, "role.delete", "Role", body.roleId, r?.label || "", "Usunięto rolę");
      return Response.json({ ok: true });
    }

    // ---- WALLET ----
    if (action === "wallet_credit") {
      if (!need("wallet.add_money")) return deny();
      const m = await sr.entities.Member.get(body.memberId);
      const prev = m.wallet_balance || 0;
      const next = prev + Number(body.amount);
      const updated = await sr.entities.Member.update(body.memberId, { wallet_balance: next });
      await sr.entities.WalletTransaction.create({
        member_id: body.memberId, member_name: m.display_name || m.email,
        type: "credit", amount: Number(body.amount), previous_balance: prev, new_balance: next,
        reason: body.reason || "", performed_by: caller.id, performed_by_name: caller.display_name || caller.email
      });
      await writeAudit(base44, caller, "wallet.credit", "Member", m.id, m.email, "+" + body.amount + " PLN — " + (body.reason || ""));
      await sendNotification(base44, m.id, "Dodano środki", "Dodano " + body.amount + " PLN do Twojego portfela. Powód: " + (body.reason || "—"), "success", "/wallet");
      return Response.json({ ok: true, member: updated });
    }

    if (action === "wallet_debit") {
      if (!need("wallet.remove_money")) return deny();
      const m = await sr.entities.Member.get(body.memberId);
      const prev = m.wallet_balance || 0;
      const next = prev - Number(body.amount);
      const updated = await sr.entities.Member.update(body.memberId, { wallet_balance: next });
      await sr.entities.WalletTransaction.create({
        member_id: body.memberId, member_name: m.display_name || m.email,
        type: "debit", amount: Number(body.amount), previous_balance: prev, new_balance: next,
        reason: body.reason || "", performed_by: caller.id, performed_by_name: caller.display_name || caller.email
      });
      await writeAudit(base44, caller, "wallet.debit", "Member", m.id, m.email, "-" + body.amount + " PLN — " + (body.reason || ""));
      await sendNotification(base44, m.id, "Odjęto środki", "Odjęto " + body.amount + " PLN z Twojego portfela. Powód: " + (body.reason || "—"), "warning", "/wallet");
      return Response.json({ ok: true, member: updated });
    }

    // ---- EARNINGS / STATS ----
    if (action === "add_earning") {
      if (!need("earnings.edit") && !need("stats.edit")) return deny();
      const m = await sr.entities.Member.get(body.memberId);
      const amt = Number(body.amount);
      const updated = await sr.entities.Member.update(body.memberId, {
        earnings_total: (m.earnings_total || 0) + amt,
        earnings_month: (m.earnings_month || 0) + amt,
        earnings_week: (m.earnings_week || 0) + amt,
        earnings_today: (m.earnings_today || 0) + amt
      });
      await sr.entities.Earning.create({
        member_id: body.memberId, member_name: m.display_name || m.email,
        amount: amt, source: body.source || "manual", note: body.note || "",
        added_by: caller.id, added_by_name: caller.display_name || caller.email, is_demo: !!body.is_demo
      });
      await writeAudit(base44, caller, "earning.add", "Member", m.id, m.email, "+" + amt + " PLN (" + (body.source || "manual") + ")");
      await sendNotification(base44, m.id, "Zmiana zarobków", "Dodano " + amt + " PLN do Twoich zarobków.", "info", "/earnings");
      return Response.json({ ok: true, member: updated });
    }

    if (action === "add_stat") {
      if (!need("stats.edit")) return deny();
      const m = await sr.entities.Member.get(body.memberId);
      const inc = {};
      const map = { customers: "customers_count", transactions: "transactions_count", exchanges: "exchanges_count", legitchecks: "legitchecks_count", items: "items_sold" };
      const field = map[body.statType];
      if (!field) return Response.json({ error: "Nieznany typ statystyki" }, { status: 400 });
      inc[field] = (m[field] || 0) + Number(body.count || 1);
      const updated = await sr.entities.Member.update(body.memberId, inc);
      await writeAudit(base44, caller, "stat.add", "Member", m.id, m.email, "+" + (body.count || 1) + " " + body.statType);
      await sendNotification(base44, m.id, "Zmiana statystyk", "Dodano " + (body.count || 1) + " do: " + body.statType, "info", "/profile");
      return Response.json({ ok: true, member: updated });
    }

    // ---- SETTLEMENTS ----
    if (action === "mark_settlement_paid") {
      if (!need("settlements.manage")) return deny();
      const s = await sr.entities.Settlement.update(body.settlementId, {
        status: "paid", paid_at: new Date().toISOString(), paid_by: caller.id, paid_by_name: caller.display_name || caller.email
      });
      await writeAudit(base44, caller, "settlement.pay", "Settlement", s.id, s.member_name, "Oznaczono rozliczenie jako zapłacone");
      await sendNotification(base44, s.member_id, "Rozliczenie opłacone", "Twoje rozliczenie za okres " + s.period_label + " zostało oznaczone jako opłacone.", "success", "/settlements");
      return Response.json({ ok: true, settlement: s });
    }

    if (action === "create_settlement_period") {
      if (!need("settlements.manage")) return deny();
      const settings = (await sr.entities.SystemSettings.filter({ key: "global" }))[0];
      const pct = settings?.ceo_share_percent ?? 25;
      const sellers = await sr.entities.Member.filter({ custom_role: "seller" });
      const created = [];
      for (const s of sellers) {
        if (s.account_status !== "approved") continue;
        const revenue = s.earnings_week || 0;
        const ceoAmount = Math.round(revenue * pct) / 100;
        const sellerAmount = revenue - ceoAmount;
        const sl = await sr.entities.Settlement.create({
          member_id: s.id, member_name: s.display_name || s.email,
          period_start: body.periodStart, period_end: body.periodEnd,
          period_label: body.periodLabel || (body.periodStart + " — " + body.periodEnd),
          revenue, ceo_share_percent: pct, ceo_amount: ceoAmount, seller_amount: sellerAmount, status: "due"
        });
        created.push(sl);
        await sendNotification(base44, s.id, "Rozliczenie tygodniowe", "Zbliża się termin przekazania " + pct + "% tygodniowego rozliczenia: " + ceoAmount + " PLN.", "warning", "/settlements");
      }
      await writeAudit(base44, caller, "settlement.create_period", "Settlement", "", body.periodLabel || "", "Utworzono okres rozliczeniowy dla " + created.length + " sellerów");
      return Response.json({ ok: true, created });
    }

    // ---- SETTINGS ----
    if (action === "update_settings") {
      if (!need("settings.edit")) return deny();
      const settings = (await sr.entities.SystemSettings.filter({ key: "global" }))[0];
      const fields = {};
      for (const k of ["panel_name","panel_display_name","description","logo_url","favicon_url","discord_url","footer_text","footer_link","ceo_share_percent","allow_registration","theme_locked"]) {
        if (body[k] !== undefined) fields[k] = body[k];
      }
      if (body.theme) fields.theme = { ...settings.theme, ...body.theme };
      const updated = await sr.entities.SystemSettings.update(settings.id, fields);
      await writeAudit(base44, caller, "settings.update", "SystemSettings", settings.id, "global", "Aktualizacja ustawień systemu");
      return Response.json({ ok: true, settings: updated });
    }

    // ---- ANNOUNCEMENTS ----
    if (action === "create_announcement") {
      if (!need("announcements.create")) return deny();
      const a = await sr.entities.Announcement.create({
        title: body.title, body: body.body, type: body.type || "info", active: true,
        created_by: caller.id, created_by_name: caller.display_name || caller.email
      });
      await writeAudit(base44, caller, "announcement.create", "Announcement", a.id, a.title, "Utworzono ogłoszenie");
      // notify all approved members
      const all = await sr.entities.Member.filter({ account_status: "approved" });
      for (const m of all) {
        await sendNotification(base44, m.id, "Nowy komunikat: " + a.title, a.body, a.type === "urgent" ? "warning" : "info", "/announcements");
      }
      return Response.json({ ok: true, announcement: a });
    }

    if (action === "delete_announcement") {
      if (!need("announcements.delete")) return deny();
      await sr.entities.Announcement.delete(body.announcementId);
      await writeAudit(base44, caller, "announcement.delete", "Announcement", body.announcementId, "", "Usunięto ogłoszenie");
      return Response.json({ ok: true });
    }

    // ---- INVITE USER (create user by dev/ceo) ----
    if (action === "invite_user") {
      if (!need("users.create")) return deny();
      const email = (body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Nieprawidłowy e-mail" }, { status: 400 });
      try {
        await base44.users.inviteUser(email, "user");
      } catch (e) {
        return Response.json({ error: "Nie udało się wysłać zaproszenia: " + e.message }, { status: 400 });
      }
      await writeAudit(base44, caller, "user.invite", "User", "", email, "Wysłano zaproszenie");
      return Response.json({ ok: true, email });
    }

    return Response.json({ error: "Nieznana akcja: " + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
