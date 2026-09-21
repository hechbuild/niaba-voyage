import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
import { COMPANY } from "@/lib/hech-data";

const links = [
  { label: "Catalogue", href: "/#catalogue" },
  { label: "Comment commander", href: "/#commande" },
  { label: "Devis", href: "/#devis" },
  { label: "Contact", href: "/#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
              {link.label}
            </a>
          ))}
          <Link to="/bon-de-commande" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
            Bon de commande
          </Link>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="gold" asChild>
            <a href={`https://wa.me/${COMPANY.phoneWhatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 py-4 lg:hidden" aria-label="Navigation mobile">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                {link.label}
              </a>
            ))}
            <Link to="/bon-de-commande" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted">Bon de commande</Link>
            <Button variant="gold" className="mt-3" asChild>
              <a href={`https://wa.me/${COMPANY.phoneWhatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}