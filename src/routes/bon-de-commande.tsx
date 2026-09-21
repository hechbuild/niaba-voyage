import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/hech/site-header";
import { SiteFooter } from "@/components/hech/site-footer";
import { CATEGORIES, COMPANY, UNITS } from "@/lib/hech-data";

type ProductLine = { id: string; designation: string; quantity: string; unit: string };
type OrderData = { client: string; phone: string; location: string; category: string; observation: string };

export const Route = createFileRoute("/bon-de-commande")({
  head: () => ({
    meta: [
      { title: "Bon de commande — HECH Corporation SARL" },
      { name: "description", content: "Créez gratuitement votre bon de commande de matériaux, téléchargez-le en PDF et transmettez-le à HECH Corporation SARL par WhatsApp." },
      { property: "og:title", content: "Créer un bon de commande — HECH Corporation SARL" },
      { property: "og:description", content: "Préparez votre liste de matériaux et envoyez votre bon PDF à HECH Corporation SARL." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/bon-de-commande" }],
  }),
  component: OrderPage,
});

function OrderPage() {
  const [data, setData] = useState<OrderData>({ client: "", phone: "", location: "", category: "", observation: "" });
  const [lines, setLines] = useState<ProductLine[]>([{ id: crypto.randomUUID(), designation: "", quantity: "", unit: "sacs" }]);
  const [issued, setIssued] = useState<{ number: string; date: Date } | null>(null);
  const [error, setError] = useState("");
  const valid = useMemo(() => data.client.trim() && data.phone.trim() && data.location.trim() && data.category && lines.every((line) => line.designation.trim() && Number(line.quantity) > 0), [data, lines]);

  function updateLine(id: string, field: keyof Omit<ProductLine, "id">, value: string) { setLines((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item)); setIssued(null); }
  function addLine() { setLines((items) => [...items, { id: crypto.randomUUID(), designation: "", quantity: "", unit: "unités" }]); setIssued(null); }
  function removeLine(id: string) { if (lines.length > 1) { setLines((items) => items.filter((item) => item.id !== id)); setIssued(null); } }
  function updateData(field: keyof OrderData, value: string) { setData((current) => ({ ...current, [field]: value })); setIssued(null); }

  function issueOrder(event?: FormEvent) {
    event?.preventDefault();
    if (!valid) { setError("Complétez les informations obligatoires et toutes les lignes produits."); return null; }
    setError("");
    const result = issued ?? { number: makeOrderNumber(), date: new Date() };
    setIssued(result);
    return result;
  }

  function buildPdf(info: { number: string; date: Date }) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const navy: [number, number, number] = [15, 42, 69];
    const gold: [number, number, number] = [217, 163, 35];
    doc.setFillColor(...navy); doc.rect(0, 0, 210, 38, "F");
    doc.setFillColor(...gold); doc.rect(0, 38, 210, 2, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("HECH", 16, 17);
    doc.setFontSize(9); doc.text("CORPORATION SARL", 16, 23); doc.setFont("helvetica", "normal"); doc.setTextColor(210, 219, 228); doc.text("Matériaux de construction sur commande", 16, 30);
    doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("BON DE COMMANDE", 194, 18, { align: "right" });
    doc.setFontSize(9); doc.text(info.number, 194, 26, { align: "right" }); doc.setFont("helvetica", "normal"); doc.text(info.date.toLocaleDateString("fr-FR"), 194, 32, { align: "right" });
    doc.setTextColor(30, 43, 55); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("COORDONNÉES DU CLIENT", 16, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`Nom / entreprise : ${cleanPdfText(data.client)}`, 16, 60); doc.text(`Téléphone : ${cleanPdfText(data.phone)}`, 16, 66); doc.text(`Lieu du chantier : ${cleanPdfText(data.location)}`, 110, 60); doc.text(`Catégorie : ${cleanPdfText(data.category)}`, 110, 66);
    let y = 79; doc.setFillColor(235, 239, 243); doc.rect(16, y, 178, 9, "F"); doc.setFont("helvetica", "bold"); doc.text("Désignation", 20, y + 6); doc.text("Quantité", 132, y + 6); doc.text("Unité", 163, y + 6); y += 9;
    doc.setFont("helvetica", "normal");
    lines.forEach((line, index) => { if (y > 244) { doc.addPage(); y = 20; } doc.setDrawColor(220, 225, 230); doc.rect(16, y, 178, 11); doc.text(`${index + 1}. ${cleanPdfText(line.designation).slice(0, 66)}`, 20, y + 7); doc.text(line.quantity, 132, y + 7); doc.text(cleanPdfText(line.unit), 163, y + 7); y += 11; });
    if (data.observation.trim()) { y += 8; doc.setFont("helvetica", "bold"); doc.text("OBSERVATION", 16, y); y += 6; doc.setFont("helvetica", "normal"); const text = doc.splitTextToSize(cleanPdfText(data.observation), 178); doc.text(text, 16, y); y += text.length * 5; }
    y = Math.min(Math.max(y + 12, 190), 238); doc.setFillColor(255, 247, 222); doc.setDrawColor(...gold); doc.rect(16, y, 178, 28, "FD"); doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.text("IMPORTANT — AUCUN PAIEMENT DEMANDÉ À L’ÉMISSION", 21, y + 9); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); const note = doc.splitTextToSize("Ce document exprime un besoin d’approvisionnement. Les prix, la disponibilité, le transport et le délai restent à confirmer par HECH Corporation SARL.", 168); doc.text(note, 21, y + 16);
    doc.setTextColor(90, 100, 110); doc.setFontSize(8); doc.text(`${COMPANY.address}  •  ${COMPANY.phoneDisplay}  •  ${COMPANY.email}`, 105, 285, { align: "center" });
    return doc;
  }

  function downloadPdf() { const info = issueOrder(); if (!info) return; buildPdf(info).save(`${info.number}.pdf`); }
  async function sharePdf() {
    const info = issueOrder(); if (!info) return;
    const doc = buildPdf(info); const blob = doc.output("blob"); const file = new File([blob], `${info.number}.pdf`, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    try { if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) { await nav.share({ title: `Bon de commande ${info.number}`, text: "Bon de commande pour HECH Corporation SARL", files: [file] }); return; } } catch (shareError) { if (shareError instanceof DOMException && shareError.name === "AbortError") return; }
    doc.save(`${info.number}.pdf`);
    const text = `Bonjour HECH Corporation SARL, voici mon bon de commande ${info.number}. Le PDF vient d’être téléchargé : merci de le joindre à cette conversation.`;
    window.open(`https://wa.me/${COMPANY.phoneWhatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="min-h-screen bg-muted/50"><SiteHeader /><main>
    <section className="bg-primary py-14 text-primary-foreground"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><a href="/" className="inline-flex items-center gap-2 text-sm text-primary-foreground/65 hover:text-accent"><ArrowLeft className="size-4" /> Retour à l’accueil</a><div className="mt-8 flex items-end justify-between gap-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Document professionnel</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Bon de commande</h1><p className="mt-4 max-w-2xl text-primary-foreground/70">Préparez votre besoin, générez le PDF puis transmettez-le à notre équipe.</p></div><FileText className="hidden size-20 text-primary-foreground/15 sm:block" /></div></div></section>
    <form onSubmit={issueOrder} className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <div className="space-y-8">
        <section className="border border-border bg-card p-5 sm:p-7"><StepTitle number="01" title="Informations du client" /><div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Nom ou entreprise" id="client"><Input id="client" required value={data.client} onChange={(e) => updateData("client", e.target.value)} /></Field>
          <Field label="Téléphone / WhatsApp" id="phone"><Input id="phone" type="tel" required value={data.phone} onChange={(e) => updateData("phone", e.target.value)} /></Field>
          <Field label="Lieu du chantier" id="location"><Input id="location" required value={data.location} onChange={(e) => updateData("location", e.target.value)} /></Field>
          <Field label="Catégorie" id="category"><select id="category" required value={data.category} onChange={(e) => updateData("category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Sélectionner</option>{CATEGORIES.map((item) => <option key={item.name}>{item.name}</option>)}</select></Field>
        </div></section>
        <section className="border border-border bg-card p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><StepTitle number="02" title="Produits demandés" /><Button type="button" variant="outline" size="sm" onClick={addLine}><Plus /> Ajouter</Button></div><div className="mt-6 space-y-4">
          {lines.map((line, index) => <div key={line.id} className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-[1fr_110px_130px_36px] sm:items-end"><Field label={`Désignation ${index + 1}`} id={`designation-${line.id}`}><Input id={`designation-${line.id}`} value={line.designation} required placeholder="Ex. Ciment CPJ 35" onChange={(e) => updateLine(line.id, "designation", e.target.value)} /></Field><Field label="Quantité" id={`quantity-${line.id}`}><Input id={`quantity-${line.id}`} type="number" min="0.01" step="0.01" value={line.quantity} required onChange={(e) => updateLine(line.id, "quantity", e.target.value)} /></Field><Field label="Unité" id={`unit-${line.id}`}><select id={`unit-${line.id}`} value={line.unit} onChange={(e) => updateLine(line.id, "unit", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></Field><Button type="button" variant="ghost" size="icon" disabled={lines.length === 1} onClick={() => removeLine(line.id)} aria-label={`Supprimer la ligne ${index + 1}`}><Trash2 /></Button></div>)}
        </div></section>
        <section className="border border-border bg-card p-5 sm:p-7"><StepTitle number="03" title="Observation" /><div className="mt-6"><Label htmlFor="observation">Précision facultative</Label><Textarea id="observation" className="mt-2 min-h-28" value={data.observation} onChange={(e) => updateData("observation", e.target.value)} placeholder="Marque souhaitée, conditionnement, contrainte d’accès..." /></div></section>
      </div>
      <aside className="h-fit border border-border bg-card p-5 lg:sticky lg:top-24"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Récapitulatif</p>{issued ? <div className="mt-4 bg-muted p-4"><p className="text-xs text-muted-foreground">Numéro du bon</p><p className="mt-1 font-display text-lg font-bold text-primary">{issued.number}</p></div> : <p className="mt-4 text-sm leading-6 text-muted-foreground">Le numéro du bon sera généré lorsque vous téléchargerez ou partagerez le PDF.</p>}<div className="mt-5 border-l-4 border-accent bg-muted p-4"><p className="text-sm font-bold">Aucun paiement demandé</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Prix, disponibilité, transport et délai restent à confirmer par HECH Corporation SARL.</p></div>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<div className="mt-6 space-y-3"><Button type="button" size="xl" className="w-full" onClick={downloadPdf}><Download /> Télécharger le PDF</Button><Button type="button" variant="gold" size="xl" className="w-full" onClick={sharePdf}><MessageCircle /> Envoyer par WhatsApp</Button></div><p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Sur mobile, le partage du PDF sera proposé si votre appareil le permet.</p></aside>
    </form>
  </main><SiteFooter /></div>;
}

function makeOrderNumber() { const now = new Date(); const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`; return `HECH-BC-${date}-${String(now.getTime()).slice(-5)}`; }
function cleanPdfText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[—–]/g, "-"); }
function StepTitle({ number, title }: { number: string; title: string }) { return <div className="flex items-center gap-3"><span className="grid size-8 place-items-center bg-primary font-display text-xs font-bold text-primary-foreground">{number}</span><h2 className="text-xl font-bold">{title}</h2></div>; }
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>; }