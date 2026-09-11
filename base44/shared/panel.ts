// Shared panel logic: permission catalog, role defaults, caller helpers.
// Imported by backend functions only (server-side).

export const PERMISSIONS = [
  "users.view", "users.create", "users.edit", "users.delete", "users.block", "users.approve",
  "roles.view", "roles.create", "roles.edit", "roles.delete", "roles.assign",
  "shop.view", "shop.create", "shop.edit", "shop.delete",
  "transactions.view", "transactions.create", "transactions.edit",
  "wallet.view", "wallet.edit", "wallet.add_money", "wallet.remove_money",
  "stats.view", "stats.edit",
  "legitcheck.view", "legitcheck.create", "legitcheck.edit", "legitcheck.delete",
  "exchange.view", "exchange.create", "exchange.edit", "exchange.delete",
  "customers.view", "customers.create", "customers.edit",
  "announcements.view", "announcements.create", "announcements.edit", "announcements.delete",
  "notifications.view",
  "settlements.view", "settlements.manage",
  "settings.view", "settings.edit",
  "theme.personal", "theme.global",
  "audit.view",
  "earnings.view", "earnings.edit"
];

export const ROLE_DEFAULTS = {
  developer: {
    key: "developer", label: "Developer", level: 0, color: "#a855f7", is_system: true,
    permissions: PERMISSIONS
  },
  ceo: {
    key: "ceo", label: "CEO / Właściciel", level: 1, color: "#f59e0b", is_system: true,
    permissions: PERMISSIONS.filter(p => p !== "theme.global")
  },
  admin: {
    key: "admin", label: "Admin", level: 2, color: "#3b82f6", is_system: true,
    permissions: ["users.view","users.approve","users.block","shop.view","shop.create","shop.edit","shop.delete","transactions.view","transactions.create","transactions.edit","legitcheck.view","legitcheck.create","legitcheck.edit","exchange.view","exchange.create","exchange.edit","customers.view","customers.create","customers.edit","announcements.view","announcements.create","announcements.edit","settlements.view","stats.view","stats.edit","wallet.view","earnings.view","notifications.view","theme.personal","audit.view"]
  },
  seller: {
    key: "seller", label: "Seller", level: 3, color: "#10b981", is_system: true,
    permissions: ["shop.view","shop.create","shop.edit","transactions.view","transactions.create","legitcheck.view","legitcheck.create","exchange.view","exchange.create","customers.view","customers.create","customers.edit","wallet.view","earnings.view","announcements.view","notifications.view","stats.view","theme.personal"]
  }
};

export function hasPermission(member, perm) {
  if (!member) return false;
  if (member.custom_role === "developer") return true;
  const perms = member.permissions || [];
  return perms.includes(perm);
}

export async function getCallerMember(base44) {
  const user = await base44.auth.me();
  if (!user) return { user: null, member: null };
  const members = await base44.asServiceRole.entities.Member.filter({ user_id: user.id });
  return { user, member: members[0] || null };
}

export async function requirePermission(base44, perm) {
  const { user, member } = await getCallerMember(base44);
  if (!user) return { user: null, member: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!member) return { user, member: null, error: Response.json({ error: "Member profile not found" }, { status: 403 }) };
  if (member.account_status !== "approved") return { user, member, error: Response.json({ error: "Konto nie jest zatwierdzone" }, { status: 403 }) };
  if (!hasPermission(member, perm)) return { user, member, error: Response.json({ error: "Brak wymaganych uprawnień: " + perm }, { status: 403 }) };
  return { user, member, error: null };
}

export async function writeAudit(base44, member, action, objectType, objectId, objectLabel, details) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      actor_id: member.id,
      actor_name: member.display_name || member.email,
      actor_email: member.email,
      action,
      object_type: objectType,
      object_id: objectId || "",
      object_label: objectLabel || "",
      details: details || ""
    });
  } catch (e) { /* audit is best-effort */ }
}

export async function sendNotification(base44, memberId, title, body, type, link) {
  try {
    await base44.asServiceRole.entities.Notification.create({
      member_id: memberId, title, body, type: type || "info", read: false, link: link || ""
    });
  } catch (e) { /* best-effort */ }
}
