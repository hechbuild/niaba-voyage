import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "./brand";
import { COMPANY } from "@/lib/hech-data";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr_1fr] lg:px-8">
        <div>
          <Brand inverted />
          <p className="mt-5 max-w-sm text-sm leading-6 text-primary-foreground/70">Votre partenaire pour l’approvisionnement de matériaux de construction sur commande au Togo.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Nous joindre</p>
          <div className="mt-4 space-y-3 text-sm">
            <a className="flex items-start gap-3 text-primary-foreground/80 hover:text-accent" href={`tel:+${COMPANY.phoneWhatsapp}`}><Phone className="mt-0.5 size-4 shrink-0" />{COMPANY.phoneDisplay}</a>
            <a className="flex items-start gap-3 break-all text-primary-foreground/80 hover:text-accent" href={`mailto:${COMPANY.email}`}><Mail className="mt-0.5 size-4 shrink-0" />{COMPANY.email}</a>
            <p className="flex items-start gap-3 text-primary-foreground/80"><MapPin className="mt-0.5 size-4 shrink-0" />{COMPANY.address}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Accès rapide</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-primary-foreground/80">
            <Link to="/bon-de-commande" className="hover:text-accent">Créer un bon de commande</Link>
            <Link to="/admin" className="hover:text-accent">Espace de gestion</Link>
            <a href="/#devis" className="hover:text-accent">Demander un devis</a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 px-4 py-5 text-center text-xs text-primary-foreground/60">© 2026 HECH Corporation SARL. Tous droits réservés.</div>
    </footer>
  );
}