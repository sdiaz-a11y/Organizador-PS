export const ESTADOS = [
  { id: "idea", nombre: "Ideas", ayuda: "Aquí caen las ideas nuevas. Escribe una arriba.", pose: "pensando" },
  { id: "analisis", nombre: "En análisis", ayuda: "Se está revisando el alcance.", pose: "datos" },
  { id: "desarrollo", nombre: "En desarrollo", ayuda: "Alguien está programando esto.", pose: "laptop" },
  { id: "pruebas", nombre: "En pruebas", ayuda: "Listo para probar o revisar.", pose: "serio" },
  { id: "hecho", nombre: "Hecho", ayuda: "Cuando algo termine, arrástralo aquí.", pose: "celebrando" },
] as const;

export const CONSEJOS = [
  "Cuando una tarea pase a Hecho, anota en las notas qué funcionó y qué no.",
  "Asigna un responsable a cada idea que pase a análisis: así nadie la repite.",
  "Arrastra la tarjeta para cambiar de columna; el cambio queda registrado solo.",
  "Una idea corta y clara vale más que una larga: los detalles van en la descripción.",
  "Usa la prioridad alta solo para lo que de verdad no puede esperar.",
] as const;

export const PRIORIDADES = ["alta", "media", "baja"] as const;
export const TIPOS = [
  { id: "idea", nombre: "Idea" },
  { id: "bug", nombre: "Bug" },
  { id: "mejora", nombre: "Mejora" },
  { id: "automatizacion", nombre: "Automatización" },
  { id: "documentacion", nombre: "Documentación" },
] as const;

export type Estado = (typeof ESTADOS)[number]["id"];
export type Prioridad = (typeof PRIORIDADES)[number];
export type Tipo = (typeof TIPOS)[number]["id"];

export interface Perfil {
  id: string;
  nombre: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  estado: Estado;
  prioridad: Prioridad;
  tipo: Tipo;
  responsable: string | null;
  orden: number;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: string;
  tarea_id: string;
  autor: string | null;
  texto: string;
  sistema: boolean;
  created_at: string;
}

export const nombreEstado = (id: Estado) => ESTADOS.find((e) => e.id === id)?.nombre ?? id;
export const nombreTipo = (id: Tipo) => TIPOS.find((t) => t.id === id)?.nombre ?? id;
