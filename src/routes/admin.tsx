import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, ClipboardList, LockKeyhole, PackageSearch, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/hech/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Espace de gestion — HECH Corporation SARL" },
      { name: "description", content: "Espace de gestion de démonstration HECH Corporation SARL." },
      { property: "og:title", content: "Espace de gestion — HECH Corporation SARL" },
      { property: "og:description", content: "Interface administrative de démonstration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }), component: AdminPage,
});

function AdminPage() {
  const [entered, setEntered] = useState(false);
  function enter(event: FormEvent) { event.preventDefault(); setEntered(true); }
  if (!entered) return <main className="grid min-h-screen bg-primary p-4 lg:grid-cols-2"><div className="hidden flex-col justify-between border-r border-primary-foreground/15 p-12 text-primary-foreground lg:flex"><Brand inverted /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Espace interne</p><h1 className="mt-5 max-w-xl text-5xl font-black leading-tight">Gérez l’activité HECH depuis un espace dédié.</h1><p className="mt-6 max-w-lg leading-7 text-primary-foreground/65">Cette première version présente la future interface de suivi, sans exposer de données clients.</p></div><p className="text-xs text-primary-foreground/45">HECH Corporation SARL • Administration</p></div><div className="flex items-center justify-center p-2 sm:p-8"><form onSubmit={enter} className="w-full max-w-md bg-background p-6 sm:p-9"><div className="grid size-12 place-items-center bg-accent text-accent-foreground"><LockKeyhole /></div><h2 className="mt-7 text-3xl font-black">Accès de démonstration</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Aucune authentification réelle ni donnée sensible n’est connectée pour le moment.</p><div className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="admin-id">Identifiant</Label><Input id="admin-id" required placeholder="administrateur" /></div><div className="space-y-2"><Label htmlFor="admin-password">Mot de passe</Label><Input id="admin-password" type="password" required placeholder="••••••••" /></div></div><Button type="submit" size="xl" className="mt-7 w-full">Voir la démonstration</Button><Button variant="link" className="mt-3 w-full" asChild><Link to="/">Retour au site public</Link></Button></form></div></main>;
  return <main className="min-h-screen bg-muted"><header className="border-b border-border bg-background"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Brand /><div className="flex items-center gap-3"><span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground sm:inline">Mode démonstration</span><Button variant="outline" onClick={() => setEntered(false)}>Quitter</Button></div></div></header><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">Tableau de bord</p><h1 className="mt-2 text-3xl font-black">Bonjour, administrateur</h1><p className="mt-2 text-sm text-muted-foreground">Aucune donnée réelle n’est connectée à cet espace.</p></div><span className="inline-flex w-fit items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground"><ShieldCheck className="size-4 text-accent-foreground" /> Démonstration sécurisée visuellement</span></div><div className="mt-10 grid gap-5 md:grid-cols-3"><AdminCard icon={ClipboardList} title="Demandes reçues" text="Les futures demandes de devis apparaîtront ici." /><AdminCard icon={PackageSearch} title="Bons de commande" text="Le suivi des bons transmis sera disponible ici." /><AdminCard icon={Boxes} title="Catalogue" text="Les catégories et références pourront être administrées ici." /></div><section className="mt-8 border border-dashed border-input bg-background p-8 text-center sm:p-14"><PackageSearch className="mx-auto size-10 text-muted-foreground/50" /><h2 className="mt-5 text-xl font-bold">Aucune donnée de démonstration</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">L’espace est volontairement vide. La connexion des demandes et des bons sera ajoutée avec une authentification réelle.</p></section></div></main>;
}
function AdminCard({ icon: Icon, title, text }: { icon: typeof Boxes; title: string; text: string }) { return <article className="border border-border bg-background p-6"><Icon className="size-7 text-accent-foreground" /><h2 className="mt-8 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>; }