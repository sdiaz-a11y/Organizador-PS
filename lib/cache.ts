// Copia local de lo último que se cargó, para poder consultarlo sin conexión.
const PREFIJO = "orgps:";

export function leerCache<T>(clave: string): T | null {
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function guardarCache(clave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // almacenamiento lleno o bloqueado: la app sigue funcionando en línea
  }
}

// Al cerrar sesión se borra todo, para no dejar datos del equipo en un equipo compartido.
export function limpiarCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export const esErrorDeRed = (mensaje: string) =>
  (typeof navigator !== "undefined" && !navigator.onLine) || /fetch|network|failed to/i.test(mensaje);
