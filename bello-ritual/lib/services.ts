// lib/services.ts
export type CategorySlug = "pestanas" | "unas" | "depilacion";

export type TabSlug =
  | "clasicas"
  | "volumen"
  | "lifting"
  | "retoque"
  | "manos"
  | "pies"
  | "acrilicas"
  | "facial"
  | "corporal"
  | "paquetes";

export type ServiceItem = {
  id: string;
  category: CategorySlug;
  tab: TabSlug;
  title: string;
  durationMin?: number;
  priceFrom: number;
  priceTo: number;
  bullets?: string[];
};

export const CATEGORIES: Record<
  CategorySlug,
  { slug: CategorySlug; label: string; subtitle: string; tabs: TabSlug[] }
> = {
  pestanas: {
    slug: "pestanas",
    label: "Pestañas",
    subtitle: "Extensiones, lifting y retoques",
    tabs: ["clasicas", "volumen", "lifting", "retoque"],
  },
  unas: {
    slug: "unas",
    label: "Uñas",
    subtitle: "Manicure, pedicure y acrílicas",
    tabs: ["manos", "pies", "acrilicas"],
  },
  depilacion: {
    slug: "depilacion",
    label: "Depilación",
    subtitle: "Facial y corporal",
    tabs: ["facial", "corporal", "paquetes"],
  },
};

export const TAB_LABEL: Record<TabSlug, string> = {
  clasicas: "Clásicas",
  volumen: "Volumen",
  lifting: "Lifting",
  retoque: "Retoque",
  manos: "Manos",
  pies: "Pies",
  acrilicas: "Acrílicas",
  facial: "Facial",
  corporal: "Corporal",
  paquetes: "Paquetes",
};

export const SERVICES: ServiceItem[] = [
  // PESTAÑAS
  {
    id: "lifting",
    category: "pestanas",
    tab: "lifting",
    title: "Lifting de pestañas",
    durationMin: 60,
    priceFrom: 140000,
    priceTo: 170000,
  },
  {
    id: "lifting-plus",
    category: "pestanas",
    tab: "lifting",
    title: "Lifting + tinte + botox",
    durationMin: 75,
    priceFrom: 160000,
    priceTo: 185000,
  },
  {
    id: "ext-clasicas",
    category: "pestanas",
    tab: "clasicas",
    title: "Extensiones clásicas (pelo a pelo)",
    durationMin: 90,
    priceFrom: 170000,
    priceTo: 200000,
  },
  {
    id: "volumen-2d3d",
    category: "pestanas",
    tab: "volumen",
    title: "Volumen 2D/3D",
    durationMin: 120,
    priceFrom: 250000,
    priceTo: 310000,
  },
  {
    id: "mant-clasico",
    category: "pestanas",
    tab: "retoque",
    title: "Mantenimiento clásico",
    durationMin: 60,
    priceFrom: 80000,
    priceTo: 110000,
  },
  {
    id: "mant-volumen",
    category: "pestanas",
    tab: "retoque",
    title: "Mantenimiento volumen",
    durationMin: 75,
    priceFrom: 145000,
    priceTo: 190000,
  },
  {
    id: "retiro-pestanas",
    category: "pestanas",
    tab: "retoque",
    title: "Retiro de pestañas",
    durationMin: 30,
    priceFrom: 30000,
    priceTo: 45000,
  },

  // UÑAS
  {
    id: "manicure-trad",
    category: "unas",
    tab: "manos",
    title: "Manicure tradicional",
    durationMin: 45,
    priceFrom: 30000,
    priceTo: 35000,
  },
  {
    id: "semi-1tono",
    category: "unas",
    tab: "manos",
    title: "Semipermanente (1 tono)",
    durationMin: 60,
    priceFrom: 55000,
    priceTo: 60000,
  },
  {
    id: "capping-gel",
    category: "unas",
    tab: "manos",
    title: "Capping gel (refuerzo)",
    durationMin: 75,
    priceFrom: 75000,
    priceTo: 90000,
  },
  {
    id: "soft-gel",
    category: "unas",
    tab: "acrilicas",
    title: "Soft gel tips",
    durationMin: 90,
    priceFrom: 120000,
    priceTo: 150000,
  },
  {
    id: "acrilicas-semi",
    category: "unas",
    tab: "acrilicas",
    title: "Acrílicas + semipermanente",
    durationMin: 120,
    priceFrom: 140000,
    priceTo: 170000,
  },
  {
    id: "retoque-acrilicas",
    category: "unas",
    tab: "acrilicas",
    title: "Retoque acrílicas",
    durationMin: 90,
    priceFrom: 110000,
    priceTo: 140000,
  },
  {
    id: "pedicure-trad",
    category: "unas",
    tab: "pies",
    title: "Pedicure tradicional",
    durationMin: 60,
    priceFrom: 35000,
    priceTo: 45000,
  },
  {
    id: "pedicure-semi",
    category: "unas",
    tab: "pies",
    title: "Pedicure semipermanente",
    durationMin: 75,
    priceFrom: 48000,
    priceTo: 65000,
  },
  {
    id: "pedicure-spa",
    category: "unas",
    tab: "pies",
    title: "Pedicure spa (exfoliación + hidratación)",
    durationMin: 80,
    priceFrom: 45000,
    priceTo: 60000,
  },

  // DEPILACIÓN
  {
    id: "cejas",
    category: "depilacion",
    tab: "facial",
    title: "Cejas (cera)",
    durationMin: 15,
    priceFrom: 18000,
    priceTo: 28000,
  },
  {
    id: "bigote",
    category: "depilacion",
    tab: "facial",
    title: "Bigote / bozo",
    durationMin: 10,
    priceFrom: 12000,
    priceTo: 18000,
  },
  {
    id: "axilas",
    category: "depilacion",
    tab: "corporal",
    title: "Axilas",
    durationMin: 15,
    priceFrom: 16000,
    priceTo: 20000,
  },
  {
    id: "bikini-linea",
    category: "depilacion",
    tab: "corporal",
    title: "Bikini línea",
    durationMin: 25,
    priceFrom: 40000,
    priceTo: 55000,
  },
  {
    id: "bikini-completo",
    category: "depilacion",
    tab: "corporal",
    title: "Bikini completo",
    durationMin: 35,
    priceFrom: 50000,
    priceTo: 65000,
  },
  {
    id: "media-pierna",
    category: "depilacion",
    tab: "corporal",
    title: "Media pierna",
    durationMin: 30,
    priceFrom: 31000,
    priceTo: 50000,
  },
  {
    id: "pierna-completa",
    category: "depilacion",
    tab: "corporal",
    title: "Pierna completa",
    durationMin: 45,
    priceFrom: 58000,
    priceTo: 80000,
  },
  {
    id: "paquete-5zonas",
    category: "depilacion",
    tab: "paquetes",
    title: "Paquete (5 zonas)",
    durationMin: 60,
    priceFrom: 110000,
    priceTo: 140000,
  },
];

export const DOMICILIO = [
  { zone: "Zona 1 (Bello, Niquía, cercanos)", extra: 10000 },
  { zone: "Zona 2 (Medellín cercano)", extra: 15000 },
  { zone: "Zona 3 (Itagüí, Envigado, Copacabana, lejos)", extra: 20000 },
];