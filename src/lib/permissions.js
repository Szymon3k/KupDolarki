// Client-side permission catalog (mirrors base44/shared/panel.ts).
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
