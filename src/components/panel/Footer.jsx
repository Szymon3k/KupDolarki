import React from "react";

export default function Footer({ settings }) {
  const footerText = settings?.footer_text || "Site Designed by realkampus";
  const footerLink = settings?.footer_link || "https://dc.kupdolarki.pl";
  const parts = footerText.split(/(realkampus)/i);
  return (
    <footer className="mt-auto px-4 py-4 text-center text-xs text-muted-foreground border-t border-border">
      {parts.map((p, i) =>
        p.toLowerCase() === "realkampus" ? (
          <a key={i} href={footerLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </footer>
  );
}
