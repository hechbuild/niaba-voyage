import {
  BrickWall,
  Cable,
  Droplets,
  HardHat,
  PaintRoller,
  PanelsTopLeft,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export const COMPANY = {
  name: "HECH Corporation SARL",
  phoneDisplay: "+228 97 30 82 04",
  phoneWhatsapp: "22897308204",
  email: "hechcorporationtogo@gmail.com",
  address: "12 BP 203, Baguida — Lomé, Togo",
  domain: "hechcorporationtogo.com",
};

export const CATEGORIES = [
  { name: "Ciment & liants", icon: BrickWall, description: "Ciments, mortiers, chaux et solutions de scellement." },
  { name: "Fer & acier", icon: PanelsTopLeft, description: "Fers à béton, treillis, profilés et aciers de structure." },
  { name: "Toiture & étanchéité", icon: ShieldCheck, description: "Tôles, accessoires, membranes et produits d’étanchéité." },
  { name: "Carrelage & sanitaires", icon: Droplets, description: "Revêtements, faïence, équipements et accessoires sanitaires." },
  { name: "Plomberie", icon: Wrench, description: "Tubes, raccords, robinetterie et équipements hydrauliques." },
  { name: "Électricité", icon: Cable, description: "Câbles, gaines, appareillage et protection électrique." },
  { name: "Peinture & finition", icon: PaintRoller, description: "Peintures, enduits, colles et produits de finition." },
  { name: "Outillage & sécurité", icon: HardHat, description: "Outillage de chantier et équipements de protection." },
] as const;

export const UNITS = ["sacs", "tonnes", "barres", "pièces", "m²", "mètres", "rouleaux", "cartons", "unités"];