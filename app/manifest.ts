import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Organizador · Programación de Soporte",
    short_name: "Byte PS",
    description: "Tablero compartido del equipo de programación de soporte técnico.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f10",
    theme_color: "#0e0f10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
