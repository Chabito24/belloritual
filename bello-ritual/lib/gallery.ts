export type GalleryItem = {
  src: string;
  alt: string;
  title?: string;
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/gallery/pesta.jpg",
    alt: "Diseño de pestañas realizado en Bello Ritual",
    title: "Pestañas",
  },
  {
    src: "/gallery/unas.jpg",
    alt: "Servicio de uñas realizado en Bello Ritual",
    title: "Uñas",
  },
  {
    src: "/gallery/depila.jpg",
    alt: "Resultado de depilación o cejas en Bello Ritual",
    title: "Cejas / Depilación",
  },
];