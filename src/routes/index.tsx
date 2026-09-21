import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ClipboardList, FileCheck2, Mail, MapPin, MessageCircle, PackageCheck, Phone, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/hech/site-header";
import { SiteFooter } from "@/components/hech/site-footer";
import { CATEGORIES, COMPANY } from "@/lib/hech-data";
const heroImage = "https://unsplash.com/photos/THysgG36PQg/download?force=true&w=1920";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HECH Corporation SARL — Matériaux de construction au Togo" },
      { name: "description", content: "Approvisionnement de matériaux de construction sur commande à Lomé et partout au Togo. Demandez votre devis professionnel par WhatsApp." },
      { property: "og:title", content: "HECH Corporation SARL — Matériaux de construction au Togo" },
      { property: "og:description", content: "Les matériaux de votre chantier, au bon moment. Devis et approvisionnement sur commande au Togo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const steps = [
  { icon: Send, number: "01", title: "Envoyez votre demande", text: "Décrivez les matériaux, quantités et le lieu de votre chantier." },
  { icon: ClipboardList, number: "02", title: "Recevez notre offre", text: "Nous vérifions les références, la disponibilité et les conditions." },
  { icon: FileCheck2, number: "03", title: "Validez la commande", text: "Vous confirmez l’offre avant toute préparation ou engagement." },
  { icon: PackageCheck, number: "04", title: "Retrait ou livraison", text: "Nous organisons la mise à disposition selon les modalités convenues." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden bg-primary text-primary-foreground md:min-h-[720px]">
          <img src={heroImage} alt="Professionnels et matériaux sur un chantier à Lomé" width={1920} height={1080} className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--primary)_0%,color-mix(in_oklab,var(--primary)_92%,transparent)_38%,color-mix(in_oklab,var(--primary)_32%,transparent)_72%,transparent_100%)]" />
          <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-7xl items-center px-4 py-20 sm:px-6 md:min-h-[720px] lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-6 inline-flex items-center gap-2 border-l-4 border-accent pl-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">Approvisionnement chantier • Togo</p>
              <h1 className="max-w-3xl text-5xl font-black leading-[1.03] text-primary-foreground sm:text-6xl lg:text-7xl">Les matériaux de votre chantier, au bon moment.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-primary-foreground/80 sm:text-lg">HECH Corporation SARL accompagne entreprises, artisans et particuliers dans l’approvisionnement de matériaux de construction sur commande.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="xl" variant="gold" asChild><a href="#devis">Demander un devis <ArrowRight /></a></Button>
                <Button size="xl" variant="inverse" asChild><Link to="/bon-de-commande">Créer un bon de commande</Link></Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-primary-foreground/75">
                <span className="flex items-center gap-2"><Check className="size-4 text-accent" /> Offre sur mesure</span>
                <span className="flex items-center gap-2"><Check className="size-4 text-accent" /> Réponse par WhatsApp</span>
                <span className="flex items-center gap-2"><Check className="size-4 text-accent" /> Retrait ou livraison</span>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogue" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Notre catalogue" title="Tout pour faire avancer votre chantier" text="Indiquez-nous vos références ou votre besoin. Nous préparons une offre selon les quantités et la disponibilité." />
            <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map(({ name, icon: Icon, description }, index) => (
                <article key={name} className="group min-h-64 bg-card p-6 transition-colors hover:bg-muted">
                  <div className="flex items-start justify-between"><span className="grid size-12 place-items-center bg-primary text-primary-foreground"><Icon className="size-6" /></span><span className="font-display text-sm font-bold text-muted-foreground">0{index + 1}</span></div>
                  <h3 className="mt-10 text-xl font-bold text-card-foreground">{name}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="commande" className="scroll-mt-20 bg-primary py-20 text-primary-foreground sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading dark eyebrow="Une méthode simple" title="Votre commande, en quatre étapes" text="Un échange clair pour confirmer vos besoins avant toute mise à disposition." />
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, number, title, text }) => (
                <article key={number} className="border-t border-primary-foreground/25 pt-6">
                  <div className="flex items-center justify-between"><Icon className="size-7 text-accent" /><span className="font-display text-3xl font-black text-primary-foreground/25">{number}</span></div>
                  <h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-primary-foreground/65">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <QuoteSection />

        <section id="contact" className="scroll-mt-20 bg-muted py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <SectionHeading eyebrow="Contact" title="Parlons de votre chantier" text="Notre équipe répond à vos demandes d’approvisionnement et vous accompagne dans la préparation de votre commande." />
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              <ContactLink icon={MessageCircle} label="WhatsApp" value={COMPANY.phoneDisplay} href={`https://wa.me/${COMPANY.phoneWhatsapp}`} />
              <ContactLink icon={Mail} label="Email" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
              <ContactLink icon={Phone} label="Téléphone" value={COMPANY.phoneDisplay} href={`tel:+${COMPANY.phoneWhatsapp}`} />
              <ContactLink icon={MapPin} label="Adresse" value={COMPANY.address} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function QuoteSection() {
  const [category, setCategory] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = [
      "Bonjour HECH Corporation SARL, je souhaite demander un devis.", "",
      `Nom / entreprise : ${form.get("name")}`, `Téléphone : ${form.get("phone")}`,
      `Catégorie : ${category}`, `Lieu du chantier : ${form.get("location")}`,
      "", "Produits et quantités :", String(form.get("products")),
    ].join("\n");
    window.open(`https://wa.me/${COMPANY.phoneWhatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  return (
    <section id="devis" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div><SectionHeading eyebrow="Demande professionnelle" title="Recevez une offre adaptée à votre besoin" text="Transmettez les informations essentielles. Votre demande s’ouvrira directement dans WhatsApp, prête à être envoyée." />
          <div className="mt-8 border-l-4 border-accent bg-muted p-5"><p className="text-sm font-bold text-foreground">Aucun paiement demandé.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Prix, disponibilité, transport et délai seront confirmés dans notre offre.</p></div>
        </div>
        <form onSubmit={submit} className="border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom ou entreprise" htmlFor="quote-name"><Input id="quote-name" name="name" required placeholder="Votre nom ou société" /></Field>
            <Field label="Téléphone / WhatsApp" htmlFor="quote-phone"><Input id="quote-phone" name="phone" type="tel" required placeholder="Ex. +228 90 00 00 00" /></Field>
            <Field label="Catégorie" htmlFor="quote-category"><select id="quote-category" required value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Sélectionner</option>{CATEGORIES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></Field>
            <Field label="Lieu du chantier" htmlFor="quote-location"><Input id="quote-location" name="location" required placeholder="Ville, quartier ou localité" /></Field>
          </div>
          <div className="mt-5"><Field label="Produits et quantités" htmlFor="quote-products"><Textarea id="quote-products" name="products" required className="min-h-32" placeholder="Ex. 100 sacs de ciment, 2 tonnes de fer à béton..." /></Field></div>
          <Button type="submit" variant="gold" size="xl" className="mt-6 w-full"><MessageCircle /> Ouvrir la demande dans WhatsApp</Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Vous pourrez relire le message avant de l’envoyer.</p>
        </form>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text: string; dark?: boolean }) {
  return <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p><h2 className={`mt-4 text-3xl font-black leading-tight sm:text-4xl ${dark ? "text-primary-foreground" : "text-foreground"}`}>{title}</h2><p className={`mt-4 max-w-xl text-base leading-7 ${dark ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{text}</p></div>;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>; }

function ContactLink({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value: string; href?: string }) {
  const content = <><Icon className="size-6 text-accent" /><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p></div></>;
  return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="flex min-h-36 gap-4 bg-card p-6 transition-colors hover:bg-background">{content}</a> : <div className="flex min-h-36 gap-4 bg-card p-6">{content}</div>;
}