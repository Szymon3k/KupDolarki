import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ROLE_DEFAULTS, writeAudit } from "../../shared/panel.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sr = base44.asServiceRole;

    // Ensure default roles exist
    const existingRoles = await sr.entities.Role.list();
    for (const key of Object.keys(ROLE_DEFAULTS)) {
      if (!existingRoles.find(r => r.key === key)) {
        await sr.entities.Role.create(ROLE_DEFAULTS[key]);
      }
    }

    // Ensure global settings exist
    let settings = await sr.entities.SystemSettings.filter({ key: "global" });
    let globalSettings = settings[0];
    if (!globalSettings) {
      globalSettings = await sr.entities.SystemSettings.create({
        key: "global",
        panel_name: "KUPDOLARKI.PL",
        panel_display_name: "KUPDOLARKI.PL",
        description: "Wewnętrzny panel operacyjny serwisu kupdolarki.pl",
        discord_url: "https://dc.kupdolarki.pl",
        footer_text: "Site Designed by realkampus",
        footer_link: "https://dc.kupdolarki.pl",
        theme: { mode: "dark", primary: "#7c3aed", accent: "#a855f7", background: "#0f0f14", sidebar: "#15151c", gradient: "linear-gradient(135deg,#7c3aed,#a855f7)" },
        theme_locked: false,
        ceo_share_percent: 25,
        allow_registration: true
      });
    }

    // Find member by user_id
    let members = await sr.entities.Member.filter({ user_id: user.id });
    let member = members[0];

    if (member) {
      // Reject / block handling
      if (member.account_status === "rejected" || member.account_status === "blocked") {
        return Response.json({ rejected: true, redirect: "https://google.com" });
      }
      // Update last login
      member = await sr.entities.Member.update(member.id, { last_login: new Date().toISOString() });
      const roles = await sr.entities.Role.list();
      return Response.json({ member, settings: globalSettings, roles });
    }

    // No member yet. Check if email was previously rejected/blocked
    const byEmail = await sr.entities.Member.filter({ email: user.email });
    const blocked = byEmail.find(m => m.account_status === "rejected" || m.account_status === "blocked");
    if (blocked) {
      // persist a rejected marker for this new account too
      member = await sr.entities.Member.create({
        user_id: user.id,
        email: user.email,
        display_name: user.email.split("@")[0],
        custom_role: "seller",
        role_label: "Seller",
        permissions: ROLE_DEFAULTS.seller.permissions,
        account_status: "rejected",
        wallet_balance: 0, earnings_total: 0
      });
      return Response.json({ rejected: true, redirect: "https://google.com" });
    }

    // First-time provisioning
    const isDev = user.email === "szymon3k.callme@gmail.com";
    const roleKey = isDev ? "developer" : "seller";
    const role = ROLE_DEFAULTS[roleKey];
    member = await sr.entities.Member.create({
      user_id: user.id,
      email: user.email,
      display_name: user.email.split("@")[0],
      avatar_url: "",
      custom_role: roleKey,
      role_label: role.label,
      permissions: role.permissions,
      account_status: isDev ? "approved" : "pending",
      wallet_balance: 0,
      earnings_total: 0, earnings_today: 0, earnings_week: 0, earnings_month: 0, earnings_last_month: 0,
      customers_count: 0, transactions_count: 0, exchanges_count: 0, legitchecks_count: 0, items_sold: 0,
      last_login: new Date().toISOString(),
      theme_settings: {},
      is_demo: false
    });

    if (isDev) {
      await writeAudit(base44, member, "system.init", "System", "", "Inicjalizacja konta developera", "");
    }

    const roles = await sr.entities.Role.list();
    return Response.json({ member, settings: globalSettings, roles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
