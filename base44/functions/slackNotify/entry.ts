import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Wysyła krótkie podsumowanie nowej transakcji na kanał Slack adminów.
// Logika POST jest standardowym fetch (przenośna — działa też poza platformą).
// Wymaga sekretu SLACK_WEBHOOK_URL (Incoming Webhook z Slacka).

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const t = body.transaction || {};
    const webhook = secrets.get("SLACK_WEBHOOK_URL");
    if (!webhook) return Response.json({ ok: false, skipped: "SLACK_WEBHOOK_URL not set" });

    const fmt = (n) => new Intl.NumberFormat("pl-PL").format(Number(n) || 0);
    const text = [
      `🛒 *Nowa transakcja — KUPDOLARKI.PL*`,
      `• Klient: ${t.customer_name || "—"}`,
      `• Produkt: ${t.product_name || "—"}`,
      `• Kwota: ${fmt(t.amount)} PLN`,
      `• Seller: ${t.seller_name || "—"}`,
      `• Metoda: ${t.method || "—"}`,
      `• Status: ${t.status || "—"}`
    ].join("\n");

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) return Response.json({ ok: false, error: "Slack HTTP " + res.status }, { status: 502 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
