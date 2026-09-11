// Theme application: converts hex theme colors to HSL CSS tokens.

function hexToHsl(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const light = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
}

export function applyTheme(theme, mode) {
  const root = document.documentElement;
  const t = theme || {};
  const isDark = (mode || t.mode || "dark") === "dark";
  if (isDark) root.classList.add("dark"); else root.classList.remove("dark");

  const primary = hexToHsl(t.primary) || (isDark ? "265 89% 66%" : "265 89% 60%");
  const accent = hexToHsl(t.accent) || "280 85% 65%";
  const bg = hexToHsl(t.background) || "240 10% 7%";
  const sidebar = hexToHsl(t.sidebar) || "240 8% 11%";

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  root.style.setProperty("--ring", primary);

  if (isDark) {
    root.style.setProperty("--background", bg);
    root.style.setProperty("--foreground", "0 0% 98%");
    root.style.setProperty("--card", sidebar);
    root.style.setProperty("--card-foreground", "0 0% 98%");
    root.style.setProperty("--popover", sidebar);
    root.style.setProperty("--popover-foreground", "0 0% 98%");
    root.style.setProperty("--secondary", "240 6% 14%");
    root.style.setProperty("--secondary-foreground", "0 0% 98%");
    root.style.setProperty("--muted", "240 6% 14%");
    root.style.setProperty("--muted-foreground", "240 5% 65%");
    root.style.setProperty("--border", "240 6% 18%");
    root.style.setProperty("--input", "240 6% 18%");
    root.style.setProperty("--destructive", "0 72% 51%");
    root.style.setProperty("--destructive-foreground", "0 0% 98%");
    root.style.setProperty("--sidebar-background", sidebar);
    root.style.setProperty("--sidebar-foreground", "240 5% 80%");
    root.style.setProperty("--sidebar-border", "240 6% 18%");
    root.style.setProperty("--sidebar-accent", "240 6% 16%");
    root.style.setProperty("--sidebar-accent-foreground", "0 0% 98%");
  } else {
    root.style.setProperty("--background", "0 0% 100%");
    root.style.setProperty("--foreground", "240 10% 10%");
    root.style.setProperty("--card", "0 0% 100%");
    root.style.setProperty("--card-foreground", "240 10% 10%");
    root.style.setProperty("--popover", "0 0% 100%");
    root.style.setProperty("--popover-foreground", "240 10% 10%");
    root.style.setProperty("--secondary", "240 5% 96%");
    root.style.setProperty("--secondary-foreground", "240 10% 10%");
    root.style.setProperty("--muted", "240 5% 96%");
    root.style.setProperty("--muted-foreground", "240 4% 45%");
    root.style.setProperty("--border", "240 6% 90%");
    root.style.setProperty("--input", "240 6% 90%");
    root.style.setProperty("--sidebar-background", "0 0% 100%");
    root.style.setProperty("--sidebar-foreground", "240 10% 30%");
    root.style.setProperty("--sidebar-border", "240 6% 90%");
  }
  root.style.setProperty("--panel-gradient", t.gradient || "linear-gradient(135deg,#7c3aed,#a855f7)");
}

export function gradientStyle() {
  return { backgroundImage: "var(--panel-gradient)" };
}
